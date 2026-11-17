/**
 * Data migrations for the PPE module.
 *
 * The app keeps its data in the client store, so a "migration" is a pure, reversible
 * transform of the record arrays. Each one has an `up` and a `down`, never drops data
 * without first returning what it removed, and is covered by tests in migrations.test.ts.
 */
import { UnitOfMeasure } from '../types';

type AnyRecord = Record<string, any>;

// ---------------------------------------------------------------------------
// Change A: English-only names and descriptions (G13)
// ---------------------------------------------------------------------------

/** Entity collections that used to carry Arabic name / description fields. */
export const ENGLISH_ONLY_COLLECTIONS = ['attributes', 'itemGroups', 'locations', 'ppeItems', 'kits', 'jobPositions', 'units'] as const;
export type EnglishOnlyCollection = typeof ENGLISH_ONLY_COLLECTIONS[number];
export type EnglishOnlyData = Partial<Record<EnglishOnlyCollection, AnyRecord[]>>;

export interface ArabicOnlyConflict {
  collection: EnglishOnlyCollection;
  id: string;
  field: 'name' | 'description';
  arabicValue: string;
}

/** Archive of removed Arabic values, kept so the migration can be reversed. */
export type ArabicArchive = Partial<Record<EnglishOnlyCollection, Record<string, { nameAr?: string; descriptionAr?: string }>>>;

const blank = (v: unknown) => !String(v ?? '').trim();

/**
 * Records whose English value is empty but whose Arabic value is filled.
 * The migration refuses to run while any exist: these need a human decision.
 */
export function findArabicOnlyConflicts(data: EnglishOnlyData): ArabicOnlyConflict[] {
  const out: ArabicOnlyConflict[] = [];
  for (const collection of ENGLISH_ONLY_COLLECTIONS) {
    for (const r of data[collection] || []) {
      const enName = r.name ?? r.nameEn;
      const enDesc = r.description ?? r.descriptionEn;
      if (blank(enName) && !blank(r.nameAr)) out.push({ collection, id: r.id, field: 'name', arabicValue: r.nameAr });
      if ('descriptionAr' in r && blank(enDesc) && !blank(r.descriptionAr)) {
        out.push({ collection, id: r.id, field: 'description', arabicValue: r.descriptionAr });
      }
    }
  }
  return out;
}

export function migrateEnglishOnlyUp(data: EnglishOnlyData): { data: EnglishOnlyData; archive: ArabicArchive } {
  const conflicts = findArabicOnlyConflicts(data);
  if (conflicts.length > 0) {
    const list = conflicts.map(c => `${c.collection}/${c.id} (${c.field})`).join(', ');
    throw new Error(`English-only migration stopped: ${conflicts.length} record(s) have an Arabic value but no English value: ${list}`);
  }

  const archive: ArabicArchive = {};
  const result: EnglishOnlyData = {};
  for (const collection of ENGLISH_ONLY_COLLECTIONS) {
    const list = data[collection];
    if (!list) continue;
    result[collection] = list.map(r => {
      const { nameEn, nameAr, descriptionEn, descriptionAr, ...rest } = r;
      if (nameAr !== undefined || descriptionAr !== undefined) {
        archive[collection] = archive[collection] || {};
        archive[collection]![r.id] = { nameAr, descriptionAr };
      }
      const next: AnyRecord = { ...rest };
      if (nameEn !== undefined || rest.name !== undefined) next.name = rest.name ?? nameEn;
      if (descriptionEn !== undefined || rest.description !== undefined) next.description = rest.description ?? descriptionEn;
      return next;
    });
  }
  return { data: result, archive };
}

export function migrateEnglishOnlyDown(data: EnglishOnlyData, archive: ArabicArchive): EnglishOnlyData {
  const result: EnglishOnlyData = {};
  for (const collection of ENGLISH_ONLY_COLLECTIONS) {
    const list = data[collection];
    if (!list) continue;
    result[collection] = list.map(r => {
      const saved = archive[collection]?.[r.id];
      if (!saved) return r;
      const next: AnyRecord = { ...r };
      if (saved.nameAr !== undefined) next.nameAr = saved.nameAr;
      if (saved.descriptionAr !== undefined) next.descriptionAr = saved.descriptionAr;
      return next;
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Change B: Units of Measure (Epic 11)
// ---------------------------------------------------------------------------

export const DEFAULT_UNITS: Pick<UnitOfMeasure, 'id' | 'code' | 'name' | 'symbol'>[] = [
  { id: 'uom-pcs', code: 'PCS', name: 'Piece', symbol: 'pc' },
  { id: 'uom-prs', code: 'PRS', name: 'Pair', symbol: 'pr' },
  { id: 'uom-set', code: 'SET', name: 'Set', symbol: 'set' },
];

export interface SystemFlags {
  /** PPE-056 one-time marker: set after the default units were created once. */
  defaultUnitsSeeded?: boolean;
}

/**
 * PPE-056: create PCS, PRS and SET once. Idempotent through the one-time marker:
 * once seeded it never runs again, so a default the Admin renamed or trashed is never touched or recreated.
 * Before the marker is set, a default whose Code already exists (any case, trashed included) is skipped.
 */
export function seedDefaultUnits(
  units: UnitOfMeasure[],
  flags: SystemFlags,
  now: string = new Date().toISOString()
): { units: UnitOfMeasure[]; flags: SystemFlags; created: string[] } {
  if (flags.defaultUnitsSeeded) return { units, flags, created: [] };
  const taken = new Set(units.map(u => u.code.toUpperCase()));
  const created: UnitOfMeasure[] = DEFAULT_UNITS
    .filter(d => !taken.has(d.code))
    .map(d => ({ ...d, active: true, deletedAt: null, createdAt: now, createdBy: 'system' }));
  return {
    units: [...units, ...created],
    flags: { ...flags, defaultUnitsSeeded: true },
    created: created.map(u => u.code),
  };
}

export interface UnitMappingRow {
  legacyValue: string;
  unitId: string;
  unitCode: string;
  createdUnit: boolean;
  itemCount: number;
}

/** Turns a free-text unit value into a unit Code: upper-case, one word. */
export function legacyUnitToCode(value: string): string {
  return String(value).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'UNIT';
}

/**
 * Change B item migration: replace the free-text `uom` on each item with `unitId`.
 * A legacy value is matched to an existing unit by Code, Name or Symbol (case-insensitive),
 * otherwise a new Active unit is created for it. Returns the mapping for the report.
 */
export function migrateFreeTextUnitsUp(
  items: AnyRecord[],
  units: UnitOfMeasure[],
  now: string = new Date().toISOString()
): { items: AnyRecord[]; units: UnitOfMeasure[]; mapping: UnitMappingRow[] } {
  const nextUnits = [...units];
  const mapping = new Map<string, UnitMappingRow>();

  const findUnit = (value: string) => {
    const v = value.trim().toLowerCase();
    return nextUnits.find(u => u.code.toLowerCase() === v || u.name.toLowerCase() === v || u.symbol.toLowerCase() === v);
  };

  const nextItems = items.map(item => {
    if (item.unitId || item.uom === undefined) return item;
    const legacy = String(item.uom || '').trim() || 'Piece';
    const key = legacy.toLowerCase();
    let row = mapping.get(key);
    if (!row) {
      let unit = findUnit(legacy);
      let createdUnit = false;
      if (!unit) {
        let code = legacyUnitToCode(legacy);
        let n = 2;
        while (nextUnits.some(u => u.code.toUpperCase() === code)) code = `${legacyUnitToCode(legacy)}${n++}`;
        unit = {
          id: `uom-${code.toLowerCase()}`,
          code,
          name: legacy,
          symbol: legacy.toLowerCase().slice(0, 6),
          active: true,
          deletedAt: null,
          createdAt: now,
          createdBy: 'migration',
        };
        nextUnits.push(unit);
        createdUnit = true;
      }
      row = { legacyValue: legacy, unitId: unit.id, unitCode: unit.code, createdUnit, itemCount: 0 };
      mapping.set(key, row);
    }
    row.itemCount++;
    const { uom, ...rest } = item;
    return { ...rest, unitId: row.unitId };
  });

  return { items: nextItems, units: nextUnits, mapping: [...mapping.values()] };
}

/** Reverse of migrateFreeTextUnitsUp: puts the unit Name back as free text and removes the units it created. */
export function migrateFreeTextUnitsDown(
  items: AnyRecord[],
  units: UnitOfMeasure[],
  mapping: UnitMappingRow[]
): { items: AnyRecord[]; units: UnitOfMeasure[] } {
  const byId = new Map(units.map(u => [u.id, u]));
  const legacyById = new Map(mapping.map(m => [m.unitId, m.legacyValue]));
  const nextItems = items.map(item => {
    if (!item.unitId) return item;
    const { unitId, ...rest } = item;
    return { ...rest, uom: legacyById.get(unitId) ?? byId.get(unitId)?.name ?? '' };
  });
  const created = new Set(mapping.filter(m => m.createdUnit).map(m => m.unitId));
  return { items: nextItems, units: units.filter(u => !created.has(u.id)) };
}
