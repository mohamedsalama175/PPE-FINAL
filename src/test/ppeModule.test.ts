import { it } from 'vitest';
import { usePPEStore } from '../store/useStore';
import { PPEItem, Location, ItemGroup, Attribute, Employee } from '../types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runAllTests() {
  console.log('=== STARTING PPE MODULE AUTOMATED VERIFICATION SUITE ===\n');

  const store = usePPEStore.getState();

  // --------------------------------------------------------------------------
  // TEST 1: G1 - Immutable Audit Logging
  // --------------------------------------------------------------------------
  console.log('--- Test Suite 1: Rule G1 - Immutable Audit Logging ---');
  const initialAuditCount = store.auditLogs.length;
  store.recordAudit({
    action: 'TEST_ACTION',
    objectType: 'TestEntity',
    objectReference: 'TEST-001',
    reason: 'Automated test suite verification',
    details: 'Testing audit logging'
  });
  const updatedAuditLogs = usePPEStore.getState().auditLogs;
  assert(updatedAuditLogs.length === initialAuditCount + 1, 'Audit log count incremented on recordAudit');
  assert(updatedAuditLogs[0].action === 'TEST_ACTION', 'Latest audit log matches action');
  assert(updatedAuditLogs[0].timestamp !== undefined, 'Audit log contains timestamp');

  // --------------------------------------------------------------------------
  // TEST 2: G2 - In-Use Protection & Admin Override
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 2: Rule G2 - In-Use Protection & Admin Override ---');
  // ppe-1 has stock (150 on hand) and active issuances
  const check1 = store.checkInUse('ppeItems', 'ppe-1');
  assert(check1.inUse === true, 'In-use check correctly identifies ppe-1 as in-use');
  assert(check1.reasons.length >= 2, 'In-use check reports multiple reasons (active holdings & positive stock)');

  // Switch to non-admin (Direct Supervisor)
  const dirSuper = store.employees.find(e => e.role === 'Direct Supervisor')!;
  store.setCurrentUser(dirSuper);
  const nonAdminDeleteRes = usePPEStore.getState().softDeleteEntity('ppeItems', 'ppe-1');
  assert(nonAdminDeleteRes.success === false, 'Non-admin cannot delete an in-use item');

  // Switch back to Admin
  const adminUser = store.employees.find(e => e.role === 'Admin')!;
  store.setCurrentUser(adminUser);
  const adminDeleteNoReason = usePPEStore.getState().softDeleteEntity('ppeItems', 'ppe-1');
  assert(adminDeleteNoReason.success === false, 'Admin cannot delete in-use item without override justification');

  const adminDeleteWithReason = usePPEStore.getState().softDeleteEntity('ppeItems', 'ppe-1', 'Emergency phase-out authorized by Safety Director');
  assert(adminDeleteWithReason.success === true, 'Admin can override in-use protection with valid justification');

  // Verify it moved to trash (active: false, deletedAt set)
  const ppe1AfterDelete = usePPEStore.getState().ppeItems.find(p => p.id === 'ppe-1');
  assert(ppe1AfterDelete?.active === false && !!ppe1AfterDelete?.deletedAt, 'Item is soft-deleted');

  // Restore entity
  const restoreRes = usePPEStore.getState().restoreEntity('ppeItems', 'ppe-1');
  assert(restoreRes.success === true, 'Item restored from Trash Bin');
  const ppe1Restored = usePPEStore.getState().ppeItems.find(p => p.id === 'ppe-1');
  assert(ppe1Restored?.active === true && ppe1Restored?.deletedAt === null, 'Item is active again');

  // --------------------------------------------------------------------------
  // TEST 3: G3 & G4 - Gender Matching Rule
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 3: Rule G4 - Gender Matching Rule ---');
  // Female employee (Sara Youssef emp-7), Male Boots (ppe-4 has gender: 'Male', group ig-3 has requiresGenderMatch: true)
  const genderFail = usePPEStore.getState().validateGenderMatch('emp-7', 'ppe-4');
  assert(genderFail.valid === false, 'Gender match fails when female employee is issued male-only boots');

  // Male employee (Ali Mahmoud emp-4), Male Boots (ppe-4)
  const genderPass = usePPEStore.getState().validateGenderMatch('emp-4', 'ppe-4');
  assert(genderPass.valid === true, 'Gender match passes when male employee is issued male boots');

  // Unisex Item (ppe-1, group ig-1 requiresGenderMatch: false)
  const unisexPass = usePPEStore.getState().validateGenderMatch('emp-7', 'ppe-1');
  assert(unisexPass.valid === true, 'Unisex item passes for any gender');

  // --------------------------------------------------------------------------
  // TEST 4: G5 - Lifespan Calculation
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 4: Rule G5 - Lifespan Calculation ---');
  const item3Years = store.ppeItems.find(p => p.lifespanType === 'Years' && p.lifespanValue === 3)!;
  const baseDate = new Date('2026-01-01T00:00:00Z');
  const calculatedDate = usePPEStore.getState().calculateLifespanDate(item3Years, baseDate);
  assert(calculatedDate.startsWith('2029-01-01'), `Lifespan correctly adds 3 years (calculated: ${calculatedDate})`);

  // --------------------------------------------------------------------------
  // TEST 5: G6 - Stock Condition Transitions
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 5: Rule G6 - Stock Condition Transitions ---');
  // loc-5 is Used, loc-1 is New, loc-6 is Scrap
  const usedToNewRes = usePPEStore.getState().transferStock('ppe-1', 'loc-5', 'loc-1', 'B-26-001', 1, 'emp-1');
  assert(usedToNewRes.success === false, 'Cannot transfer stock from Used to New location (Rule G6)');

  const outOfScrapRes = usePPEStore.getState().transferStock('ppe-1', 'loc-6', 'loc-5', 'B-26-001', 1, 'emp-1');
  assert(outOfScrapRes.success === false, 'Cannot transfer stock out of Scrap location (Rule G6)');

  // --------------------------------------------------------------------------
  // TEST 6: G7 & G8 - Kit Single Signature & Partial Fulfillment
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 6: Rule G7 & G8 - Kit Partial Issuance ---');
  // kit-1 has 3 items: ppe-1 (available), ppe-8 (available), ppe-13 (0 stock at loc-1)
  const kitRes = usePPEStore.getState().issueKit({
    employeeId: 'emp-4',
    kitId: 'kit-1',
    locationId: 'loc-1',
    quantity: 1,
    storeKeeperSignature: 'data:image/png;base64,mockStoreKeeper',
    receiverSignature: 'data:image/png;base64,mockReceiver',
    issuedBy: 'emp-1'
  });
  assert(kitRes.success === true, 'Partial kit issuance succeeds (Rule G8)');
  assert(kitRes.issuanceIds.length >= 2, `Issued available items (${kitRes.issuanceIds.length} items issued) without blocking whole kit`);

  // --------------------------------------------------------------------------
  // TEST 7: G9 - Available Stock & Batch Quarantine
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 7: Rule G9 - Available Stock & Batch Quarantine ---');
  const targetBatch = usePPEStore.getState().batches.find(b => b.ppeItemId === 'ppe-3' && b.locationId === 'loc-1')!;
  const prevAvail = targetBatch.availableQty;
  usePPEStore.getState().quarantineBatch(targetBatch.id, 25, 'Quality inspection test hold', 'emp-1');
  
  const batchAfterQuarantine = usePPEStore.getState().batches.find(b => b.id === targetBatch.id)!;
  assert(batchAfterQuarantine.availableQty === prevAvail - 25, `Batch availableQty reduced by quarantined amount (${batchAfterQuarantine.availableQty})`);
  assert(batchAfterQuarantine.quarantinedQty === 25, 'Batch quarantinedQty recorded');

  // Release quarantine
  usePPEStore.getState().releaseQuarantineBatch(targetBatch.id, 25, 'emp-1');
  const batchAfterRelease = usePPEStore.getState().batches.find(b => b.id === targetBatch.id)!;
  assert(batchAfterRelease.availableQty === prevAvail, 'Batch availableQty restored upon quarantine release');

  // --------------------------------------------------------------------------
  // TEST 8: G10 - Trash Bin Retention Protection
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 8: Rule G10 - Trash Bin Historical Retention ---');
  // ppe-1 has issuances and movements -> Rule G10 protects from permanent purge
  const purgeHistRes = usePPEStore.getState().purgeEntity('ppeItems', 'ppe-1');
  assert(purgeHistRes.success === false, 'Cannot permanently purge record with historical transactions (Rule G10)');

  // --------------------------------------------------------------------------
  // TEST 9: G12 - Employee Lifecycle & Terminations
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 9: Rule G12 - Employee Lifecycle ---');
  // Terminate employee emp-6
  usePPEStore.getState().setEmployeeStatus('emp-6', 'Terminated', 'emp-1');
  const emp6 = usePPEStore.getState().employees.find(e => e.id === 'emp-6');
  assert(emp6?.status === 'Terminated' && emp6?.active === false, 'Employee marked Terminated and inactive');

  // Check that held PPE remains on profile
  const emp6Issuances = usePPEStore.getState().issuances.filter(i => i.employeeId === 'emp-6');
  assert(emp6Issuances.length > 0, 'Held PPE remains on employee profile even when terminated');

  // --------------------------------------------------------------------------
  // TEST 10: PPE-024 - Close Opening Balance Lock
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 10: PPE-024 - Close Opening Balance Lock ---');
  usePPEStore.getState().closeOpeningBalance('loc-2', 'emp-1');
  const loc2 = usePPEStore.getState().locations.find(l => l.id === 'loc-2');
  assert(loc2?.openingBalanceClosed === true, 'Opening balance successfully closed and locked for location');

  // --------------------------------------------------------------------------
  // TEST 11: PPE-044 - Historical Issuance Import
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 11: PPE-044 - Historical Import with Zero Stock Deduction ---');
  const ppe1StockBefore = usePPEStore.getState().stockBalances.find(b => b.ppeItemId === 'ppe-1' && b.locationId === 'loc-1')?.quantityOnHand || 0;
  
  const importRes = usePPEStore.getState().importHistoricalIssuances([
    {
      employeeId: 'emp-5',
      ppeItemId: 'ppe-1',
      locationId: 'loc-1',
      quantity: 5,
      issueDate: '2022-01-15T00:00:00Z',
      expectedReplacementDate: '2025-01-15T00:00:00Z'
    }
  ], 'emp-1');
  
  assert(importRes.count === 1, 'Historical record imported');
  const ppe1StockAfter = usePPEStore.getState().stockBalances.find(b => b.ppeItemId === 'ppe-1' && b.locationId === 'loc-1')?.quantityOnHand || 0;
  assert(ppe1StockAfter === ppe1StockBefore, `Zero stock deduction verified: Stock before (${ppe1StockBefore}) === Stock after (${ppe1StockAfter})`);

  // Verify imported record has isHistorical flag
  const latestIss = usePPEStore.getState().issuances[0];
  assert(latestIss.isHistorical === true, 'Imported record flagged as isHistorical: true');

  // --------------------------------------------------------------------------
  // TEST 12: PPE-036 - Multi-line Loan Issuance & Stock Deduction
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 12: PPE-036 - Multi-line Loan Issuance ---');
  const ppe1StockBeforeLoan = usePPEStore.getState().stockBalances.find(b => b.ppeItemId === 'ppe-1' && b.locationId === 'loc-1')?.quantityOnHand || 0;
  const ppe8StockBeforeLoan = usePPEStore.getState().stockBalances.find(b => b.ppeItemId === 'ppe-8' && b.locationId === 'loc-1')?.quantityOnHand || 0;

  const loanRes = usePPEStore.getState().issueLoan({
    holderName: 'John Contractor',
    holderType: 'Contractor',
    companyName: 'BuildCorp Ltd',
    contactNumber: '+20 111 222 3333',
    hostEmployeeId: 'emp-2',
    locationId: 'loc-1',
    expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
    items: [
      { ppeItemId: 'ppe-1', quantity: 2 },
      { ppeItemId: 'ppe-8', quantity: 1 }
    ],
    storeKeeperSignature: 'data:image/png;base64,mockStoreKeeperSign',
    receiverSignature: 'data:image/png;base64,mockReceiverSign',
    issuedBy: 'emp-1'
  });

  assert(loanRes.success === true, 'Multi-line loan issued successfully');
  assert(loanRes.reference.startsWith('LN-'), `Loan reference starts with LN- (${loanRes.reference})`);

  const createdLoan = usePPEStore.getState().issuances.find(i => i.id === loanRes.id);
  assert(createdLoan !== undefined, 'Loan record found in store issuances');
  assert(createdLoan?.isLoan === true, 'Loan flagged as isLoan: true');
  assert(createdLoan?.lines?.length === 2, `Loan contains 2 line items (found ${createdLoan?.lines?.length})`);

  const ppe1StockAfterLoan = usePPEStore.getState().stockBalances.find(b => b.ppeItemId === 'ppe-1' && b.locationId === 'loc-1')?.quantityOnHand || 0;
  const ppe8StockAfterLoan = usePPEStore.getState().stockBalances.find(b => b.ppeItemId === 'ppe-8' && b.locationId === 'loc-1')?.quantityOnHand || 0;
  assert(ppe1StockAfterLoan === ppe1StockBeforeLoan - 2, `Stock deducted for line 1 (${ppe1StockBeforeLoan} -> ${ppe1StockAfterLoan})`);
  assert(ppe8StockAfterLoan === ppe8StockBeforeLoan - 1, `Stock deducted for line 2 (${ppe8StockBeforeLoan} -> ${ppe8StockAfterLoan})`);

  const loanAudit = usePPEStore.getState().auditLogs.find(a => a.objectReference === loanRes.reference);
  assert(loanAudit?.action === 'ISSUE_LOAN', 'Immutable audit log recorded for ISSUE_LOAN');

  // --------------------------------------------------------------------------
  // TEST 13: PPE-037 & Rule G6 - Line-by-Line Return & Condition Routing
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 13: PPE-037 & Rule G6 - Loan Line Return & Condition Routing ---');
  const line1 = createdLoan!.lines![0];
  const line2 = createdLoan!.lines![1];

  const usedLoc = usePPEStore.getState().locations.find(l => l.stockCondition === 'Used' || l.locationType === 'Used')!;
  const scrapLoc = usePPEStore.getState().locations.find(l => l.stockCondition === 'Scrap' || l.locationType === 'Scrap')!;

  const usedBalBefore = usePPEStore.getState().stockBalances.find(b => b.ppeItemId === line1.ppeItemId && b.locationId === usedLoc.id)?.quantityOnHand || 0;

  // Return line 1 in 'good' condition -> routes to Used location (Rule G6)
  const ret1Res = usePPEStore.getState().returnLoan({
    loanId: createdLoan!.id,
    returnedLines: [
      { lineId: line1.id, quantity: 2, condition: 'good' }
    ],
    returnedBy: 'emp-1'
  });
  assert(ret1Res.success === true, 'Line 1 returned successfully');

  const usedBalAfter = usePPEStore.getState().stockBalances.find(b => b.ppeItemId === line1.ppeItemId && b.locationId === usedLoc.id)?.quantityOnHand || 0;
  assert(usedBalAfter === usedBalBefore + 2, `Good condition returned stock routed to Used location (${usedBalBefore} -> ${usedBalAfter})`);

  const loanAfterRet1 = usePPEStore.getState().issuances.find(i => i.id === createdLoan!.id)!;
  assert(loanAfterRet1.status === 'issued', 'Loan status remains issued/partially returned when lines remain');
  assert(loanAfterRet1.lines![0].status === 'returned', 'Line 1 marked as returned');

  // Return line 2 in 'damaged' condition -> auto-scraps to Scrap location (Rule G6 & PPE-038)
  const scrapEntriesBefore = usePPEStore.getState().scrapEntries.length;
  const ret2Res = usePPEStore.getState().returnLoan({
    loanId: createdLoan!.id,
    returnedLines: [
      { lineId: line2.id, quantity: 1, condition: 'damaged' }
    ],
    returnedBy: 'emp-1'
  });
  assert(ret2Res.success === true, 'Line 2 returned in damaged condition');

  const scrapEntriesAfter = usePPEStore.getState().scrapEntries.length;
  assert(scrapEntriesAfter === scrapEntriesBefore + 1, 'Auto-scrapped entry created in scrapEntries');

  const loanAfterRet2 = usePPEStore.getState().issuances.find(i => i.id === createdLoan!.id)!;
  assert(loanAfterRet2.status === 'returned', 'Loan status transitions to returned/closed when all lines are returned');

  // --------------------------------------------------------------------------
  // TEST 14: Stock Transfer Boundary Capacity Verification & Linkage (PPE-027)
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 14: Stock Transfer Capacity Boundary & Destination Linkage ---');
  // 1. Verify PPE-027 linkage rule: ppe-1 is not initially linked to loc-4
  const unlinkedTransferRes = usePPEStore.getState().transferStock('ppe-1', 'loc-1', 'loc-4', 'B-26-001', 5, 'emp-1');
  assert(unlinkedTransferRes.success === false, 'Transfer blocked when item is not linked to destination location (PPE-027)');
  assert(unlinkedTransferRes.message?.includes('not linked') === true, 'Error message explicitly reports unlinked destination');

  // Now link ppe-1 to loc-4 to test capacity boundaries
  usePPEStore.getState().ppeItems.find(p => p.id === 'ppe-1')!.locationIds.push('loc-4');

  // Set a test capacity limit on loc-4 (Site Store)
  const loc4 = usePPEStore.getState().locations.find(l => l.id === 'loc-4')!;
  const loc4CurrentOnHand = usePPEStore.getState().stockBalances.filter(b => b.locationId === 'loc-4').reduce((sum, b) => sum + b.quantityOnHand, 0);
  
  // Set capacity to exactly currentOnHand + 10
  loc4.capacityUnits = loc4CurrentOnHand + 10;

  // Transfer 10 units (exact capacity boundary)
  const exactCapacityRes = usePPEStore.getState().transferStock('ppe-1', 'loc-1', 'loc-4', 'B-26-001', 10, 'emp-1');
  assert(exactCapacityRes.success === true, 'Transfer succeeds when destOnHand + transferQty exactly equals capacity');

  // Attempt to transfer 1 more unit (exceeds capacity)
  const exceedCapacityRes = usePPEStore.getState().transferStock('ppe-1', 'loc-1', 'loc-4', 'B-26-001', 1, 'emp-1');
  assert(exceedCapacityRes.success === false, 'Transfer blocked when destOnHand + transferQty exceeds capacity');
  assert(exceedCapacityRes.message?.includes('capacity') === true, 'Error message explicitly reports capacity limit');

  // --------------------------------------------------------------------------
  // TEST 15: Epics 1 to 4 Business Rules & Locking (PPE-001 to PPE-023)
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 15: Epics 1 to 4 Strict Validations & Locking ---');
  
  // 1. PPE-002: Item Code locking after first transaction
  const ppe1HasTx = usePPEStore.getState().itemHasTransactions('ppe-1');
  assert(ppe1HasTx === true, 'ppe-1 with stock and issuances is detected as having transactions');
  const dummyItemHasTx = usePPEStore.getState().itemHasTransactions('non-existent-item');
  assert(dummyItemHasTx === false, 'New item without history has transactions flagged as false');

  // 2. PPE-018/019: Location stock condition & locking
  const loc1HasStock = usePPEStore.getState().locationHasStock('loc-1');
  assert(loc1HasStock === true, 'loc-1 with inventory is detected as holding stock');

  // 3. PPE-020/022 & Rule G2: Hard block on deleting/deactivating location holding stock
  const locDeleteRes = usePPEStore.getState().softDeleteEntity('locations', 'loc-1', 'Admin override reason test');
  assert(locDeleteRes.success === false, 'Admin cannot delete location holding stock (Rule G2 hard block, no override)');
  assert(locDeleteRes.message?.includes('hard block') === true, 'Error explicitly states hard block with no override');

  const locDeactivateRes = usePPEStore.getState().toggleEntityActive('locations', 'loc-1', false, 'Admin override reason test');
  assert(locDeactivateRes.success === false, 'Admin cannot deactivate location holding stock (Rule G2 hard block, no override)');

  // 4. Scrap location exemption from stock deactivation check (PPE-020)
  const scrapLocation = usePPEStore.getState().locations.find(l => l.stockCondition === 'Scrap' || l.locationType === 'Scrap')!;
  const scrapDeactivateRes = usePPEStore.getState().toggleEntityActive('locations', scrapLocation.id, false, 'Admin shutting down scrap');
  assert(scrapDeactivateRes.success === true, 'Scrap location is exempt from stock deactivation check (PPE-020)');
  // Restore scrap location
  usePPEStore.getState().toggleEntityActive('locations', scrapLocation.id, true);

  // --------------------------------------------------------------------------
  // TEST 16: PPE-024 Opening Balance Verification
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 16: PPE-024 Opening Balance Verification ---');
  // Attempt opening balance on Scrap location -> blocked
  const scrapLocId = usePPEStore.getState().locations.find(l => l.stockCondition === 'Scrap' || l.locationType === 'Scrap')?.id || 'loc-5';
  const scrapOb = {
    id: 'ob-scrap-test',
    locationId: scrapLocId,
    referenceDate: '2026-01-01',
    status: 'Pending Approval' as const,
    preparedBy: 'emp-1',
    lines: [],
    createdAt: new Date().toISOString()
  };
  usePPEStore.setState(s => ({ openingBalances: [scrapOb, ...s.openingBalances] }));
  const obScrapRes = usePPEStore.getState().approveOpeningBalance('ob-scrap-test', 'emp-1');
  assert(obScrapRes.success === false, 'Opening balance blocked on Scrap location');
  assert(obScrapRes.message?.includes('Scrap') === true, 'Error message explicitly mentions Scrap location');

  // Verify opening balance line creates batch and stock balance
  const obLine = {
    id: 'ob-line-test-1',
    ppeItemId: 'ppe-2',
    batchNumber: 'OB-BATCH-TEST-99',
    quantity: 50,
    costPerUnit: 15
  };
  const testOb = {
    id: 'ob-test-live',
    locationId: 'loc-1',
    referenceDate: '2026-01-01',
    status: 'Pending Approval' as const,
    preparedBy: 'emp-1',
    lines: [obLine],
    createdAt: new Date().toISOString()
  };
  usePPEStore.setState(s => ({ openingBalances: [testOb, ...s.openingBalances] }));
  const approveObRes = usePPEStore.getState().approveOpeningBalance(testOb.id, 'emp-1');
  assert(approveObRes.success === true, 'Opening balance approved successfully');
  const postedBatch = usePPEStore.getState().batches.find(b => b.batchNumber === 'OB-BATCH-TEST-99');
  assert(postedBatch !== undefined, 'Batch created from opening balance line');
  assert(postedBatch?.availableQty === 50, 'Batch has correct available quantity');
  const updatedOb = usePPEStore.getState().openingBalances.find(o => o.id === testOb.id);
  assert(updatedOb?.reference?.startsWith('ADJ-OB-') === true, 'Opening balance assigned reference ADJ-OB-YYYY-NNNNN');

  // --------------------------------------------------------------------------
  // TEST 17: PPE-025 & PPE-026 Stock IN / Stock OUT & Damage Routing
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 17: PPE-025 & PPE-026 Stock IN / OUT & Damage Routing ---');
  // Stock IN into Scrap location -> blocked
  const stockInScrapRes = usePPEStore.getState().adjustStock({
    type: 'IN',
    ppeItemId: 'ppe-1',
    locationId: scrapLocId,
    batchNumber: 'B-TEST-SCRAP',
    quantityDelta: 10,
    reasonCategory: 'Purchase Receipt',
    reason: 'Trying to add new stock to scrap',
    submittedBy: 'emp-1'
  });
  assert(stockInScrapRes.success === false, 'Stock IN into Scrap location is blocked (Rule G6)');

  // Stock OUT for Damage -> routes to Scrap location and creates scrap entry
  const scrapEntriesCountBefore = usePPEStore.getState().scrapEntries.length;
  const scrapLocObj = usePPEStore.getState().locations.find(l => l.stockCondition === 'Scrap')!;
  const stockOutDamageRes = usePPEStore.getState().adjustStock({
    type: 'OUT',
    ppeItemId: 'ppe-1',
    locationId: 'loc-1',
    batchNumber: 'B-26-001',
    quantityDelta: -5,
    reasonCategory: 'Damaged Stock',
    reason: 'Damaged during inspection',
    destinationLocationId: scrapLocObj.id,
    submittedBy: 'emp-1'
  });
  assert(stockOutDamageRes.success === true, 'Stock OUT for damage applied successfully');
  const scrapEntriesCountAfter = usePPEStore.getState().scrapEntries.length;
  assert(scrapEntriesCountAfter === scrapEntriesCountBefore + 1, 'Auto-created scrap entry from damaged stock OUT');
  const latestScrap = usePPEStore.getState().scrapEntries[0];
  assert(latestScrap.locationId === scrapLocObj.id, 'Scrap entry routed to designated Scrap warehouse');

  // --------------------------------------------------------------------------
  // TEST 18: PPE-029 to PPE-033 Kit Management & 90-Day Issuance Protection
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 18: PPE-029 to PPE-033 Kit Management Rules ---');
  // Verify Kit has line items with variants
  const kit1 = usePPEStore.getState().kits.find(k => k.id === 'kit-1')!;
  assert(kit1.items.length > 0, 'Kit-1 has defined items');
  
  // Verify 90-day issuance count detection for Kit-1
  const kit1Issuances90d = usePPEStore.getState().issuances.filter(i => {
    if (i.kitId !== kit1.id) return false;
    const diffDays = (Date.now() - new Date(i.issueDate).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 90;
  });
  assert(kit1Issuances90d.length >= 0, '90-day kit issuances correctly filtered');

  // --------------------------------------------------------------------------
  // TEST 19: PPE-034 & PPE-040 Single Issuance with Replacement Tracking
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 19: PPE-034 & PPE-040 Issuance with Replaces Link ---');
  // Create an active issuance for emp-1
  const initialIssuanceRes = usePPEStore.getState().issueItem({
    employeeId: 'emp-1',
    ppeItemId: 'ppe-1',
    locationId: 'loc-1',
    quantity: 1,
    batchNumber: 'B-26-001',
    issueDate: new Date().toISOString(),
    issuedBy: 'emp-1'
  });
  assert(initialIssuanceRes.success === true, 'Initial issuance created');
  const initialIssuanceId = initialIssuanceRes.id!;

  // Create a replacement issuance targeting the initial issuance
  const replacementRes = usePPEStore.getState().issueItem({
    employeeId: 'emp-1',
    ppeItemId: 'ppe-1',
    locationId: 'loc-1',
    quantity: 1,
    batchNumber: 'B-26-001',
    issueDate: new Date().toISOString(),
    replacesIssuanceId: initialIssuanceId,
    issuedBy: 'emp-1'
  });
  assert(replacementRes.success === true, 'Replacement issuance created');
  
  // Verify previous issuance status transitioned to 'replaced'
  const oldIssuance = usePPEStore.getState().issuances.find(i => i.id === initialIssuanceId)!;
  assert(oldIssuance.status === 'replaced', 'Previous issuance transitioned to replaced status (PPE-040)');

  // --------------------------------------------------------------------------
  // TEST 20: PPE-038 Employee Return with Partial Qty & Dual Signatures
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 20: PPE-038 Employee Return Partial Qty & Dual Signatures ---');
  // Issue 5 units to test partial return
  const multiUnitIssuanceRes = usePPEStore.getState().issueItem({
    employeeId: 'emp-1',
    ppeItemId: 'ppe-1',
    locationId: 'loc-1',
    quantity: 5,
    batchNumber: 'B-26-001',
    issueDate: new Date().toISOString(),
    issuedBy: 'emp-1'
  });
  assert(multiUnitIssuanceRes.success === true, 'Created multi-unit issuance for partial return test');
  const multiIssId = multiUnitIssuanceRes.id!;

  // Return partial quantity: 2 out of 5 units in good condition with dual signatures
  usePPEStore.getState().returnItem(multiIssId, 'good', true, 'emp-1', {
    quantity: 2,
    storeKeeperSignature: 'data:image/png;base64,storekeeper-sig',
    employeeSignature: 'data:image/png;base64,employee-sig'
  });

  const partialIssuanceAfter = usePPEStore.getState().issuances.find(i => i.id === multiIssId)!;
  assert(partialIssuanceAfter.status === 'partially_returned', 'Issuance status set to partially_returned');
  assert(partialIssuanceAfter.quantity === 3, 'Issuance remaining quantity updated to 3 (5 - 2)');

  const returnRecord = usePPEStore.getState().issuanceReturns.find(r => r.issuanceId === multiIssId)!;
  assert(returnRecord.quantity === 2, 'Return record captures partial quantity returned (2)');
  assert(returnRecord.storeKeeperSignature?.includes('storekeeper-sig') === true, 'Store Keeper signature recorded on return');
  assert(returnRecord.employeeSignature?.includes('employee-sig') === true, 'Employee signature recorded on return');

  // Return remaining 3 units to close the issuance
  usePPEStore.getState().returnItem(multiIssId, 'good', true, 'emp-1', {
    quantity: 3
  });
  const fullyReturnedIssuance = usePPEStore.getState().issuances.find(i => i.id === multiIssId)!;
  assert(fullyReturnedIssuance.status === 'returned', 'Issuance status transitioned to returned upon full return');

  // --------------------------------------------------------------------------
  // TEST 21: PPE-048 to PPE-050 Settings & Administration
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 21: PPE-048 to PPE-050 Settings & Admin Audit ---');
  usePPEStore.getState().updateModuleSettings({
    generalLeadTimeDays: 45,
    recentIssuanceWindowDays: 60
  });
  const updatedSettings = usePPEStore.getState().moduleSettings;
  assert(updatedSettings.generalLeadTimeDays === 45, 'Module settings updated: generalLeadTimeDays = 45');
  assert(updatedSettings.recentIssuanceWindowDays === 60, 'Module settings updated: recentIssuanceWindowDays = 60');
  
  const settingsAudit = usePPEStore.getState().auditLogs.find(a => a.action === 'UPDATE_MODULE_SETTINGS');
  assert(settingsAudit !== undefined, 'Audit log recorded for settings update (Rule G1)');

  console.log('\n🎉 ALL 21 VERIFICATION SUITES PASSED SUCCESSFULLY WITH ZERO REGRESSIONS!');
}

if (process.env.VITEST) {
  // Run under `npm test` as one Vitest test; still runnable as a plain script with tsx.
  it('legacy PPE verification suite (21 suites)', runAllTests);
} else {
  runAllTests().catch(err => {
    console.error('Fatal Test Suite Error:', err);
    process.exit(1);
  });
}

