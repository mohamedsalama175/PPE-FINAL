import { describe, it, expect, beforeEach } from 'vitest';
import { resetStore, store, loginAs, ADMIN, makeTrackedItem, stockIn } from '../test/storeTestUtils';
import { CATALOG_COLUMNS, exportCatalogRows, previewCatalogImport, applyCatalogImport } from './catalogIO';

const toRow = (cells: string[]) => Object.fromEntries(CATALOG_COLUMNS.map((h, i) => [h, cells[i] ?? '']));

const baseRow = (over: Record<string, string> = {}) => ({
  'Item Code': 'NEW-001', 'Name': 'New Helmet', 'Category': 'Head', 'Item Group': 'HEAD', 'Unit of Measure': 'pcs',
  'Lifespan Value': '6', 'Lifespan Unit': 'Months', 'Risk Category': 'II', 'Locations': 'HQ-WH-01',
  'Reorder Levels': 'HQ-WH-01:5', 'Variant Values': 'COLOR=Yellow', 'Serial Number tracked': 'No',
  'Description': '', 'Manufacturer': '', 'Model': '', 'Standard / Certification': '', 'Active': 'Yes', ...over,
});

describe('PPE-007 catalog export and import', () => {
  beforeEach(() => { resetStore(); loginAs(ADMIN); });

  it('export has a single Name column (no Arabic), the unit Code and Serial Number tracked', () => {
    expect(CATALOG_COLUMNS).toContain('Name');
    expect(CATALOG_COLUMNS.join(',')).not.toMatch(/AR|Arabic/);
    const gas = store().ppeItems.find(p => p.itemCode === 'GASDET-4G')!;
    const [row] = exportCatalogRows(store(), [gas]);
    const r = toRow(row);
    expect(r['Unit of Measure']).toBe('PCS');
    expect(r['Serial Number tracked']).toBe('Yes');
    expect(r['Name']).toBe('Portable 4-Gas Detector');
  });

  it('an exported file imports back as updates with no errors (round trip)', () => {
    const items = store().ppeItems.filter(p => !p.deletedAt);
    const rows = exportCatalogRows(store(), items).map(toRow);
    const preview = previewCatalogImport(store(), rows, 'upsert');
    expect(preview.errors).toEqual([]);
    expect(preview.toUpdate).toHaveLength(items.length);
    expect(preview.toAdd).toHaveLength(0);
  });

  it('adds a new item with the unit resolved from its Code and the serial flag', () => {
    const preview = previewCatalogImport(store(), [baseRow({ 'Serial Number tracked': 'Yes' })], 'add');
    expect(preview.errors).toEqual([]);
    const res = applyCatalogImport(store().saveEntity, preview);
    expect(res).toEqual({ added: 1, updated: 0, errors: [] });
    const item = store().ppeItems.find(p => p.itemCode === 'NEW-001')!;
    expect(item.unitId).toBe('uom-pcs');
    expect(item.serialTracked).toBe(true);
    expect(store().auditLogs[0]).toMatchObject({ action: 'CREATE', reason: 'Catalog import' });
  });

  it('rejects rows with a blank or repeated code, unknown or inactive unit, and existing code in Add mode', () => {
    const set = store().units.find(u => u.code === 'SET')!;
    store().toggleEntityActive('units', set.id, false);
    const preview = previewCatalogImport(store(), [
      baseRow({ 'Item Code': '' }),
      baseRow({ 'Item Code': 'A-1' }),
      baseRow({ 'Item Code': 'a-1' }),
      baseRow({ 'Item Code': 'A-2', 'Unit of Measure': 'NOPE' }),
      baseRow({ 'Item Code': 'A-3', 'Unit of Measure': 'SET' }),
      baseRow({ 'Item Code': 'HELM-YEL' }),
      baseRow({ 'Item Code': 'A-4', 'Unit of Measure': '' }),
    ], 'add');
    expect(preview.errors.map(e => [e.row, e.reason])).toEqual([
      [2, 'Item Code is blank.'],
      [4, 'Item Code is repeated in the file.'],
      [5, 'Unit of Measure "NOPE" does not exist.'],
      [6, 'Unit of Measure "SET" is inactive.'],
      [7, 'Already exists.'],
      [8, 'Unit of Measure Code is required.'],
    ]);
    expect(preview.toAdd.map(i => i.itemCode)).toEqual(['A-1']);
  });

  it('update mode follows PPE-002: no serial flag change after a transaction, no deactivating an in-use item', () => {
    const tracked = makeTrackedItem('LOCKED-1');
    stockIn(tracked, 'loc-1', ['SN-1']);
    const item = store().ppeItems.find(p => p.id === tracked)!;
    const exported = toRow(exportCatalogRows(store(), [item])[0]);
    const helm = toRow(exportCatalogRows(store(), [store().ppeItems.find(p => p.id === 'ppe-1')!])[0]);
    const preview = previewCatalogImport(store(), [
      { ...exported, 'Serial Number tracked': 'No' },
      { ...helm, 'Active': 'No' },
    ], 'upsert');
    expect(preview.errors.map(e => e.reason)).toEqual([
      'Serial Number tracked is locked after the first transaction.',
      expect.stringMatching(/^Cannot deactivate an item in use/),
    ]);
  });
});
