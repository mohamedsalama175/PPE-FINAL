/**
 * Serial unit engine (Epic 12). Pure functions over the serial arrays.
 *
 * Every serial change in the store goes through `registerSerialUnits` or `moveSerialUnits`.
 * Both validate the whole request first and return either an error (nothing changes) or the
 * complete new arrays, so a save is all or nothing. The store applies the result in the same
 * synchronous action that validated it, which is what keeps one unit from being taken twice
 * (see the concurrency test in serials.test.ts).
 */
import { SerialEvent, SerialEventType, SerialStatus, SerialUnit } from '../types';
import { generateId } from '../lib/utils';
import { normalizeSerial, SerialEntryError, validateSerialEntry } from '../lib/serials';

export interface RegisterParams {
  ppeItemId: string;
  serials: string[];
  locationId: string;
  batchNumber?: string;
  userId: string;
  reference?: string;
  now?: string;
}

/** On failure `errors` is filled and the arrays are returned unchanged. */
export interface RegisterResult {
  ok: boolean;
  serialUnits: SerialUnit[];
  serialEvents: SerialEvent[];
  created: SerialUnit[];
  errors: SerialEntryError[];
}

export function registerSerialUnits(
  units: SerialUnit[],
  events: SerialEvent[],
  params: RegisterParams,
  describe: (u: SerialUnit) => string
): RegisterResult {
  const now = params.now || new Date().toISOString();
  const byItem = new Map<string, SerialUnit>();
  for (const u of units) if (u.ppeItemId === params.ppeItemId) byItem.set(u.serial, u);

  if (params.serials.length === 0) {
    return { ok: false, serialUnits: units, serialEvents: events, created: [], errors: [{ index: 0, serial: '', code: 'blank', message: 'Enter at least one serial number.' }] };
  }
  const errors = validateSerialEntry(params.serials, s => {
    const u = byItem.get(s);
    return u ? describe(u) : null;
  });
  if (errors.length > 0) return { ok: false, serialUnits: units, serialEvents: events, created: [], errors };

  const created: SerialUnit[] = params.serials.map(raw => ({
    id: generateId(),
    ppeItemId: params.ppeItemId,
    serial: normalizeSerial(raw),
    status: 'In Stock',
    locationId: params.locationId,
    lastLocationId: params.locationId,
    batchNumber: params.batchNumber,
    createdAt: now,
    createdBy: params.userId,
    updatedAt: now,
    updatedBy: params.userId,
  }));
  const newEvents: SerialEvent[] = created.map(u => ({
    id: generateId(),
    serialUnitId: u.id,
    type: 'Stock in',
    date: now,
    userId: params.userId,
    toLocationId: params.locationId,
    reference: params.reference,
  }));
  return { ok: true, serialUnits: [...units, ...created], serialEvents: [...events, ...newEvents], created, errors: [] };
}

export interface MoveParams {
  ppeItemId: string;
  serialIds: string[];
  /** What each unit must look like now. */
  expect: { status: SerialStatus; locationId?: string; holderIssuanceId?: string };
  /** What each unit becomes. `locationId: undefined` means it leaves stock. */
  to: { status: SerialStatus; locationId?: string; holderEmployeeId?: string; holderName?: string; holderIssuanceId?: string };
  /** One or more events written per unit, in order (e.g. Loan return then Scrap). */
  eventTypes: SerialEventType[];
  userId: string;
  reference?: string;
  note?: string;
  now?: string;
}

/** On failure `message` explains why and the arrays are returned unchanged. */
export interface MoveResult {
  ok: boolean;
  serialUnits: SerialUnit[];
  serialEvents: SerialEvent[];
  moved: SerialUnit[];
  message?: string;
  serial?: SerialUnit;
}

export function moveSerialUnits(
  units: SerialUnit[],
  events: SerialEvent[],
  params: MoveParams,
  describe: (u: SerialUnit) => string
): MoveResult {
  const now = params.now || new Date().toISOString();
  const fail = (message: string, serial?: SerialUnit): MoveResult => ({ ok: false, serialUnits: units, serialEvents: events, moved: [], message, serial });
  if (params.serialIds.length === 0) return fail('Pick at least one serial number.');
  if (new Set(params.serialIds).size !== params.serialIds.length) {
    return fail('The same serial number was picked twice.');
  }

  const index = new Map(units.map((u, i) => [u.id, i]));
  for (const id of params.serialIds) {
    const i = index.get(id);
    const u = i === undefined ? undefined : units[i];
    if (!u) return fail(`Serial ${id} does not exist.`);
    if (u.ppeItemId !== params.ppeItemId) return fail(`${u.serial} belongs to a different item.`, u);
    if (params.expect.holderIssuanceId !== undefined && u.holderIssuanceId !== params.expect.holderIssuanceId) {
      return fail(`${u.serial} is not held by this person. ${describe(u)}.`, u);
    }
    if (u.status !== params.expect.status) {
      return fail(`${u.serial} is not ${params.expect.status} (${describe(u)}).`, u);
    }
    if (params.expect.locationId !== undefined && u.locationId !== params.expect.locationId) {
      return fail(`${u.serial} is not In Stock at this location (${describe(u)}).`, u);
    }
  }

  const next = [...units];
  const moved: SerialUnit[] = [];
  const newEvents: SerialEvent[] = [];
  for (const id of params.serialIds) {
    const i = index.get(id)!;
    const before = next[i];
    const after: SerialUnit = {
      ...before,
      status: params.to.status,
      locationId: params.to.locationId,
      lastLocationId: params.to.locationId ?? before.lastLocationId,
      holderEmployeeId: params.to.holderEmployeeId,
      holderName: params.to.holderName,
      holderIssuanceId: params.to.holderIssuanceId,
      updatedAt: now,
      updatedBy: params.userId,
    };
    next[i] = after;
    moved.push(after);
    for (const type of params.eventTypes) {
      newEvents.push({
        id: generateId(),
        serialUnitId: id,
        type,
        date: now,
        userId: params.userId,
        fromLocationId: before.locationId,
        toLocationId: params.to.locationId,
        reference: params.reference,
        holderEmployeeId: params.to.holderEmployeeId ?? before.holderEmployeeId,
        holderName: params.to.holderName ?? before.holderName,
        note: params.note,
      });
    }
  }
  return { ok: true, serialUnits: next, serialEvents: [...events, ...newEvents], moved };
}

/** Statuses that sit physically at a location and count toward its On Hand. */
export const ON_HAND_SERIAL_STATUSES: SerialStatus[] = ['In Stock', 'Scrapped'];

export function serialOnHand(units: SerialUnit[], ppeItemId: string, locationId: string): number {
  return units.filter(u => u.ppeItemId === ppeItemId && u.locationId === locationId && ON_HAND_SERIAL_STATUSES.includes(u.status)).length;
}
