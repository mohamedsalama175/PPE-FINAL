import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetStore, store, loginAs, ADMIN, HSE, STORE_KEEPER, EMPLOYEE,
  makeTrackedItem, stockIn, serialId, serial, onHand, lastAudit,
} from '../test/storeTestUtils';
import { normalizeSerial, parseSerialInput, validateSerialEntry } from '../lib/serials';
import { serialOnHand } from './serialEngine';

/** Invariant: for a tracked item, balance at every location equals the serials physically there. */
function expectStockMatchesSerials(itemId: string) {
  const s = store();
  const locs = new Set([...s.stockBalances.filter(b => b.ppeItemId === itemId).map(b => b.locationId),
    ...s.serialUnits.filter(u => u.ppeItemId === itemId && u.locationId).map(u => u.locationId!)]);
  for (const loc of locs) expect(onHand(itemId, loc), `location ${loc}`).toBe(serialOnHand(s.serialUnits, itemId, loc));
}

describe('serial helpers', () => {
  it('normalizes to upper-case and parses pasted or scanned lists', () => {
    expect(normalizeSerial('  sn-1a ')).toBe('SN-1A');
    expect(parseSerialInput('SN-1\nSN-2\r\nSN-3, SN-4;SN-5\tSN-6\n\n')).toEqual(['SN-1', 'SN-2', 'SN-3', 'SN-4', 'SN-5', 'SN-6']);
  });

  it('reports blank, bad format, repeats in one entry and already registered, naming the serial', () => {
    const errors = validateSerialEntry(['SN-1', '', 'SN 2', 'sn-1', 'SN-9', 'X'.repeat(51)], s => (s === 'SN-9' ? 'In Stock at Main Warehouse' : null));
    expect(errors.map(e => [e.index, e.code])).toEqual([
      [1, 'blank'], [2, 'format'], [3, 'duplicate_in_entry'], [4, 'already_registered'], [5, 'format'],
    ]);
    expect(errors[2].message).toBe('SN-1 is repeated in this entry.');
    expect(errors[3].message).toMatch(/SN-9 is already registered.*Main Warehouse/);
  });
});

describe('Epic 12: Serial Numbers', () => {
  let item: string;
  beforeEach(() => {
    resetStore();
    loginAs(ADMIN);
    item = makeTrackedItem();
  });

  describe('item level (PPE-001, PPE-002)', () => {
    it('Serial Number tracked can change until the first transaction, then it is locked', () => {
      const p = () => store().ppeItems.find(x => x.id === item)!;
      expect(store().saveEntity('ppeItems', { ...p(), serialTracked: false }).success).toBe(true);
      expect(store().saveEntity('ppeItems', { ...p(), serialTracked: true }).success).toBe(true);
      expect(stockIn(item, 'loc-1', ['SN-1']).success).toBe(true);
      const res = store().saveEntity('ppeItems', { ...p(), serialTracked: false });
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/locked/);
      expect(store().saveEntity('ppeItems', { ...p(), itemCode: 'RADIO-99' }).message).toMatch(/Item Code is locked/);
      expect(p().serialTracked).toBe(true);
    });

    it('an untracked item with a transaction cannot be switched to tracked', () => {
      const res = store().saveEntity('ppeItems', { ...store().ppeItems.find(x => x.id === 'ppe-1')!, serialTracked: true });
      expect(res.success).toBe(false);
    });
  });

  describe('PPE-057 register at stock entry', () => {
    it('Stock IN creates one In Stock unit per serial, quantity = serial count, with events and audit', () => {
      const res = stockIn(item, 'loc-1', ['sn-1', 'SN-2', 'SN-3'], 'B-77');
      expect(res.success).toBe(true);
      const units = store().serialUnits.filter(u => u.ppeItemId === item);
      expect(units.map(u => [u.serial, u.status, u.locationId, u.batchNumber])).toEqual([
        ['SN-1', 'In Stock', 'loc-1', 'B-77'], ['SN-2', 'In Stock', 'loc-1', 'B-77'], ['SN-3', 'In Stock', 'loc-1', 'B-77'],
      ]);
      expect(onHand(item, 'loc-1')).toBe(3);
      expect(store().stockAdjustments[0].quantityDelta).toBe(3);
      expect(store().serialEvents.filter(e => units.some(u => u.id === e.serialUnitId)).map(e => e.type)).toEqual(['Stock in', 'Stock in', 'Stock in']);
      expect(lastAudit()).toMatchObject({ action: 'STOCK_ADJUSTMENT_APPLIED' });
    });

    it('a serial repeated in one entry blocks the whole save and names the serial', () => {
      const res = stockIn(item, 'loc-1', ['SN-1', 'SN-2', 'sn-1']);
      expect(res).toMatchObject({ success: false, message: 'SN-1 is repeated in this entry.' });
      expect(store().serialUnits.some(u => u.ppeItemId === item)).toBe(false);
      expect(onHand(item, 'loc-1')).toBe(0);
    });

    it('a serial already registered for the item anywhere is refused, showing where it is', () => {
      stockIn(item, 'loc-2', ['SN-1']);
      const res = stockIn(item, 'loc-1', ['SN-5', 'SN-1']);
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/SN-1 is already registered.*Secondary Warehouse/);
      expect(store().serialUnits.filter(u => u.ppeItemId === item)).toHaveLength(1);
    });

    it('the same serial on a different item is allowed (unique per item)', () => {
      const other = makeTrackedItem('RADIO-02');
      stockIn(item, 'loc-1', ['SN-1']);
      expect(stockIn(other, 'loc-1', ['SN-1']).success).toBe(true);
    });

    it('Stock IN of a tracked item with no serials is blocked', () => {
      expect(stockIn(item, 'loc-1', []).success).toBe(false);
    });

    it('Risk Category III: serials wait for approval, then register on approval', () => {
      const cat3 = makeTrackedItem('DET-III', 'III');
      const res = store().adjustStock({
        type: 'IN', reference: 'ADJ-IN-III', ppeItemId: cat3, locationId: 'loc-1', batchNumber: 'B-9',
        quantityDelta: 0, reasonCategory: 'Purchase Receipt', reason: 'Delivery', submittedBy: STORE_KEEPER,
        serialNumbers: ['D-1', 'D-2'], status: 'pending',
      });
      expect(res.success).toBe(true);
      expect(store().serialUnits.some(u => u.ppeItemId === cat3)).toBe(false);
      expect(store().reviewAdjustment(res.id!, 'approved', HSE).success).toBe(true);
      expect(store().serialUnits.filter(u => u.ppeItemId === cat3).map(u => u.serial)).toEqual(['D-1', 'D-2']);
      expect(onHand(cat3, 'loc-1')).toBe(2);
    });

    it('Opening Balance registers serials on approval, all or nothing', () => {
      const ob = {
        id: 'ob-t', locationId: 'loc-2', referenceDate: '2026-11-01', status: 'Pending Approval' as const,
        preparedBy: STORE_KEEPER, createdAt: '2026-11-01',
        lines: [{ id: 'l1', ppeItemId: item, batchNumber: 'OB-1', quantity: 99, serialNumbers: ['OB-1', 'OB-2'] }],
      };
      expect(store().saveOpeningBalance(ob).success).toBe(true);
      expect(store().openingBalances.find(o => o.id === 'ob-t')!.lines[0].quantity).toBe(2); // quantity = serial count
      expect(store().approveOpeningBalance('ob-t', HSE).success).toBe(true);
      expect(store().serialUnits.filter(u => u.ppeItemId === item && u.locationId === 'loc-2')).toHaveLength(2);
      expectStockMatchesSerials(item);

      const dup = { ...ob, id: 'ob-dup', lines: [{ ...ob.lines[0], serialNumbers: ['OB-3', 'OB-2'] }] };
      expect(store().saveOpeningBalance(dup).message).toMatch(/OB-2 is already registered/);
    });
  });

  describe('PPE-058 pick serials on every movement', () => {
    beforeEach(() => {
      stockIn(item, 'loc-1', ['SN-1', 'SN-2', 'SN-3', 'SN-4']);
    });

    const issue = (ids: string[], by = STORE_KEEPER, employeeId = EMPLOYEE) => store().issueItem({
      employeeId, ppeItemId: item, locationId: 'loc-1', quantity: 99, issueDate: new Date().toISOString(),
      issuedBy: by, serialIds: ids,
    });

    it('issue: units become Issued to the employee, quantity = serials picked, stock down', () => {
      const res = issue([serialId(item, 'SN-1'), serialId(item, 'SN-2')]);
      expect(res.success).toBe(true);
      const iss = store().issuances.find(i => i.id === res.id)!;
      expect(iss.quantity).toBe(2);
      expect(serial(item, 'SN-1')).toMatchObject({ status: 'Issued', holderEmployeeId: EMPLOYEE, holderIssuanceId: res.id, locationId: undefined, lastLocationId: 'loc-1' });
      expect(onHand(item, 'loc-1')).toBe(2);
      expect(store().inStockSerials(item, 'loc-1').map(u => u.serial)).toEqual(['SN-3', 'SN-4']);
      expect(lastAudit()).toMatchObject({ action: 'ISSUE_PPE', after: expect.objectContaining({ serials: ['SN-1', 'SN-2'] }) });
      expectStockMatchesSerials(item);
    });

    it('the same serial in two simultaneous issues: only one wins', () => {
      const sid = serialId(item, 'SN-1');
      const results = [issue([sid], STORE_KEEPER, 'emp-4'), issue([sid], ADMIN, 'emp-5')];
      expect(results.map(r => r.success)).toEqual([true, false]);
      expect(results[1].message).toMatch(/SN-1 is not In Stock.*Issued to Ali Mahmoud/);
      expect(serial(item, 'SN-1').holderEmployeeId).toBe('emp-4');
      expect(store().issuances.filter(i => i.serialIds?.includes(sid))).toHaveLength(1);
      expect(onHand(item, 'loc-1')).toBe(3);
    });

    it('a serial that is not In Stock at the chosen location is refused', () => {
      expect(store().issueItem({
        employeeId: EMPLOYEE, ppeItemId: item, locationId: 'loc-2', quantity: 1, issueDate: new Date().toISOString(), issuedBy: STORE_KEEPER,
        serialIds: [serialId(item, 'SN-1')],
      }).success).toBe(false);
    });

    it('transfer moves the unit and keeps it In Stock', () => {
      const res = store().transferStock(item, 'loc-1', 'loc-2', 'B-TEST-1', 99, STORE_KEEPER, [serialId(item, 'SN-3')]);
      expect(res).toEqual({ success: true });
      expect(serial(item, 'SN-3')).toMatchObject({ status: 'In Stock', locationId: 'loc-2' });
      expect(onHand(item, 'loc-1')).toBe(3);
      expect(onHand(item, 'loc-2')).toBe(1);
      const ev = store().serialEvents.filter(e => e.serialUnitId === serialId(item, 'SN-3')).map(e => [e.type, e.fromLocationId, e.toLocationId]);
      expect(ev).toEqual([['Stock in', undefined, 'loc-1'], ['Transfer', 'loc-1', 'loc-2']]);
      expect(lastAudit()).toMatchObject({ action: 'STOCK_TRANSFER' });
      expectStockMatchesSerials(item);
    });

    it('stock OUT: Written off by default, Scrapped when routed to Scrap; quarantine refused', () => {
      const out = (ids: string[], reasonCategory: string, destinationLocationId?: string) => store().adjustStock({
        type: 'OUT', reference: `ADJ-OUT-${reasonCategory}`, ppeItemId: item, locationId: 'loc-1', batchNumber: 'B-TEST-1',
        quantityDelta: -99, reasonCategory, reason: 'Testing stock out', submittedBy: STORE_KEEPER, serialIds: ids, destinationLocationId,
      });
      expect(out([serialId(item, 'SN-1')], 'Stolen').success).toBe(true);
      expect(serial(item, 'SN-1')).toMatchObject({ status: 'Written off', locationId: undefined });
      expect(out([serialId(item, 'SN-2')], 'Damaged in Store', 'loc-6').success).toBe(true);
      expect(serial(item, 'SN-2')).toMatchObject({ status: 'Scrapped', locationId: 'loc-6' });
      expect(out([serialId(item, 'SN-3')], 'Quarantined').message).toMatch(/Quarantine is not available/);
      expect(onHand(item, 'loc-1')).toBe(2);
      expectStockMatchesSerials(item);
    });

    it('return: the same unit goes back In Stock at the Used location', () => {
      const res = issue([serialId(item, 'SN-1')]);
      const r = store().returnItem(res.id, 'good', true, STORE_KEEPER, { serialIds: [serialId(item, 'SN-1')] });
      expect(r.success).toBe(true);
      expect(serial(item, 'SN-1')).toMatchObject({ status: 'In Stock', locationId: 'loc-5', holderEmployeeId: undefined });
      expect(store().issuances.find(i => i.id === res.id)!.status).toBe('returned');
      expectStockMatchesSerials(item);
    });

    it('a damaged return is Scrapped automatically and never offered again', () => {
      const res = issue([serialId(item, 'SN-1')]);
      expect(store().returnItem(res.id, 'damaged', true, STORE_KEEPER, { serialIds: [serialId(item, 'SN-1')] }).success).toBe(true);
      expect(serial(item, 'SN-1')).toMatchObject({ status: 'Scrapped', locationId: 'loc-6' });
      const types = store().serialEvents.filter(e => e.serialUnitId === serialId(item, 'SN-1')).map(e => e.type);
      expect(types).toEqual(['Stock in', 'Issue', 'Return', 'Scrap']);
      expect(store().inStockSerials(item, 'loc-6')).toHaveLength(0);
      expectStockMatchesSerials(item);
    });

    it('returning a serial the person does not hold is blocked and shows who holds it', () => {
      const a = issue([serialId(item, 'SN-1')], STORE_KEEPER, 'emp-4');
      issue([serialId(item, 'SN-2')], STORE_KEEPER, 'emp-5');
      const r = store().returnItem(a.id, 'good', true, STORE_KEEPER, { serialIds: [serialId(item, 'SN-2')] });
      expect(r.success).toBe(false);
      expect(r.message).toMatch(/SN-2 is not held by this employee.*Issued to Omer Farooq \(EMP-005\)/);
      expect(serial(item, 'SN-2').status).toBe('Issued');
      expect(store().returnItem(a.id, 'good', true, STORE_KEEPER, { serialIds: [serialId(item, 'SN-3')] }).message).toMatch(/In Stock at Main Warehouse/);
    });

    it('loan and loan return: On Loan to the borrower, then back In Stock or Scrapped', () => {
      const loan = store().issueLoan({
        holderName: 'Visitor V', holderType: 'Visitor', locationId: 'loc-1', expectedReturnDate: '2026-12-01',
        items: [{ ppeItemId: item, quantity: 99, serialIds: [serialId(item, 'SN-1'), serialId(item, 'SN-2')] }], issuedBy: STORE_KEEPER,
      });
      expect(loan.success).toBe(true);
      expect(serial(item, 'SN-1')).toMatchObject({ status: 'On Loan', holderName: 'Visitor V', holderIssuanceId: loan.id });
      const line = store().issuances.find(i => i.id === loan.id)!.lines![0];
      expect(line.quantity).toBe(2);
      expect(onHand(item, 'loc-1')).toBe(2);

      // a serial the borrower does not hold is refused
      const wrong = store().returnLoan({ loanId: loan.id!, returnedBy: STORE_KEEPER, returnedLines: [{ lineId: line.id, quantity: 1, condition: 'good', serialIds: [serialId(item, 'SN-3')] }] });
      expect(wrong.message).toMatch(/SN-3 is not held by this borrower.*In Stock/);

      expect(store().returnLoan({ loanId: loan.id!, returnedBy: STORE_KEEPER, returnedLines: [{ lineId: line.id, quantity: 1, condition: 'good', serialIds: [serialId(item, 'SN-1')] }] }).success).toBe(true);
      expect(store().returnLoan({ loanId: loan.id!, returnedBy: STORE_KEEPER, returnedLines: [{ lineId: line.id, quantity: 1, condition: 'damaged', serialIds: [serialId(item, 'SN-2')] }] }).success).toBe(true);
      expect(serial(item, 'SN-1')).toMatchObject({ status: 'In Stock', locationId: 'loc-5' });
      expect(serial(item, 'SN-2')).toMatchObject({ status: 'Scrapped', locationId: 'loc-6' });
      expect(store().issuances.find(i => i.id === loan.id)!.status).toBe('returned');
      expectStockMatchesSerials(item);
    });

    it('kit issue needs one serial per unit of a tracked line', () => {
      const kit = { id: 'kit-t', name: 'Radio kit', jobPositionId: 'jp-4', active: true, items: [{ id: 'ki', ppeItemId: item, qty: 2 }] };
      store().saveEntity('kits', kit as any);
      const base = { employeeId: EMPLOYEE, kitId: 'kit-t', locationId: 'loc-1', quantity: 1, issuedBy: STORE_KEEPER };
      const short = store().issueKit({ ...base, itemSerials: { [item]: [serialId(item, 'SN-1')] } });
      expect(short).toMatchObject({ success: false });
      expect(short.message).toMatch(/pick 2 serial/);
      const ok = store().issueKit({ ...base, itemSerials: { [item]: [serialId(item, 'SN-1'), serialId(item, 'SN-2')] } });
      expect(ok.success).toBe(true);
      expect(store().issuances.find(i => i.id === ok.issuanceIds[0])!.serialIds).toHaveLength(2);
      expect(serial(item, 'SN-2').status).toBe('Issued');
    });
  });

  describe('PPE-059 search and history', () => {
    beforeEach(() => {
      stockIn(item, 'loc-1', ['SN-1']); // loc-1: Store Keeper assigned
      stockIn(item, 'loc-3', ['SN-2']); // loc-3: no Store Keeper
    });

    it('Store Keeper sees only serials at assigned locations; Admin and HSE Supervisor see all', () => {
      const visible = (who: string) => store().visibleSerialUnits(store().employees.find(e => e.id === who)).filter(u => u.ppeItemId === item).map(u => u.serial);
      expect(visible(STORE_KEEPER)).toEqual(['SN-1']);
      expect(visible(ADMIN)).toEqual(['SN-1', 'SN-2']);
      expect(visible(HSE)).toEqual(['SN-1', 'SN-2']);
      expect(visible(EMPLOYEE)).toEqual([]);
    });

    it('serials of a trashed item stay searchable with their history, and the item is never purged', () => {
      expect(store().softDeleteEntity('ppeItems', item, 'Model withdrawn by supplier').success).toBe(true);
      expect(store().serialUnits.filter(u => u.ppeItemId === item)).toHaveLength(2);
      expect(store().purgeEntity('ppeItems', item).success).toBe(false);
      expect(store().visibleSerialUnits().some(u => u.serial === 'SN-1')).toBe(true);
      expect(store().serialEvents.some(e => e.serialUnitId === serialId(item, 'SN-1'))).toBe(true);
    });
  });

  it('the seed data keeps stock equal to serials for the demo tracked item', () => {
    expectStockMatchesSerials('ppe-16');
  });
});
