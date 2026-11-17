/**
 * PPE-007 catalog export and import (pure functions, used by Catalog.tsx and tests).
 * Names are English only (G13). The unit is referenced by its Code (PPE-051).
 */
import type { AppState } from '../store/useStore';
import { PPEItem } from '../types';
import { generateId } from './utils';

export const CATALOG_COLUMNS = [
  'Item Code', 'Name', 'Category', 'Item Group', 'Unit of Measure', 'Lifespan Value', 'Lifespan Unit',
  'Risk Category', 'Locations', 'Reorder Levels', 'Variant Values', 'Serial Number tracked',
  'Description', 'Manufacturer', 'Model', 'Standard / Certification', 'Active',
] as const;

export const CATEGORIES = ['Head', 'Eye & Face', 'Hearing', 'Respiratory', 'Hand', 'Foot', 'Body', 'Fall Protection'];

type State = Pick<AppState, 'ppeItems' | 'itemGroups' | 'units' | 'locations' | 'attributes' | 'checkInUse' | 'itemHasTransactions'>;
type Row = Record<string, string>;

const yes = (v: string) => /^(yes|y|true|1)$/i.test(String(v ?? '').trim());

export function exportCatalogRows(state: State, items: PPEItem[]): string[][] {
  return items.map(item => {
    const group = state.itemGroups.find(g => g.id === item.itemGroupId);
    const unit = state.units.find(u => u.id === item.unitId);
    const locCode = (id: string) => state.locations.find(l => l.id === id)?.code || id;
    const reorders = (item.locationReorderLevels || []).map(r => `${locCode(r.locationId)}:${r.reorderLevel}`).join(';');
    const variants = state.attributes
      .map(a => {
        const vals = a.values.filter(v => item.variantAttributeValueIds?.includes(v.id)).map(v => v.value);
        return vals.length ? `${a.code}=${vals.join('|')}` : '';
      })
      .filter(Boolean)
      .join(';');
    return [
      item.itemCode, item.name, item.category, group?.code || '', unit?.code || '',
      String(item.lifespanValue), item.lifespanType, item.riskCategory,
      item.locationIds.map(locCode).join(';'), reorders, variants, item.serialTracked ? 'Yes' : 'No',
      item.description || '', item.manufacturer || '', item.model || '', item.standardCertification || '',
      item.active ? 'Yes' : 'No',
    ];
  });
}

export type ImportMode = 'add' | 'upsert';

export interface ImportError { row: number; code: string; reason: string }

export interface ImportPreview {
  toAdd: PPEItem[];
  toUpdate: PPEItem[];
  errors: ImportError[];
}

/**
 * Checks every row and returns what would be added, updated or rejected. Nothing is saved here.
 * Row numbers are spreadsheet rows (header = 1).
 */
export function previewCatalogImport(state: State, rows: Row[], mode: ImportMode): ImportPreview {
  const preview: ImportPreview = { toAdd: [], toUpdate: [], errors: [] };
  const seen = new Set<string>();

  rows.forEach((row, i) => {
    const rowNo = i + 2;
    const code = String(row['Item Code'] ?? '').trim();
    const fail = (reason: string) => preview.errors.push({ row: rowNo, code, reason });

    if (!code) return fail('Item Code is blank.');
    if (/\s/.test(code)) return fail('Item Code must be one word.');
    if (seen.has(code.toUpperCase())) return fail('Item Code is repeated in the file.');
    seen.add(code.toUpperCase());

    const existing = state.ppeItems.find(p => p.itemCode.toUpperCase() === code.toUpperCase() && !p.deletedAt);
    if (existing && mode === 'add') return fail('Already exists.');

    const name = String(row['Name'] ?? '').trim();
    if (!name) return fail('Name is required.');
    const category = String(row['Category'] ?? '').trim();
    if (!category) return fail('Category is required.');
    // Older records may hold a category outside today's list; an unchanged value is accepted on update.
    if (!CATEGORIES.includes(category) && category !== existing?.category) return fail(`Category "${category}" is not valid.`);

    const groupCode = String(row['Item Group'] ?? '').trim();
    if (!groupCode) return fail('Item Group is required.');
    const group = state.itemGroups.find(g => g.code.toUpperCase() === groupCode.toUpperCase() && !g.deletedAt && g.active);
    if (!group) return fail(`Item Group "${groupCode}" does not exist or is inactive.`);

    const unitCode = String(row['Unit of Measure'] ?? '').trim();
    if (!unitCode) return fail('Unit of Measure Code is required.');
    const unit = state.units.find(u => u.code.toUpperCase() === unitCode.toUpperCase() && !u.deletedAt);
    if (!unit) return fail(`Unit of Measure "${unitCode}" does not exist.`);
    if (!unit.active && unit.id !== existing?.unitId) return fail(`Unit of Measure "${unit.code}" is inactive.`);

    const lifespanValue = Number(row['Lifespan Value']);
    if (!Number.isFinite(lifespanValue) || lifespanValue <= 0) return fail('Lifespan Value must be above zero.');
    const lifespanRaw = String(row['Lifespan Unit'] ?? '').trim().toLowerCase();
    const lifespanType = ({ days: 'Days', months: 'Months', years: 'Years' } as const)[lifespanRaw as 'days'];
    if (!lifespanType) return fail('Lifespan Unit must be Days, Months or Years.');

    const risk = String(row['Risk Category'] ?? '').trim().toUpperCase().replace(/^CATEGORY\s+/, '');
    if (!['I', 'II', 'III'].includes(risk)) return fail('Risk Category must be I, II or III.');

    const locCodes = String(row['Locations'] ?? '').split(';').map(s => s.trim()).filter(Boolean);
    if (locCodes.length === 0) return fail('At least one Location is required.');
    const locationIds: string[] = [];
    for (const lc of locCodes) {
      const loc = state.locations.find(l => l.code.toUpperCase() === lc.toUpperCase() && !l.deletedAt);
      if (!loc || !loc.active || loc.stockCondition === 'Scrap' || loc.locationType === 'Scrap') {
        return fail(`Location "${lc}" does not exist, is inactive or is a Scrap location.`);
      }
      locationIds.push(loc.id);
    }

    const locationReorderLevels = String(row['Reorder Levels'] ?? '').split(';').map(s => s.trim()).filter(Boolean).map(pair => {
      const [lc, lvl] = pair.split(':');
      const loc = state.locations.find(l => l.code.toUpperCase() === String(lc).trim().toUpperCase());
      return loc && locationIds.includes(loc.id) ? { locationId: loc.id, reorderLevel: Number(lvl) || 0 } : null;
    }).filter(Boolean) as { locationId: string; reorderLevel: number }[];

    // Variant values: ATTR=V1|V2;ATTR2=V3. Every Attribute of the group needs at least one value.
    const variantIds: string[] = [];
    const chosen = new Map<string, string[]>();
    String(row['Variant Values'] ?? '').split(';').map(s => s.trim()).filter(Boolean).forEach(part => {
      const [ac, vals] = part.split('=');
      chosen.set(String(ac).trim().toUpperCase(), String(vals ?? '').split('|').map(v => v.trim().toLowerCase()).filter(Boolean));
    });
    for (const attrId of group.attributeIds) {
      const attr = state.attributes.find(a => a.id === attrId && !a.deletedAt && a.active);
      if (!attr) continue;
      const wanted = chosen.get(attr.code.toUpperCase()) || [];
      const ids = attr.values.filter(v => wanted.includes(v.value.toLowerCase())).map(v => v.id);
      // An existing item that never had a value for this attribute is not blocked by an unrelated update.
      const hadNone = !!existing && group.id === existing.itemGroupId && !attr.values.some(v => existing.variantAttributeValueIds?.includes(v.id));
      if (ids.length === 0 && !hadNone) return fail(`Pick at least one value for Attribute ${attr.code}.`);
      variantIds.push(...ids);
    }

    const serialTracked = yes(row['Serial Number tracked']);
    const activeCell = String(row['Active'] ?? '').trim();
    const active = activeCell === '' ? (existing ? existing.active : true) : yes(activeCell);

    if (existing) {
      // PPE-002 rules apply to updates. Import has no override.
      const hasTx = state.itemHasTransactions(existing.id);
      if (hasTx && serialTracked !== !!existing.serialTracked) return fail('Serial Number tracked is locked after the first transaction.');
      if (existing.active && !active) {
        const check = state.checkInUse('ppeItems', existing.id);
        if (check.inUse) return fail(`Cannot deactivate an item in use: ${check.reasons.join(' ')}`);
      }
    }

    const item: PPEItem = {
      ...(existing || {} as PPEItem),
      id: existing?.id || generateId(),
      itemCode: existing?.itemCode || code,
      name,
      category,
      itemGroupId: group.id,
      unitId: unit.id,
      lifespanValue,
      lifespanType,
      riskCategory: risk as PPEItem['riskCategory'],
      locationIds,
      locationReorderLevels,
      reorderLevel: existing?.reorderLevel ?? (locationReorderLevels[0]?.reorderLevel || 0),
      variantAttributeValueIds: variantIds,
      serialTracked,
      description: String(row['Description'] ?? '').trim(),
      manufacturer: String(row['Manufacturer'] ?? '').trim(),
      model: String(row['Model'] ?? '').trim(),
      standardCertification: String(row['Standard / Certification'] ?? '').trim(),
      hasSize: existing?.hasSize ?? false,
      gender: existing?.gender ?? 'Unisex',
      active,
      deletedAt: existing?.deletedAt ?? null,
    };
    (existing ? preview.toUpdate : preview.toAdd).push(item);
  });

  return preview;
}

/** Saves the valid rows of a preview. Rows the store refuses are added to the returned errors. */
export function applyCatalogImport(
  saveEntity: AppState['saveEntity'],
  preview: ImportPreview
): { added: number; updated: number; errors: ImportError[] } {
  const errors = [...preview.errors];
  let added = 0;
  let updated = 0;
  for (const item of preview.toAdd) {
    const res = saveEntity('ppeItems', item, 'Catalog import');
    if (res.success) added++; else errors.push({ row: 0, code: item.itemCode, reason: res.message || 'Rejected.' });
  }
  for (const item of preview.toUpdate) {
    const res = saveEntity('ppeItems', item, 'Catalog import');
    if (res.success) updated++; else errors.push({ row: 0, code: item.itemCode, reason: res.message || 'Rejected.' });
  }
  return { added, updated, errors };
}
