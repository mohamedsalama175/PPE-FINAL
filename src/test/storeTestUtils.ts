import { usePPEStore, AppState } from '../store/useStore';
import { Employee } from '../types';

// Snapshot of the store exactly as the app starts (seed data, PPE-056 units already seeded).
const initial = usePPEStore.getState();

/** Restore the store to its start-up state with fresh copies of every record. */
export function resetStore() {
  const fresh: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(initial)) fresh[k] = typeof v === 'function' ? v : structuredClone(v);
  usePPEStore.setState(fresh as unknown as AppState, true);
}

export const store = () => usePPEStore.getState();

export function loginAs(employeeId: string): Employee {
  const emp = store().employees.find(e => e.id === employeeId)!;
  store().setCurrentUser(emp);
  return emp;
}

export const ADMIN = 'emp-1';
export const HSE = 'emp-2';
export const STORE_KEEPER = 'emp-8'; // assigned to loc-1, loc-2, loc-5, loc-6
export const EMPLOYEE = 'emp-4';

export function auditActions(): string[] {
  return store().auditLogs.map(l => `${l.action}:${l.objectReference}`);
}

export function lastAudit() {
  return store().auditLogs[0];
}

/** Create a serial-tracked item with no transactions, linked to loc-1 and loc-2. */
export function makeTrackedItem(code = 'RADIO-01', riskCategory: 'I' | 'II' | 'III' = 'II') {
  const id = `item-${code.toLowerCase()}`;
  const res = store().saveEntity('ppeItems', {
    id,
    itemCode: code,
    name: `Test ${code}`,
    category: 'Head',
    itemGroupId: 'ig-1',
    hasSize: false,
    gender: 'Unisex',
    lifespanType: 'Years',
    lifespanValue: 2,
    description: '',
    manufacturer: '',
    model: '',
    standardCertification: '',
    riskCategory,
    reorderLevel: 1,
    active: true,
    locationIds: ['loc-1', 'loc-2', 'loc-3', 'loc-5'],
    variantAttributeValueIds: [],
    unitId: 'uom-pcs',
    serialTracked: true,
  } as any);
  if (!res.success) throw new Error(res.message);
  return id;
}

/** Stock IN serials for an item at a location (applied immediately). */
export function stockIn(ppeItemId: string, locationId: string, serialNumbers: string[], batchNumber = 'B-TEST-1') {
  return store().adjustStock({
    type: 'IN',
    reference: `ADJ-IN-${Math.random().toString(36).slice(2, 7)}`,
    ppeItemId,
    locationId,
    batchNumber,
    quantityDelta: 0,
    reasonCategory: 'Supplier Delivery',
    reason: 'Test receipt of serial units',
    submittedBy: STORE_KEEPER,
    serialNumbers,
  });
}

export function serialId(ppeItemId: string, serial: string): string {
  const u = store().serialUnits.find(s => s.ppeItemId === ppeItemId && s.serial === serial);
  if (!u) throw new Error(`no serial ${serial}`);
  return u.id;
}

export function serial(ppeItemId: string, serialText: string) {
  return store().serialUnits.find(s => s.ppeItemId === ppeItemId && s.serial === serialText)!;
}

export function onHand(ppeItemId: string, locationId: string): number {
  return store().stockBalances.find(b => b.ppeItemId === ppeItemId && b.locationId === locationId)?.quantityOnHand || 0;
}
