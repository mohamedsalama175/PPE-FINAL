import { describe, it, expect, beforeEach } from 'vitest';
import { resetStore, store, loginAs, ADMIN, lastAudit, makeTrackedItem } from '../test/storeTestUtils';
import { UnitOfMeasure } from '../types';
import { usePPEStore } from './useStore';

const newUnit = (over: Partial<UnitOfMeasure> = {}) =>
  ({ id: '', code: 'BOT', name: 'Bottle', symbol: 'btl', active: true, ...over } as UnitOfMeasure);

const unitByCode = (code: string) => store().units.find(u => u.code === code)!;

describe('Epic 11: Units of Measure', () => {
  beforeEach(() => { resetStore(); loginAs(ADMIN); });

  describe('PPE-051 add', () => {
    it('saves a unit with Code, Name, Symbol (Code stored upper-case) and writes an audit entry', () => {
      const res = store().saveEntity('units', newUnit({ code: 'bot' }));
      expect(res).toEqual({ success: true });
      const u = unitByCode('BOT');
      expect(u).toMatchObject({ name: 'Bottle', symbol: 'btl', active: true, createdBy: ADMIN });
      expect(lastAudit()).toMatchObject({ action: 'CREATE', objectType: 'units', objectReference: 'BOT' });
    });

    it('blocks a duplicate code, case-insensitive', () => {
      expect(store().saveEntity('units', newUnit({ code: 'pcs' })).message).toMatch(/already exists/);
    });

    it('blocks a duplicate of a code that is in the Trash Bin', () => {
      store().saveEntity('units', newUnit());
      expect(store().softDeleteEntity('units', unitByCode('BOT').id).success).toBe(true);
      const res = store().saveEntity('units', newUnit({ name: 'Another bottle' }));
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Trash Bin/);
    });

    it('requires a one-word code, a name and a symbol', () => {
      expect(store().saveEntity('units', newUnit({ code: 'TWO WORDS' })).success).toBe(false);
      expect(store().saveEntity('units', newUnit({ code: '' })).success).toBe(false);
      expect(store().saveEntity('units', newUnit({ name: ' ' })).message).toMatch(/Name/);
      expect(store().saveEntity('units', newUnit({ symbol: '' })).message).toMatch(/Symbol/);
    });

    it('an inactive unit is not accepted on a new item', () => {
      store().saveEntity('units', newUnit({ active: false }));
      const bot = unitByCode('BOT');
      const item = { ...store().ppeItems[0], id: 'new-item', itemCode: 'NEW-1', unitId: bot.id };
      expect(store().saveEntity('ppeItems', item).message).toMatch(/inactive/);
    });
  });

  describe('PPE-052 edit', () => {
    it('Code is locked after saving; Name and Symbol can change', () => {
      const pcs = unitByCode('PCS');
      expect(store().saveEntity('units', { ...pcs, code: 'PIECE' }).message).toMatch(/cannot change/);
      expect(store().saveEntity('units', { ...pcs, name: 'Unit', symbol: 'u' }).success).toBe(true);
      expect(unitByCode('PCS')).toMatchObject({ name: 'Unit', symbol: 'u', updatedBy: ADMIN });
      expect(lastAudit()).toMatchObject({ action: 'UPDATE', before: expect.objectContaining({ name: 'Piece' }), after: expect.objectContaining({ name: 'Unit' }) });
    });

    it('deactivating a unit in use is blocked, with the item count and no override', () => {
      const prs = unitByCode('PRS');
      const used = store().unitUsage(prs.id).itemCount;
      expect(used).toBeGreaterThan(0);
      const viaToggle = store().toggleEntityActive('units', prs.id, false, 'A long enough override reason');
      expect(viaToggle.success).toBe(false);
      expect(viaToggle.message).toMatch(new RegExp(`${used} item\\(s\\).*no override`));
      expect(store().saveEntity('units', { ...prs, active: false }).success).toBe(false);
      expect(unitByCode('PRS').active).toBe(true);
    });

    it('an item in the Trash Bin still blocks deactivation and trash', () => {
      const set = unitByCode('SET');
      expect(store().unitUsage(set.id).itemCount).toBe(0);
      const itemId = makeTrackedItem('SET-USER');
      store().saveEntity('ppeItems', { ...store().ppeItems.find(p => p.id === itemId)!, unitId: set.id });
      expect(store().softDeleteEntity('ppeItems', itemId).success).toBe(true);
      expect(store().unitUsage(set.id)).toMatchObject({ itemCount: 0, trashedItemCount: 1 });
      expect(store().toggleEntityActive('units', set.id, false).success).toBe(false);
      expect(store().softDeleteEntity('units', set.id, 'Admin reason long enough').success).toBe(false);
    });

    it('an unused unit can be deactivated and turned back on, with audit entries', () => {
      const set = unitByCode('SET');
      expect(store().toggleEntityActive('units', set.id, false).success).toBe(true);
      expect(lastAudit()).toMatchObject({ action: 'DEACTIVATE', objectType: 'units' });
      expect(store().toggleEntityActive('units', set.id, true).success).toBe(true);
      expect(lastAudit()).toMatchObject({ action: 'ACTIVATE' });
    });
  });

  describe('PPE-053 list counts', () => {
    it('Items using it counts active and inactive items and excludes trashed ones', () => {
      const pcs = unitByCode('PCS');
      const before = store().unitUsage(pcs.id).itemCount;
      // GOGGLE-CLR sits in a kit, so the Admin overrides with a reason
      expect(store().toggleEntityActive('ppeItems', 'ppe-13', false, 'Discontinued model').success).toBe(true);
      expect(store().unitUsage(pcs.id).itemCount).toBe(before);
      expect(store().softDeleteEntity('ppeItems', 'ppe-13', 'Discontinued model').success).toBe(true);
      expect(store().unitUsage(pcs.id)).toMatchObject({ itemCount: before - 1, trashedItemCount: 1 });
    });
  });

  describe('PPE-055 trash and restore', () => {
    it('trashing a unit in use is blocked with no override', () => {
      const res = store().softDeleteEntity('units', unitByCode('PCS').id, 'Admin wants to override this');
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/no override/);
      expect(unitByCode('PCS').deletedAt).toBeFalsy();
    });

    it('an unused unit goes to the Trash Bin and comes back Inactive', () => {
      const set = unitByCode('SET');
      expect(store().softDeleteEntity('units', set.id).success).toBe(true);
      expect(lastAudit()).toMatchObject({ action: 'SOFT_DELETE', objectType: 'units' });
      expect(store().restoreEntity('units', set.id).success).toBe(true);
      expect(unitByCode('SET')).toMatchObject({ active: false, deletedAt: null });
      expect(lastAudit()).toMatchObject({ action: 'RESTORE', objectReference: 'SET' });
    });

    it('restore is blocked while the code is taken, and succeeds with a new code', () => {
      const set = unitByCode('SET');
      store().softDeleteEntity('units', set.id);
      // Codes are unique even against trashed units, so a clash can only come from older data:
      // simulate one unit that already holds the code.
      const clash: UnitOfMeasure = { ...set, id: 'uom-set-2', deletedAt: null, active: true };
      usePPEStore.setState({ units: [...store().units, clash] });

      const blocked = store().restoreEntity('units', set.id);
      expect(blocked).toMatchObject({ success: false, codeTaken: true });
      expect(store().units.find(u => u.id === set.id)!.deletedAt).toBeTruthy();

      expect(store().restoreEntity('units', set.id, 'PCS').success).toBe(false); // also taken
      const ok = store().restoreEntity('units', set.id, 'set2');
      expect(ok.success).toBe(true);
      expect(store().units.find(u => u.id === set.id)).toMatchObject({ code: 'SET2', active: false, deletedAt: null });
      expect(lastAudit().reason).toMatch(/new code SET2/);
    });

    it('trashed units are not offered and the nightly purge removes an old unused one', () => {
      store().saveEntity('units', newUnit());
      const bot = unitByCode('BOT');
      store().softDeleteEntity('units', bot.id);
      usePPEStore.setState({ units: store().units.map(u => u.id === bot.id ? { ...u, deletedAt: '2020-01-01T00:00:00Z' } : u) });
      expect(store().purgeEligibleTrash().purgedCount).toBeGreaterThanOrEqual(1);
      expect(store().units.find(u => u.id === bot.id)).toBeUndefined();
      expect(store().auditLogs.find(l => l.action === 'PERMANENT_PURGE' && l.objectReference === 'BOT')).toBeTruthy();
    });
  });

  describe('G2 override reason length', () => {
    it('an override needs at least 10 characters', () => {
      // ppe-1 is held and stocked, so it is in use
      expect(store().toggleEntityActive('ppeItems', 'ppe-1', false, 'short').success).toBe(false);
      expect(store().toggleEntityActive('ppeItems', 'ppe-1', false, 'Replaced by HLM-002').success).toBe(true);
      expect(lastAudit()).toMatchObject({ action: 'DEACTIVATE_WITH_OVERRIDE', reason: 'Replaced by HLM-002' });
    });
  });
});
