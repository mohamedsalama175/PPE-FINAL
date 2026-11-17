import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as mockData from './mockData';
import {
  findArabicOnlyConflicts, migrateEnglishOnlyUp, migrateEnglishOnlyDown,
  migrateFreeTextUnitsUp, migrateFreeTextUnitsDown, seedDefaultUnits, DEFAULT_UNITS,
} from './migrations';
import { UnitOfMeasure } from '../types';
import { resetStore, store, loginAs, ADMIN } from '../test/storeTestUtils';
import { translations } from '../i18n/translations';

describe('Change A: English-only names', () => {
  const legacy = {
    attributes: [{ id: 'a1', code: 'SIZE', nameEn: 'Size', nameAr: 'المقاس', active: true, values: [] }],
    ppeItems: [{ id: 'p1', itemCode: 'H1', nameEn: 'Helmet', nameAr: 'خوذة', descriptionEn: 'Hard hat', descriptionAr: 'خوذة صلبة' }],
    kits: [{ id: 'k1', nameEn: 'Kit', nameAr: 'طقم' }],
    jobPositions: [{ id: 'j1', code: 'JP', nameEn: 'Welder', nameAr: 'لحام' }],
  };

  it('keeps the English value as the only Name and drops the Arabic fields', () => {
    const { data } = migrateEnglishOnlyUp(legacy);
    expect(data.ppeItems![0]).toEqual({ id: 'p1', itemCode: 'H1', name: 'Helmet', description: 'Hard hat' });
    expect(data.attributes![0]).not.toHaveProperty('nameAr');
    expect(data.kits![0].name).toBe('Kit');
    expect(data.jobPositions![0].name).toBe('Welder');
  });

  it('is reversible: down restores the Arabic values it archived', () => {
    const { data, archive } = migrateEnglishOnlyUp(legacy);
    const back = migrateEnglishOnlyDown(data, archive);
    expect(back.ppeItems![0].nameAr).toBe('خوذة');
    expect(back.ppeItems![0].descriptionAr).toBe('خوذة صلبة');
    expect(back.attributes![0].nameAr).toBe('المقاس');
  });

  it('stops and reports records with an Arabic value but no English value', () => {
    const bad = { locations: [{ id: 'l1', code: 'L1', nameEn: '', nameAr: 'مخزن' }] };
    expect(findArabicOnlyConflicts(bad)).toEqual([{ collection: 'locations', id: 'l1', field: 'name', arabicValue: 'مخزن' }]);
    expect(() => migrateEnglishOnlyUp(bad)).toThrow(/locations\/l1/);
  });

  it('no Arabic field remains in the types, seed data or store', () => {
    const typesSrc = fs.readFileSync(path.join(__dirname, '..', 'types', 'index.ts'), 'utf8');
    expect(typesSrc).not.toMatch(/nameAr|descriptionAr|nameEn|descriptionEn/);
    const all = Object.values(mockData).filter(Array.isArray).flat() as Record<string, unknown>[];
    for (const r of all) {
      expect(r).not.toHaveProperty('nameAr');
      expect(r).not.toHaveProperty('descriptionAr');
    }
    resetStore();
    const s = store();
    for (const list of [s.attributes, s.itemGroups, s.locations, s.ppeItems, s.kits, s.jobPositions, s.units]) {
      for (const r of list as any[]) expect(r.nameAr).toBeUndefined();
    }
    expect(findArabicOnlyConflicts(mockData as any)).toEqual([]);
  });

  it('UI labels still switch to Arabic (only stored data is English-only)', () => {
    expect(translations.ar.unitsOfMeasure).toBe('وحدات القياس');
    expect(translations.ar.serialNumbers).toBe('الأرقام التسلسلية');
    // every English label has an Arabic one
    for (const key of Object.keys(translations.en)) expect((translations.ar as any)[key], key).toBeTruthy();
  });
});

describe('Change B: free-text unit migration', () => {
  const items = [
    { id: 'p1', uom: 'Piece' },
    { id: 'p2', uom: 'pair' },
    { id: 'p3', uom: 'Box' },
    { id: 'p4', uom: 'Box' },
  ];
  const seeded = seedDefaultUnits([], {}, '2026-01-01T00:00:00Z').units;

  it('maps existing values to units by name, creates a unit for unknown values, and reports the mapping', () => {
    const res = migrateFreeTextUnitsUp(items, seeded, '2026-01-01T00:00:00Z');
    expect(res.items.map(i => i.unitId)).toEqual(['uom-pcs', 'uom-prs', 'uom-box', 'uom-box']);
    expect(res.items.every(i => !('uom' in i))).toBe(true);
    expect(res.mapping).toEqual([
      { legacyValue: 'Piece', unitId: 'uom-pcs', unitCode: 'PCS', createdUnit: false, itemCount: 1 },
      { legacyValue: 'pair', unitId: 'uom-prs', unitCode: 'PRS', createdUnit: false, itemCount: 1 },
      { legacyValue: 'Box', unitId: 'uom-box', unitCode: 'BOX', createdUnit: true, itemCount: 2 },
    ]);
    expect(res.units.find(u => u.code === 'BOX')).toMatchObject({ name: 'Box', active: true });
  });

  it('is reversible', () => {
    const up = migrateFreeTextUnitsUp(items, seeded);
    const down = migrateFreeTextUnitsDown(up.items, up.units, up.mapping);
    expect(down.items.map(i => i.uom)).toEqual(['Piece', 'pair', 'Box', 'Box']);
    expect(down.units.map(u => u.code)).toEqual(['PCS', 'PRS', 'SET']);
  });

  it('every seed item references an existing unit', () => {
    resetStore();
    const ids = new Set(store().units.map(u => u.id));
    for (const p of store().ppeItems) expect(ids.has(p.unitId), p.itemCode).toBe(true);
  });
});

describe('PPE-056: default units seed', () => {
  beforeEach(() => { resetStore(); loginAs(ADMIN); });

  it('creates PCS, PRS and SET once, all Active', () => {
    const res = seedDefaultUnits([], {});
    expect(res.created).toEqual(['PCS', 'PRS', 'SET']);
    expect(res.units.map(u => [u.code, u.name, u.symbol, u.active])).toEqual(
      DEFAULT_UNITS.map(d => [d.code, d.name, d.symbol, true])
    );
    expect(res.flags.defaultUnitsSeeded).toBe(true);
  });

  it('never runs twice: no duplicates and no changes', () => {
    const first = seedDefaultUnits([], {});
    const second = seedDefaultUnits(first.units, first.flags);
    expect(second.created).toEqual([]);
    expect(second.units).toBe(first.units);
  });

  it('the app starts seeded, and re-running keeps a renamed default as it is', () => {
    const s = store();
    expect(s.systemFlags.defaultUnitsSeeded).toBe(true);
    const pcs = s.units.find(u => u.code === 'PCS')!;
    expect(s.saveEntity('units', { ...pcs, name: 'Unit' }).success).toBe(true);
    expect(store().runDefaultUnitSeed().created).toEqual([]);
    expect(store().units.find(u => u.code === 'PCS')!.name).toBe('Unit');
    expect(store().units.filter(u => u.code === 'PCS')).toHaveLength(1);
  });

  it('never recreates a default unit the Admin trashed', () => {
    const set = store().units.find(u => u.code === 'SET')!;
    expect(store().softDeleteEntity('units', set.id).success).toBe(true);
    store().runDefaultUnitSeed();
    const sets = store().units.filter(u => u.code === 'SET');
    expect(sets).toHaveLength(1);
    expect(sets[0].deletedAt).toBeTruthy();
  });

  it('before the marker is set, an existing code is not duplicated', () => {
    const existing: UnitOfMeasure[] = [{ id: 'x', code: 'pcs', name: 'My piece', symbol: 'p', active: false, createdAt: '', createdBy: '' }];
    const res = seedDefaultUnits(existing, {});
    expect(res.created).toEqual(['PRS', 'SET']);
    expect(res.units.find(u => u.id === 'x')!.name).toBe('My piece');
  });
});
