import { create } from 'zustand';
import { generateId } from '../lib/utils';
import * as mockData from './mockData';
import { 
  JobPosition, Location, Attribute, ItemGroup, PPEItem, Kit, Employee, 
  StockBalance, StockMovement, StockAdjustment, Issuance, IssuanceReturn, 
  ScrapEntry, ModuleSettings, BaseEntity, OpeningBalance, Batch, AuditLog, LoanLineItem,
  UnitOfMeasure, SerialUnit, SerialEvent, SerialStatus
} from '../types';
import { addDays, addMonths, addYears } from 'date-fns';
import { seedDefaultUnits, SystemFlags } from './migrations';
import { registerSerialUnits, moveSerialUnits, MoveParams } from './serialEngine';
import { SerialEntryError, validateSerialEntry } from '../lib/serials';

export interface InUseCheckResult {
  inUse: boolean;
  reasons: string[];
}

export type ActionResult = { success: boolean; message?: string };

/** G2: Admin override reason must be at least this long (PPE-002). */
export const OVERRIDE_REASON_MIN = 10;

/** PPE-051: one word, letters, digits, dash or underscore. */
export const UNIT_CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Entity collections that support Trash Bin (G10). */
export type TrashableCollection = 'ppeItems' | 'locations' | 'attributes' | 'itemGroups' | 'kits' | 'units';

const isScrapLocation = (l?: Location) => !!l && (l.stockCondition === 'Scrap' || l.locationType === 'Scrap');

/** Stock OUT reasons (PPE-026) that destroy a serial unit rather than write it off. */
const SCRAP_REASONS = ['Physical Damage', 'Expired Disposal', 'Damaged', 'Damaged in Store', 'Expired'];
const isQuarantineReason = (r?: string) => !!r && r.toLowerCase().startsWith('quarantin');

export interface AppState {
  currentUser: Employee;
  setCurrentUser: (user: Employee) => void;
  
  jobPositions: JobPosition[];
  locations: Location[];
  attributes: Attribute[];
  itemGroups: ItemGroup[];
  ppeItems: PPEItem[];
  kits: Kit[];
  employees: Employee[];
  stockBalances: StockBalance[];
  stockAdjustments: StockAdjustment[];
  stockMovements: StockMovement[];
  issuances: Issuance[];
  issuanceReturns: IssuanceReturn[];
  scrapEntries: ScrapEntry[];
  expirySettings: ModuleSettings;
  moduleSettings: ModuleSettings;
  openingBalances: OpeningBalance[];
  batches: Batch[];
  auditLogs: AuditLog[];
  units: UnitOfMeasure[];
  serialUnits: SerialUnit[];
  serialEvents: SerialEvent[];
  systemFlags: SystemFlags;

  // Units of Measure (Epic 11)
  unitUsage: (unitId: string) => { itemIds: string[]; itemCount: number; trashedItemCount: number };
  runDefaultUnitSeed: () => { created: string[] };
  getUnitSymbol: (ppeItemId?: string) => string;

  // Serial Numbers (Epic 12)
  describeSerialLocation: (unit: SerialUnit) => string;
  validateNewSerials: (ppeItemId: string, serials: string[]) => SerialEntryError[];
  inStockSerials: (ppeItemId: string, locationId: string, batchNumber?: string) => SerialUnit[];
  visibleSerialUnits: (user?: Employee) => SerialUnit[];

  // G1 Audit Logger
  recordAudit: (params: {
    action: string;
    objectType: string;
    objectReference: string;
    before?: any;
    after?: any;
    details?: string;
    reason?: string;
    performedBy?: string;
  }) => void;

  // G2 In-Use Protection Engine
  checkInUse: (entityName: 'ppeItems' | 'locations' | 'attributes' | 'itemGroups' | 'kits', id: string) => InUseCheckResult;
  itemHasTransactions: (itemId: string) => boolean;
  locationHasStock: (locationId: string) => boolean;
  saveEntity: <T extends BaseEntity>(entityName: keyof AppState, entity: T, reason?: string) => ActionResult;
  softDeleteEntity: (entityName: keyof AppState, id: string, overrideReason?: string) => ActionResult;
  toggleEntityActive: (entityName: keyof AppState, id: string, active: boolean, overrideReason?: string) => ActionResult;
  restoreEntity: (entityName: keyof AppState, id: string, newCode?: string) => ActionResult & { codeTaken?: boolean };
  purgeEntity: (entityName: keyof AppState, id: string) => ActionResult;
  purgeEligibleTrash: () => { purgedCount: number };

  // Stock & Opening Balance
  saveOpeningBalance: (ob: OpeningBalance) => ActionResult;
  approveOpeningBalance: (id: string, approverId: string) => ActionResult;
  rejectOpeningBalance: (id: string, reason: string) => void;
  closeOpeningBalance: (locationId: string, byId: string) => void;

  // Stock Adjustments & Movements
  adjustStock: (adjustment: any) => { success: boolean; message?: string; id?: string };
  reviewAdjustment: (id: string, status: 'approved' | 'rejected', reviewerId: string) => ActionResult;
  transferStock: (ppeItemId: string, fromLocationId: string, toLocationId: string, batchNumber: string, quantity: number, byId: string, serialIds?: string[]) => ActionResult;
  
  // G9 Quarantine Management
  quarantineBatch: (batchId: string, quantity: number, reason: string, byId: string) => void;
  releaseQuarantineBatch: (batchId: string, quantity: number, byId: string) => void;

  // Issuances & Kits
  calculateLifespanDate: (item: PPEItem, startDate?: Date) => string;
  validateGenderMatch: (employeeId: string, ppeItemId: string, variantValueId?: string) => { valid: boolean; reason?: string };
  issueItem: (issuance: Omit<Issuance, 'id' | 'status'>) => { success: boolean; id: string; message?: string };
  issueKit: (data: {
    employeeId: string;
    kitId: string;
    locationId: string;
    quantity: number;
    itemVariants?: Record<string, string>;
    selectedItemIds?: string[];
    itemSerials?: Record<string, string[]>; // PPE-058: serial unit ids per tracked kit item
    storeKeeperSignature?: string;
    receiverSignature?: string;
    issuedBy: string;
  }) => { success: boolean; issuanceIds: string[]; message?: string };

  // Loans (PPE-036, PPE-037, PPE-041)
  issueLoan: (data: {
    holderName: string;
    holderType: string;
    companyName?: string;
    contactNumber?: string;
    hostEmployeeId?: string;
    locationId: string;
    expectedReturnDate: string;
    items: { ppeItemId: string; quantity: number; batchNumber?: string; serialIds?: string[] }[];
    storeKeeperSignature?: string;
    receiverSignature?: string;
    issuedBy: string;
  }) => { success: boolean; reference: string; id?: string; message?: string };
  returnLoan: (data: {
    loanId: string;
    returnedLines: { lineId: string; quantity: number; condition: 'good' | 'damaged' | 'worn_out' | 'lost'; serialIds?: string[] }[];
    storeKeeperSignature?: string;
    receiverSignature?: string;
    returnedBy: string;
  }) => { success: boolean; message?: string };
  returnLoanLine: (issuanceId: string, lineId: string, condition: 'good' | 'damaged' | 'worn_out' | 'lost', returnedBy: string) => void;

  // Returns & Scrap
  returnItem: (
    issuanceId: string, 
    condition: 'good' | 'damaged' | 'worn_out' | 'lost', 
    physicalReceiptConfirmed: boolean, 
    returnedBy: string,
    options?: {
      quantity?: number;
      storeKeeperSignature?: string;
      employeeSignature?: string;
      serialIds?: string[]; // PPE-058: returned serial units of a tracked item
    }
  ) => ActionResult;
  reverseScrap: (id: string, reason: string, reversedBy: string) => void;

  // Employee Lifecycle & Tracking (PPE-042, PPE-043, G12)
  setEmployeeStatus: (employeeId: string, status: 'Active' | 'Terminated' | 'Transferred' | 'Inactive', byId: string) => void;

  // Historical Import (PPE-044)
  importHistoricalIssuances: (imported: Partial<Issuance>[], byId: string) => { count: number };

  // Module Settings (PPE-050)
  updateModuleSettings: (settings: Partial<ModuleSettings>) => void;
  updateExpirySettings: (settings: ModuleSettings) => void;
}

/** PPE-057: every tracked line of an opening balance needs valid, unique serials (across all its lines too). */
function validateOpeningBalanceSerials(state: AppState, ob: OpeningBalance): string | null {
  const byItem = new Map<string, string[]>();
  for (const line of ob.lines) {
    const item = state.ppeItems.find(p => p.id === line.ppeItemId);
    if (!item?.serialTracked) continue;
    const serials = line.serialNumbers || [];
    if (serials.length === 0) return `${item.itemCode} is serial tracked: enter one serial number per unit.`;
    byItem.set(item.id, [...(byItem.get(item.id) || []), ...serials]);
  }
  for (const [itemId, serials] of byItem) {
    const errors = state.validateNewSerials(itemId, serials);
    if (errors.length > 0) return errors[0].message;
  }
  return null;
}

/** Decrease batch availability by one per serial, grouped by the serial's batch. */
function deductSerialBatches(batches: Batch[], units: SerialUnit[], locationId: string): Batch[] {
  const next = [...batches];
  const counts = new Map<string, number>();
  for (const u of units) if (u.batchNumber) counts.set(u.batchNumber, (counts.get(u.batchNumber) || 0) + 1);
  for (const [batchNumber, n] of counts) {
    const idx = next.findIndex(b => b.batchNumber === batchNumber && b.ppeItemId === units[0].ppeItemId && b.locationId === locationId);
    if (idx >= 0) {
      const avail = Math.max(0, next[idx].availableQty - n);
      next[idx] = { ...next[idx], availableQty: avail, status: avail <= 0 ? 'Depleted' : 'Active' };
    }
  }
  return next;
}

/**
 * PPE-058 Stock OUT: the picked units take the reason's status. Routed to a Scrap location or a
 * damage / disposal reason means Scrapped; any other reason means Written off.
 */
function stockOutMove(adjustment: any, ppeItemId: string, serialIds: string[]): MoveParams {
  const scrapped = !!adjustment.destinationLocationId || SCRAP_REASONS.includes(adjustment.reasonCategory);
  return {
    ppeItemId,
    serialIds,
    expect: { status: 'In Stock', locationId: adjustment.locationId },
    to: { status: scrapped ? 'Scrapped' : 'Written off', locationId: adjustment.destinationLocationId || undefined },
    eventTypes: [scrapped ? 'Scrap' : 'Write off'],
    userId: adjustment.submittedBy,
    reference: adjustment.reference,
    note: `${adjustment.reasonCategory}: ${adjustment.reason}`,
  };
}

/**
 * PPE-037 / PPE-038: where a returned serial goes. Good goes back In Stock (the Used location),
 * Damaged or Worn out is scrapped automatically, Lost (or damage not physically received) is written off.
 */
function serialReturnTarget(
  condition: 'good' | 'damaged' | 'worn_out' | 'lost',
  usedLocationId: string,
  scrapLocationId: string,
  physicallyReceived = true
): { to: MoveParams['to']; extraEvents: MoveParams['eventTypes'] } {
  if (condition === 'good') return { to: { status: 'In Stock', locationId: usedLocationId }, extraEvents: [] };
  if ((condition === 'damaged' || condition === 'worn_out') && physicallyReceived) {
    return { to: { status: 'Scrapped', locationId: scrapLocationId }, extraEvents: ['Scrap'] };
  }
  return { to: { status: 'Written off' }, extraEvents: ['Write off'] };
}

/** Add (or subtract) quantity on a stock balance row, creating it when needed. */
function bumpBalance(balances: StockBalance[], ppeItemId: string, locationId: string, delta: number): StockBalance[] {
  const next = [...balances];
  const idx = next.findIndex(b => b.ppeItemId === ppeItemId && b.locationId === locationId);
  if (idx >= 0) next[idx] = { ...next[idx], quantityOnHand: Math.max(0, next[idx].quantityOnHand + delta) };
  else if (delta > 0) next.push({ id: generateId(), ppeItemId, locationId, quantityOnHand: delta, quarantinedOnHand: 0 });
  return next;
}

// PPE-056: default units are created once at setup, guarded by the one-time marker.
const initialUnitSeed = seedDefaultUnits(mockData.mockUnits, {}, '2026-08-01T08:00:00Z');

export const usePPEStore = create<AppState>((set, get) => ({
  currentUser: mockData.mockEmployees[0], // Admin by default
  setCurrentUser: (user) => set({ currentUser: user }),
  
  jobPositions: mockData.mockJobPositions,
  locations: mockData.mockLocations,
  attributes: mockData.mockAttributes,
  itemGroups: mockData.mockItemGroups,
  ppeItems: mockData.mockPPEItems,
  kits: mockData.mockKits,
  employees: mockData.mockEmployees,
  stockBalances: mockData.mockStockBalances,
  stockAdjustments: mockData.mockStockAdjustments,
  stockMovements: [],
  issuances: mockData.mockIssuances,
  issuanceReturns: mockData.mockIssuanceReturns,
  scrapEntries: mockData.mockScrapEntries,
  expirySettings: mockData.mockExpirySettings,
  moduleSettings: mockData.mockExpirySettings,
  openingBalances: mockData.mockOpeningBalances,
  batches: mockData.mockBatches,
  auditLogs: mockData.mockAuditLogs,
  units: initialUnitSeed.units,
  serialUnits: mockData.mockSerialUnits,
  serialEvents: mockData.mockSerialEvents,
  systemFlags: initialUnitSeed.flags,

  // ---------------------------------------------------------------------------
  // Units of Measure (Epic 11)
  // ---------------------------------------------------------------------------
  unitUsage: (unitId) => {
    const users = get().ppeItems.filter(p => p.unitId === unitId);
    return {
      itemIds: users.filter(p => !p.deletedAt).map(p => p.id),
      itemCount: users.filter(p => !p.deletedAt).length, // PPE-053: active + inactive, excludes trashed
      trashedItemCount: users.filter(p => !!p.deletedAt).length,
    };
  },

  runDefaultUnitSeed: () => {
    const state = get();
    const res = seedDefaultUnits(state.units, state.systemFlags);
    if (res.created.length === 0 && state.systemFlags.defaultUnitsSeeded) return { created: [] };
    set({ units: res.units, systemFlags: res.flags });
    if (res.created.length > 0) {
      get().recordAudit({
        action: 'CREATE',
        objectType: 'units',
        objectReference: res.created.join(', '),
        details: `Default units seeded: ${res.created.join(', ')}`,
        performedBy: 'system',
      });
    }
    return { created: res.created };
  },

  getUnitSymbol: (ppeItemId) => {
    const state = get();
    const item = state.ppeItems.find(p => p.id === ppeItemId);
    return state.units.find(u => u.id === item?.unitId)?.symbol || '';
  },

  // ---------------------------------------------------------------------------
  // Serial Numbers (Epic 12)
  // ---------------------------------------------------------------------------
  describeSerialLocation: (unit) => {
    const state = get();
    const locName = (id?: string) => state.locations.find(l => l.id === id)?.name || id || '-';
    switch (unit.status) {
      case 'In Stock': return `In Stock at ${locName(unit.locationId)}`;
      case 'Issued': {
        const emp = state.employees.find(e => e.id === unit.holderEmployeeId);
        return `Issued to ${emp ? `${emp.name} (${emp.employeeCode})` : unit.holderEmployeeId || 'an employee'}`;
      }
      case 'On Loan': return `On Loan to ${unit.holderName || 'a borrower'}`;
      case 'Scrapped': return unit.locationId ? `Scrapped at ${locName(unit.locationId)}` : 'Scrapped';
      case 'Written off': return 'Written off';
    }
  },

  validateNewSerials: (ppeItemId, serials) => {
    const state = get();
    const byItem = new Map(state.serialUnits.filter(u => u.ppeItemId === ppeItemId).map(u => [u.serial, u]));
    return validateSerialEntry(serials, s => {
      const u = byItem.get(s);
      return u ? state.describeSerialLocation(u) : null;
    });
  },

  inStockSerials: (ppeItemId, locationId, batchNumber) =>
    get().serialUnits
      .filter(u => u.ppeItemId === ppeItemId && u.status === 'In Stock' && u.locationId === locationId && (!batchNumber || u.batchNumber === batchNumber))
      .sort((a, b) => a.serial.localeCompare(b.serial)),

  // PPE-059 / PPE-023: Store Keepers see only serials at (or last at) their assigned locations.
  visibleSerialUnits: (user) => {
    const state = get();
    const u = user || state.currentUser;
    if (u.role === 'Admin' || u.role === 'HSE Supervisor') return state.serialUnits;
    if (u.role === 'Store Keeper') {
      const mine = new Set(state.locations.filter(l => l.assignedStoreKeeperIds?.includes(u.id)).map(l => l.id));
      return state.serialUnits.filter(s => mine.has(s.locationId || s.lastLocationId));
    }
    return [];
  },

  // G1 Immutable Audit Trail
  recordAudit: ({ action, objectType, objectReference, before, after, details, reason, performedBy }) => {
    const user = performedBy || get().currentUser.id;
    const emp = get().employees.find(e => e.id === user);
    const newLog: AuditLog = {
      id: generateId(),
      entityType: objectType as any,
      entityId: objectReference,
      action,
      details: details || (reason ? `${action} - ${reason}` : action),
      performedBy: user,
      user: emp ? `${emp.name} (${emp.role})` : user,
      objectType,
      objectReference,
      before: before ? JSON.parse(JSON.stringify(before)) : undefined,
      after: after ? JSON.parse(JSON.stringify(after)) : undefined,
      reason,
      timestamp: new Date().toISOString()
    };
    set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
  },

  itemHasTransactions: (itemId: string) => {
    const state = get();
    const hasIssuances = state.issuances.some(i => i.ppeItemId === itemId || (i.lines && i.lines.some(l => l.ppeItemId === itemId)));
    const hasAdjustments = state.stockAdjustments.some(a => a.ppeItemId === itemId);
    const hasMovements = state.stockMovements.some(m => m.ppeItemId === itemId);
    const hasBatches = state.batches.some(b => b.ppeItemId === itemId);
    // Opening balance lines count once submitted (a Draft is not a transaction yet).
    const hasOpeningBalance = state.openingBalances.some(o => o.status !== 'Draft' && o.status !== 'Rejected' && o.lines.some(l => l.ppeItemId === itemId));
    const hasSerials = state.serialUnits.some(u => u.ppeItemId === itemId);
    const hasScrap = state.scrapEntries.some(s => s.ppeItemId === itemId);
    return hasIssuances || hasAdjustments || hasMovements || hasBatches || hasOpeningBalance || hasSerials || hasScrap;
  },

  locationHasStock: (locationId: string) => {
    const state = get();
    return state.stockBalances.some(b => b.locationId === locationId && b.quantityOnHand > 0);
  },

  // G2 In-Use Protection Engine
  checkInUse: (entityName, id) => {
    const state = get();
    const reasons: string[] = [];

    if (entityName === 'ppeItems') {
      const activeHoldings = state.issuances.filter(i => (i.ppeItemId === id || (i.lines && i.lines.some(l => l.ppeItemId === id))) && i.status === 'issued');
      if (activeHoldings.length > 0) {
        reasons.push(`Currently held by ${activeHoldings.length} employee(s) or active loan(s).`);
      }
      const positiveStock = state.stockBalances.filter(b => b.ppeItemId === id && b.quantityOnHand > 0);
      if (positiveStock.length > 0) {
        const totalStock = positiveStock.reduce((acc, curr) => acc + curr.quantityOnHand, 0);
        reasons.push(`Positive stock balance exists (${totalStock} units on hand across locations).`);
      }
      const attachedKits = state.kits.filter(k => k.active && !k.deletedAt && k.items.some(ki => ki.ppeItemId === id));
      if (attachedKits.length > 0) {
        reasons.push(`Included in ${attachedKits.length} active kit(s).`);
      }
    } else if (entityName === 'locations') {
      const loc = state.locations.find(l => l.id === id);
      const isScrap = loc?.stockCondition === 'Scrap' || loc?.locationType === 'Scrap';
      if (loc && !isScrap) {
        const positiveStock = state.stockBalances.filter(b => b.locationId === id && b.quantityOnHand > 0);
        if (positiveStock.length > 0) {
          reasons.push(`Location holds active stock balance (${positiveStock.length} items with positive quantity). Hard block: stock must be moved first.`);
        }
      }
      const openLoans = state.issuances.filter(i => i.locationId === id && (i.isLoan || !!i.expectedReturnDate) && i.status !== 'returned');
      if (openLoans.length > 0) {
        reasons.push(`Location has ${openLoans.length} open loan(s) that must be closed first.`);
      }
      const soleLocationItems = state.ppeItems.filter(p => p.active && !p.deletedAt && p.locationIds.length === 1 && p.locationIds[0] === id);
      if (soleLocationItems.length > 0) {
        reasons.push(`Location is the only storage location for ${soleLocationItems.length} active item(s).`);
      }
    } else if (entityName === 'attributes') {
      const linkedGroups = state.itemGroups.filter(g => g.active && !g.deletedAt && g.attributeIds.includes(id));
      if (linkedGroups.length > 0) {
        reasons.push(`Assigned to ${linkedGroups.length} active item group(s).`);
      }
      const usedByItems = state.ppeItems.filter(p => p.active && !p.deletedAt && p.variantAttributeValueIds?.length);
      if (usedByItems.length > 0) {
        const attr = state.attributes.find(a => a.id === id);
        const valIds = attr?.values.map(v => v.id) || [];
        const itemsWithAttr = usedByItems.filter(p => p.variantAttributeValueIds?.some(v => valIds.includes(v)));
        if (itemsWithAttr.length > 0) {
          reasons.push(`Values are referenced by ${itemsWithAttr.length} active item(s).`);
        }
      }
    } else if (entityName === 'itemGroups') {
      const activeItems = state.ppeItems.filter(p => p.active && !p.deletedAt && p.itemGroupId === id);
      if (activeItems.length > 0) {
        reasons.push(`Associated with ${activeItems.length} active PPE item(s).`);
      }
    } else if (entityName === 'kits') {
      const activeKitIssuances = state.issuances.filter(i => i.kitId === id && i.status === 'issued');
      if (activeKitIssuances.length > 0) {
        reasons.push(`Currently referenced by active issuances.`);
      }
      // PPE-029: sole active kit of a position with recent issuances in last 90 days
      const kit = state.kits.find(k => k.id === id);
      if (kit) {
        const otherActiveKits = state.kits.filter(k => k.id !== id && k.jobPositionId === kit.jobPositionId && k.active && !k.deletedAt);
        if (otherActiveKits.length === 0) {
          const recentThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          const hasRecent = state.issuances.some(i => i.kitId === id && new Date(i.issueDate) >= recentThreshold);
          if (hasRecent) {
            reasons.push(`Sole active kit for position with issuances in the last 90 days.`);
          }
        }
      }
    }

    return {
      inUse: reasons.length > 0,
      reasons
    };
  },

  saveEntity: (entityName, entity, reason) => {
    const state = get();
    const list = state[entityName] as any[];
    const existingIdx = list.findIndex(e => e.id === entity.id);
    const isNew = existingIdx < 0;
    const before = !isNew ? list[existingIdx] : undefined;
    let entityToSave: any = { ...entity, id: entity.id || generateId() };

    // Epic 11: Units of Measure (PPE-051, PPE-052)
    if (entityName === 'units') {
      const u = entityToSave as UnitOfMeasure;
      const now = new Date().toISOString();
      const code = String(u.code ?? '').trim();
      if (isNew) {
        if (!code) return { success: false, message: 'Code is required.' };
        if (!UNIT_CODE_PATTERN.test(code)) return { success: false, message: 'Code must be one word (letters, digits, dash or underscore).' };
        // Trashed units still count for uniqueness; upper and lower case count as the same.
        if (state.units.some(x => x.code.toUpperCase() === code.toUpperCase())) {
          return { success: false, message: `Code ${code.toUpperCase()} already exists (including units in the Trash Bin).` };
        }
      } else if (code.toUpperCase() !== String(before.code).toUpperCase()) {
        return { success: false, message: 'Code cannot change after saving.' };
      }
      if (!String(u.name ?? '').trim()) return { success: false, message: 'Name is required.' };
      if (!String(u.symbol ?? '').trim()) return { success: false, message: 'Symbol is required.' };
      if (!isNew && before.active && u.active === false) {
        const usage = state.unitUsage(u.id);
        const total = usage.itemCount + usage.trashedItemCount;
        if (total > 0) return { success: false, message: `Cannot deactivate: ${total} item(s) use this unit (including items in the Trash Bin). There is no override.` };
      }
      entityToSave = {
        ...u,
        code: isNew ? code.toUpperCase() : before.code,
        name: u.name.trim(),
        symbol: u.symbol.trim(),
        active: u.active !== false,
        deletedAt: isNew ? null : before.deletedAt,
        createdAt: isNew ? now : before.createdAt,
        createdBy: isNew ? state.currentUser.id : before.createdBy,
        updatedAt: isNew ? undefined : now,
        updatedBy: isNew ? undefined : state.currentUser.id,
      };
    }

    // PPE-001 / PPE-002: unit reference and first-transaction locks
    if (entityName === 'ppeItems') {
      const item = entityToSave as PPEItem;
      const unit = state.units.find(x => x.id === item.unitId);
      if (!unit || unit.deletedAt) return { success: false, message: 'Unit of Measure is required.' };
      if (!unit.active && (isNew || before.unitId !== item.unitId)) {
        return { success: false, message: `Unit ${unit.code} is inactive. Pick an active unit.` };
      }
      entityToSave = { ...item, serialTracked: !!item.serialTracked };
      if (!isNew && state.itemHasTransactions(item.id)) {
        if (item.itemCode !== before.itemCode) {
          return { success: false, message: 'Item Code is locked after the item\'s first transaction.' };
        }
        if (!!item.serialTracked !== !!before.serialTracked) {
          return { success: false, message: 'Serial Number tracked is locked after the item\'s first transaction.' };
        }
      }
    }

    set((s) => {
      if (isNew) {
        return { [entityName]: [...(s[entityName] as any[]), entityToSave] } as Partial<AppState>;
      } else {
        const newList = [...(s[entityName] as any[])];
        newList[existingIdx] = entityToSave;
        return { [entityName]: newList } as Partial<AppState>;
      }
    });

    get().recordAudit({
      action: isNew ? 'CREATE' : 'UPDATE',
      objectType: String(entityName),
      objectReference: entityToSave.code || entityToSave.itemCode || entityToSave.id,
      before,
      after: entityToSave,
      reason
    });
    return { success: true };
  },

  softDeleteEntity: (entityName, id, overrideReason) => {
    const state = get();
    const currentUser = state.currentUser;

    // PPE-055: a unit used by any item (trashed included) cannot be trashed. No override.
    if (entityName === 'units') {
      const usage = state.unitUsage(id);
      const total = usage.itemCount + usage.trashedItemCount;
      if (total > 0) {
        return { success: false, message: `Cannot move to Trash: ${total} item(s) use this unit (including items in the Trash Bin). There is no override.` };
      }
    }

    if (['ppeItems', 'locations', 'attributes', 'itemGroups', 'kits'].includes(entityName as string)) {
      if (entityName === 'locations') {
        const loc = state.locations.find(l => l.id === id);
        const isScrap = loc?.stockCondition === 'Scrap' || loc?.locationType === 'Scrap';
        const hasStock = state.stockBalances.some(b => b.locationId === id && b.quantityOnHand > 0);
        const hasOpenLoans = state.issuances.some(i => i.locationId === id && (i.isLoan || !!i.expectedReturnDate) && i.status !== 'returned');
        const isOnlyLocation = state.ppeItems.some(p => p.active && !p.deletedAt && p.locationIds.length === 1 && p.locationIds[0] === id);

        if ((!isScrap && hasStock) || hasOpenLoans || isOnlyLocation) {
          const detail = (!isScrap && hasStock)
            ? 'Location holds stock (hard block with no override, move stock first).'
            : hasOpenLoans
            ? 'Location has open loans that must be closed first.'
            : 'Location is the sole location for active items.';
          return { success: false, message: `Deletion blocked: ${detail}` };
        }
      }

      const inUseCheck = state.checkInUse(entityName as any, id);
      if (inUseCheck.inUse) {
        const isAdmin = currentUser.role === 'Admin';
        if (!isAdmin) {
          return { success: false, message: `Cannot delete: in-use protection triggered. ${inUseCheck.reasons.join(' ')}` };
        }
        if (!overrideReason || overrideReason.trim().length < OVERRIDE_REASON_MIN) {
          return { success: false, message: `Admin override requires a reason of at least ${OVERRIDE_REASON_MIN} characters. In-use reasons: ${inUseCheck.reasons.join(' ')}` };
        }
      }
    }

    const list = state[entityName] as any[];
    const item = list.find(e => e.id === id);
    if (!item) return { success: false, message: 'Entity not found.' };

    const before = { ...item };
    const updated = { ...item, active: false, deletedAt: new Date().toISOString() };

    set((s) => ({
      [entityName]: (s[entityName] as any[]).map(e => e.id === id ? updated : e)
    } as Partial<AppState>));

    get().recordAudit({
      action: overrideReason ? 'DELETE_WITH_OVERRIDE' : 'SOFT_DELETE',
      objectType: String(entityName),
      objectReference: id,
      before,
      after: updated,
      reason: overrideReason || 'Moved to Trash Bin'
    });

    return { success: true };
  },

  toggleEntityActive: (entityName, id, active, overrideReason) => {
    const state = get();
    const currentUser = state.currentUser;

    // PPE-052 / PPE-053: a unit in use (trashed items included) cannot be deactivated. No override.
    if (!active && entityName === 'units') {
      const usage = state.unitUsage(id);
      const total = usage.itemCount + usage.trashedItemCount;
      if (total > 0) {
        return { success: false, message: `Cannot deactivate: ${total} item(s) use this unit (including items in the Trash Bin). There is no override.` };
      }
    }

    if (!active && ['ppeItems', 'locations', 'attributes', 'itemGroups', 'kits'].includes(entityName as string)) {
      if (entityName === 'locations') {
        const loc = state.locations.find(l => l.id === id);
        const isScrap = loc?.stockCondition === 'Scrap' || loc?.locationType === 'Scrap';
        const hasStock = state.stockBalances.some(b => b.locationId === id && b.quantityOnHand > 0);
        const hasOpenLoans = state.issuances.some(i => i.locationId === id && (i.isLoan || !!i.expectedReturnDate) && i.status !== 'returned');
        const isOnlyLocation = state.ppeItems.some(p => p.active && !p.deletedAt && p.locationIds.length === 1 && p.locationIds[0] === id);

        if ((!isScrap && hasStock) || hasOpenLoans || isOnlyLocation) {
          const detail = (!isScrap && hasStock)
            ? 'Location holds stock (hard block with no override, move stock first).'
            : hasOpenLoans
            ? 'Location has open loans that must be closed first.'
            : 'Location is the sole location for active items.';
          return { success: false, message: `Deactivation blocked: ${detail}` };
        }
      }

      const inUseCheck = state.checkInUse(entityName as any, id);
      if (inUseCheck.inUse) {
        const isAdmin = currentUser.role === 'Admin';
        if (!isAdmin) {
          return { success: false, message: `Cannot deactivate: in-use protection active. ${inUseCheck.reasons.join(' ')}` };
        }
        if (!overrideReason || overrideReason.trim().length < OVERRIDE_REASON_MIN) {
          return { success: false, message: `Admin override requires a reason of at least ${OVERRIDE_REASON_MIN} characters. ${inUseCheck.reasons.join(' ')}` };
        }
      }
    }

    const list = state[entityName] as any[];
    const item = list.find(e => e.id === id);
    if (!item) return { success: false, message: 'Entity not found.' };

    const before = { ...item };
    const updated = { ...item, active };

    set((s) => ({
      [entityName]: (s[entityName] as any[]).map(e => e.id === id ? updated : e)
    } as Partial<AppState>));

    get().recordAudit({
      action: active ? 'ACTIVATE' : (overrideReason ? 'DEACTIVATE_WITH_OVERRIDE' : 'DEACTIVATE'),
      objectType: String(entityName),
      objectReference: id,
      before,
      after: updated,
      reason: overrideReason
    });

    return { success: true };
  },

  restoreEntity: (entityName, id, newCode) => {
    const state = get();
    const list = state[entityName] as any[];
    const item = list.find(e => e.id === id);
    if (!item) return { success: false, message: 'Entity not found.' };

    // PPE-048 / PPE-055: the code must not be taken by another record; Admin may give a new code.
    const codeField = entityName === 'ppeItems' ? 'itemCode' : (entityName === 'kits' ? null : 'code');
    let restoredCode: string | undefined;
    if (codeField) {
      const wanted = String(newCode ?? item[codeField] ?? '').trim();
      if (!wanted) return { success: false, message: 'A code is required to restore.' };
      if (entityName === 'units' && !UNIT_CODE_PATTERN.test(wanted)) {
        return { success: false, message: 'Code must be one word (letters, digits, dash or underscore).' };
      }
      // Units: trashed units count for uniqueness. Other types: compare with records outside the Trash Bin.
      const clash = list.some(e => e.id !== id && (entityName === 'units' || !e.deletedAt) &&
        String(e[codeField] ?? '').toUpperCase() === wanted.toUpperCase());
      if (clash) {
        return { success: false, codeTaken: true, message: `Code ${wanted} is already used by another record. Enter a new code to restore.` };
      }
      restoredCode = entityName === 'units' ? wanted.toUpperCase() : wanted;
    }

    // Dependency validation on restore
    if (entityName === 'ppeItems') {
      const parentGroup = state.itemGroups.find(g => g.id === item.itemGroupId);
      if (parentGroup && (parentGroup.deletedAt || !parentGroup.active)) {
        return { success: false, message: `Cannot restore item: its Item Group (${parentGroup.name}) is deleted or inactive. Restore the group first.` };
      }
    } else if (entityName === 'itemGroups') {
      const missingAttrs = item.attributeIds.filter((attrId: string) => {
        const attr = state.attributes.find(a => a.id === attrId);
        return !attr || attr.deletedAt;
      });
      if (missingAttrs.length > 0) {
        return { success: false, message: 'Cannot restore Item Group: some assigned attributes are deleted.' };
      }
    }

    const before = { ...item };
    // PPE-055: a restored unit comes back Inactive; Admin turns it on.
    const updated = {
      ...item,
      ...(codeField && restoredCode ? { [codeField]: restoredCode } : {}),
      active: entityName === 'units' ? false : true,
      deletedAt: null
    };

    set((s) => ({
      [entityName]: (s[entityName] as any[]).map(e => e.id === id ? updated : e)
    } as Partial<AppState>));

    get().recordAudit({
      action: 'RESTORE',
      objectType: String(entityName),
      objectReference: (codeField && updated[codeField]) || id,
      before,
      after: updated,
      reason: restoredCode && codeField && restoredCode !== item[codeField]
        ? `Restored from Trash Bin with new code ${restoredCode}`
        : 'Restored from Trash Bin'
    });

    return { success: true };
  },

  // Rule G10: Permanent Purge from Trash
  purgeEntity: (entityName, id) => {
    const state = get();
    // Rule G10: Protect records with transaction history
    let hasHistory = false;
    if (entityName === 'ppeItems') {
      // Serial history is never removed, so an item with serials is retained with it (PPE-059).
      hasHistory = state.itemHasTransactions(id);
    } else if (entityName === 'units') {
      // PPE-055: only unused units can be trashed, but re-check before a permanent delete.
      const usage = state.unitUsage(id);
      hasHistory = usage.itemCount + usage.trashedItemCount > 0;
    } else if (entityName === 'locations') {
      hasHistory = state.stockMovements.some(m => m.locationId === id || m.toLocationId === id) || state.issuances.some(i => i.locationId === id);
    } else if (entityName === 'kits') {
      hasHistory = state.issuances.some(i => i.kitId === id);
    }

    if (hasHistory) {
      return { success: false, message: 'Cannot permanently delete: record is retained indefinitely because it has historical transactions (G10).' };
    }

    const list = state[entityName] as any[];
    const item = list.find(e => e.id === id);
    if (!item) return { success: false, message: 'Entity not found.' };

    set((s) => ({
      [entityName]: (s[entityName] as any[]).filter(e => e.id !== id)
    } as Partial<AppState>));

    get().recordAudit({
      action: 'PERMANENT_PURGE',
      objectType: String(entityName),
      objectReference: item.code || item.itemCode || item.name || id,
      before: item,
      reason: 'Permanently purged from Trash Bin'
    });

    return { success: true };
  },

  purgeEligibleTrash: () => {
    const state = get();
    const retentionDays = state.moduleSettings.trashRetentionDays || 90;
    const now = new Date().getTime();
    let purgedCount = 0;

    const types: (keyof AppState)[] = ['ppeItems', 'locations', 'attributes', 'itemGroups', 'kits', 'units'];
    types.forEach(t => {
      const list = state[t] as any[];
      if (Array.isArray(list)) {
        list.forEach(item => {
          if (item.deletedAt) {
            const ageDays = (now - new Date(item.deletedAt).getTime()) / (1000 * 60 * 60 * 24);
            if (ageDays >= retentionDays) {
              const res = get().purgeEntity(t, item.id);
              if (res.success) purgedCount++;
            }
          }
        });
      }
    });

    return { purgedCount };
  },

  saveOpeningBalance: (ob) => {
    // PPE-057: for a tracked item, quantity equals the serials entered; validate when it leaves Draft.
    const state0 = get();
    const lines = ob.lines.map(l => {
      const item = state0.ppeItems.find(p => p.id === l.ppeItemId);
      return item?.serialTracked ? { ...l, quantity: (l.serialNumbers || []).length } : l;
    });
    ob = { ...ob, lines };
    if (ob.status !== 'Draft') {
      const err = validateOpeningBalanceSerials(state0, ob);
      if (err) return { success: false, message: err };
    }
    set((state) => {
      const idx = state.openingBalances.findIndex(o => o.id === ob.id);
      if (idx >= 0) {
        const newObs = [...state.openingBalances];
        newObs[idx] = ob;
        return { openingBalances: newObs };
      }
      return { openingBalances: [...state.openingBalances, ob] };
    });
    get().recordAudit({
      action: 'SAVE_OPENING_BALANCE',
      objectType: 'OpeningBalance',
      objectReference: ob.id,
      after: ob
    });
    return { success: true };
  },

  approveOpeningBalance: (id, approverId) => {
    const state = get();
    const ob = state.openingBalances.find(o => o.id === id);
    if (!ob || ob.status !== 'Pending Approval') return { success: false, message: 'Opening balance document not found or not pending approval.' };

    const loc = state.locations.find(l => l.id === ob.locationId);
    if (loc?.openingBalanceClosed) {
      return { success: false, message: 'Opening balance is closed for this location. Use a stock adjustment (PPE-024).' };
    }
    if (loc?.stockCondition === 'Scrap' || loc?.locationType === 'Scrap') {
      return { success: false, message: 'Scrap location cannot have opening balance. Scrap stock comes only from returns and Stock OUT (PPE-024).' };
    }

    const ref = ob.reference || `ADJ-OB-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    // PPE-057: register one In Stock unit per serial for tracked lines. All lines or nothing.
    const serialErr = validateOpeningBalanceSerials(state, ob);
    if (serialErr) return { success: false, message: serialErr };
    let serialUnits = state.serialUnits;
    let serialEvents = state.serialEvents;
    for (const line of ob.lines) {
      const item = state.ppeItems.find(p => p.id === line.ppeItemId);
      if (!item?.serialTracked) continue;
      const res = registerSerialUnits(serialUnits, serialEvents, {
        ppeItemId: line.ppeItemId,
        serials: line.serialNumbers || [],
        locationId: ob.locationId,
        batchNumber: line.batchNumber,
        userId: approverId,
        reference: ref,
      }, state.describeSerialLocation);
      if (!res.ok) return { success: false, message: res.errors[0].message };
      serialUnits = res.serialUnits;
      serialEvents = res.serialEvents;
    }

    const newObs = state.openingBalances.map(o =>
      o.id === id ? { ...o, reference: ref, status: 'Approved' as const, approvedBy: approverId, approvedAt: new Date().toISOString() } : o
    );

    // Create batch records
    const newBatches: Batch[] = ob.lines.map(line => ({
      id: generateId(),
      batchNumber: line.batchNumber,
      ppeItemId: line.ppeItemId,
      locationId: ob.locationId,
      quantity: line.quantity,
      availableQty: line.quantity,
      quarantinedQty: 0,
      isQuarantined: false,
      expiryDate: line.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
      costPerUnit: line.costPerUnit,
      status: 'Active' as const,
      openingBalanceId: ob.id,
      createdAt: new Date().toISOString()
    }));

    // Update stock balances
    let newBalances = [...state.stockBalances];
    ob.lines.forEach(line => {
      const balIdx = newBalances.findIndex(b => b.ppeItemId === line.ppeItemId && b.locationId === ob.locationId);
      if (balIdx >= 0) {
        newBalances[balIdx] = { 
          ...newBalances[balIdx], 
          quantityOnHand: newBalances[balIdx].quantityOnHand + line.quantity 
        };
      } else {
        newBalances.push({ 
          id: generateId(), 
          ppeItemId: line.ppeItemId, 
          locationId: ob.locationId, 
          quantityOnHand: line.quantity,
          quarantinedOnHand: 0
        });
      }
    });

    set({ openingBalances: newObs, batches: [...state.batches, ...newBatches], stockBalances: newBalances, serialUnits, serialEvents });

    get().recordAudit({
      action: 'APPROVE_OPENING_BALANCE',
      objectType: 'OpeningBalance',
      objectReference: ref,
      performedBy: approverId
    });

    return { success: true };
  },

  rejectOpeningBalance: (id, reason) => {
    set((state) => ({
      openingBalances: state.openingBalances.map(o => 
        o.id === id ? { ...o, status: 'Rejected' as const, rejectionReason: reason } : o
      )
    }));
    get().recordAudit({
      action: 'REJECT_OPENING_BALANCE',
      objectType: 'OpeningBalance',
      objectReference: id,
      reason
    });
  },

  // Close Opening Balance Lock (PPE-024)
  closeOpeningBalance: (locationId, byId) => {
    const loc = get().locations.find(l => l.id === locationId);
    if (!loc) return;

    set((state) => ({
      locations: state.locations.map(l => l.id === locationId ? { ...l, openingBalanceClosed: true } : l)
    }));

    get().recordAudit({
      action: 'CLOSE_OPENING_BALANCE',
      objectType: 'Location',
      objectReference: locationId,
      performedBy: byId,
      reason: 'Opening balance permanently closed for location'
    });
  },

  // Stock Adjustment (PPE-025, PPE-026)
  adjustStock: (adjustment) => {
    const state = get();
    const loc = state.locations.find(l => l.id === adjustment.locationId);
    if (adjustment.type === 'IN' && (loc?.stockCondition === 'Scrap' || loc?.locationType === 'Scrap')) {
      return { success: false, message: 'Scrap stock comes only from returns and Stock OUT (Rule G6).' };
    }

    const status = adjustment.status || 'applied';
    const isApplied = status === 'applied';
    const adjId = adjustment.id || generateId();

    // PPE-057 / PPE-058: serial-tracked items move by serial, quantity = serial count.
    const trackedItem = state.ppeItems.find(p => p.id === adjustment.ppeItemId);
    let serialUnits = state.serialUnits;
    let serialEvents = state.serialEvents;
    if (trackedItem?.serialTracked) {
      if (isQuarantineReason(adjustment.reasonCategory)) {
        return { success: false, message: 'Quarantine is not available for a serial-tracked item. Use a Stock OUT reason that names what happened to each unit.' };
      }
      if (adjustment.type === 'IN') {
        const serials: string[] = adjustment.serialNumbers || [];
        if (serials.length === 0) return { success: false, message: `${trackedItem.itemCode} is serial tracked: enter one serial number per unit.` };
        const errors = state.validateNewSerials(trackedItem.id, serials);
        if (errors.length > 0) return { success: false, message: errors[0].message };
        adjustment = { ...adjustment, quantityDelta: serials.length };
        if (isApplied) {
          const res = registerSerialUnits(serialUnits, serialEvents, {
            ppeItemId: trackedItem.id, serials, locationId: adjustment.locationId,
            batchNumber: adjustment.batchNumber, userId: adjustment.submittedBy, reference: adjustment.reference,
          }, state.describeSerialLocation);
          if (!res.ok) return { success: false, message: res.errors[0].message };
          serialUnits = res.serialUnits;
          serialEvents = res.serialEvents;
        }
      } else {
        const ids: string[] = adjustment.serialIds || [];
        const res = moveSerialUnits(serialUnits, serialEvents, stockOutMove(adjustment, trackedItem.id, ids), state.describeSerialLocation);
        if (!res.ok) return { success: false, message: res.message };
        adjustment = { ...adjustment, quantityDelta: -ids.length };
        if (isApplied) {
          serialUnits = res.serialUnits;
          serialEvents = res.serialEvents;
        }
      }
    }

    const adjWithId: StockAdjustment = { ...adjustment, status, id: adjId, createdAt: new Date().toISOString() };

    let newBalances = [...state.stockBalances];
    let newBatches = [...state.batches];
    let newMovements = [...state.stockMovements];
    let newScraps = [...state.scrapEntries];

    if (isApplied) {
      if (adjustment.reasonCategory === 'Quarantined') {
        // Rule G9: Quarantine moves available stock to quarantined stock without reducing total On Hand
        const qQty = Math.abs(adjustment.quantityDelta);
        const balIdx = newBalances.findIndex(b => b.ppeItemId === adjustment.ppeItemId && b.locationId === adjustment.locationId);
        if (balIdx >= 0) {
          newBalances[balIdx] = { 
            ...newBalances[balIdx], 
            quarantinedOnHand: (newBalances[balIdx].quarantinedOnHand || 0) + qQty 
          };
        } else {
          newBalances.push({
            id: generateId(),
            ppeItemId: adjustment.ppeItemId,
            locationId: adjustment.locationId,
            quantityOnHand: qQty,
            quarantinedOnHand: qQty
          });
        }

        const batchIdx = newBatches.findIndex(b => b.batchNumber === adjustment.batchNumber && b.ppeItemId === adjustment.ppeItemId && b.locationId === adjustment.locationId);
        if (batchIdx >= 0) {
          const curBatch = newBatches[batchIdx];
          newBatches[batchIdx] = {
            ...curBatch,
            availableQty: Math.max(0, curBatch.availableQty - qQty),
            quarantinedQty: (curBatch.quarantinedQty || 0) + qQty,
            isQuarantined: true,
            quarantineReason: adjustment.reason
          };
        }
      } else {
        // Standard Stock IN / OUT
        const balIdx = newBalances.findIndex(b => b.ppeItemId === adjustment.ppeItemId && b.locationId === adjustment.locationId);
        if (balIdx >= 0) {
          newBalances[balIdx] = { 
            ...newBalances[balIdx], 
            quantityOnHand: Math.max(0, newBalances[balIdx].quantityOnHand + adjustment.quantityDelta) 
          };
        } else if (adjustment.quantityDelta > 0) {
          newBalances.push({ 
            id: generateId(), 
            ppeItemId: adjustment.ppeItemId, 
            locationId: adjustment.locationId, 
            quantityOnHand: adjustment.quantityDelta,
            quarantinedOnHand: 0
          });
        }

        // If Damaged or Written Off routed to a Scrap location (PPE-026)
        if (adjustment.destinationLocationId && adjustment.quantityDelta < 0) {
          const scrapQty = Math.abs(adjustment.quantityDelta);
          const destLocIdx = newBalances.findIndex(b => b.ppeItemId === adjustment.ppeItemId && b.locationId === adjustment.destinationLocationId);
          if (destLocIdx >= 0) {
            newBalances[destLocIdx] = {
              ...newBalances[destLocIdx],
              quantityOnHand: newBalances[destLocIdx].quantityOnHand + scrapQty
            };
          } else {
            newBalances.push({
              id: generateId(),
              ppeItemId: adjustment.ppeItemId,
              locationId: adjustment.destinationLocationId,
              quantityOnHand: scrapQty,
              quarantinedOnHand: 0
            });
          }

          newScraps.push({
            id: generateId(),
            ppeItemId: adjustment.ppeItemId,
            locationId: adjustment.destinationLocationId,
            batchNumber: adjustment.batchNumber,
            quantity: scrapQty,
            reason: `Scrapped via Stock OUT (${adjustment.reasonCategory}): ${adjustment.reason}`,
            relatedReferenceId: adjWithId.reference,
            reversed: false,
            scrappedBy: adjustment.submittedBy,
            createdAt: new Date().toISOString()
          });
        }

        // Batch update
        const batchIdx = newBatches.findIndex(b => b.batchNumber === adjustment.batchNumber && b.ppeItemId === adjustment.ppeItemId && b.locationId === adjustment.locationId);
        if (batchIdx >= 0) {
          const updatedAvail = Math.max(0, newBatches[batchIdx].availableQty + adjustment.quantityDelta);
          newBatches[batchIdx] = { 
            ...newBatches[batchIdx], 
            quantity: newBatches[batchIdx].quantity + (adjustment.quantityDelta > 0 ? adjustment.quantityDelta : 0),
            availableQty: updatedAvail,
            status: updatedAvail <= 0 ? 'Depleted' : 'Active'
          };
        } else if (adjustment.quantityDelta > 0) {
          newBatches.push({
            id: generateId(),
            batchNumber: adjustment.batchNumber,
            ppeItemId: adjustment.ppeItemId,
            locationId: adjustment.locationId,
            quantity: adjustment.quantityDelta,
            availableQty: adjustment.quantityDelta,
            quarantinedQty: 0,
            isQuarantined: false,
            expiryDate: adjustment.manufacturerExpiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
            status: 'Active',
            createdAt: new Date().toISOString()
          });
        }
      }

      newMovements.push({
        id: generateId(),
        type: 'adjustment',
        ppeItemId: adjustment.ppeItemId,
        locationId: adjustment.locationId,
        quantity: adjustment.quantityDelta,
        reason: `${adjustment.reasonCategory}: ${adjustment.reason}`,
        reference: adjustment.reference,
        createdBy: adjustment.submittedBy,
        createdAt: new Date().toISOString()
      });
    }

    set((state) => ({
      stockAdjustments: [adjWithId, ...state.stockAdjustments],
      stockBalances: isApplied ? newBalances : state.stockBalances,
      batches: isApplied ? newBatches : state.batches,
      stockMovements: isApplied ? newMovements : state.stockMovements,
      scrapEntries: isApplied ? newScraps : state.scrapEntries,
      serialUnits,
      serialEvents
    }));

    get().recordAudit({
      action: isApplied ? 'STOCK_ADJUSTMENT_APPLIED' : 'STOCK_ADJUSTMENT_SUBMITTED',
      objectType: 'StockAdjustment',
      objectReference: adjWithId.reference,
      after: adjWithId,
      performedBy: adjustment.submittedBy,
      reason: adjustment.reason
    });

    return { success: true, id: adjId };
  },

  reviewAdjustment: (id, status, reviewerId) => {
    const state = get();
    const adj = state.stockAdjustments.find(a => a.id === id);
    if (!adj) return { success: false, message: 'Adjustment not found.' };
    if (adj.status !== 'pending') return { success: false, message: 'Adjustment is not pending approval.' };

    let newBalances = [...state.stockBalances];
    let newBatches = [...state.batches];
    let newMovements = [...state.stockMovements];
    let serialUnits = state.serialUnits;
    let serialEvents = state.serialEvents;

    // PPE-057 / PPE-058: serials of a Risk Category III adjustment are registered or moved on approval.
    const item = state.ppeItems.find(p => p.id === adj.ppeItemId);
    if (status === 'approved' && item?.serialTracked) {
      if (adj.type === 'IN') {
        const res = registerSerialUnits(serialUnits, serialEvents, {
          ppeItemId: item.id, serials: adj.serialNumbers || [], locationId: adj.locationId,
          batchNumber: adj.batchNumber, userId: reviewerId, reference: adj.reference,
        }, state.describeSerialLocation);
        if (!res.ok) return { success: false, message: res.errors[0].message };
        serialUnits = res.serialUnits;
        serialEvents = res.serialEvents;
      } else {
        const res = moveSerialUnits(serialUnits, serialEvents, { ...stockOutMove(adj, item.id, adj.serialIds || []), userId: reviewerId }, state.describeSerialLocation);
        if (!res.ok) return { success: false, message: res.message };
        serialUnits = res.serialUnits;
        serialEvents = res.serialEvents;
      }
    }

    if (status === 'approved') {
      // Stock OUT routed to a Scrap location lands there on approval, as it does when posted directly.
      if (adj.destinationLocationId && adj.quantityDelta < 0) {
        newBalances = bumpBalance(newBalances, adj.ppeItemId, adj.destinationLocationId, Math.abs(adj.quantityDelta));
      }
      const balIdx = newBalances.findIndex(b => b.ppeItemId === adj.ppeItemId && b.locationId === adj.locationId);
      if (balIdx >= 0) {
        newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: Math.max(0, newBalances[balIdx].quantityOnHand + adj.quantityDelta) };
      } else if (adj.quantityDelta > 0) {
        newBalances.push({ id: generateId(), ppeItemId: adj.ppeItemId, locationId: adj.locationId, quantityOnHand: adj.quantityDelta, quarantinedOnHand: 0 });
      }

      const batchIdx = newBatches.findIndex(b => b.batchNumber === adj.batchNumber && b.ppeItemId === adj.ppeItemId && b.locationId === adj.locationId);
      if (batchIdx >= 0) {
        const updatedAvail = Math.max(0, newBatches[batchIdx].availableQty + adj.quantityDelta);
        newBatches[batchIdx] = { 
          ...newBatches[batchIdx], 
          quantity: newBatches[batchIdx].quantity + (adj.quantityDelta > 0 ? adj.quantityDelta : 0),
          availableQty: updatedAvail,
          status: updatedAvail <= 0 ? 'Depleted' : 'Active'
        };
      } else if (adj.quantityDelta > 0) {
        newBatches.push({
          id: generateId(),
          batchNumber: adj.batchNumber || `B-${Date.now()}`,
          ppeItemId: adj.ppeItemId,
          locationId: adj.locationId,
          quantity: adj.quantityDelta,
          availableQty: adj.quantityDelta,
          quarantinedQty: 0,
          isQuarantined: false,
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
          status: 'Active',
          createdAt: new Date().toISOString()
        });
      }

      newMovements.push({
        id: generateId(),
        type: 'adjustment',
        ppeItemId: adj.ppeItemId,
        locationId: adj.locationId,
        quantity: adj.quantityDelta,
        reason: `Approved: ${adj.reason}`,
        reference: adj.reference,
        approvedBy: reviewerId,
        createdBy: adj.submittedBy,
        createdAt: new Date().toISOString()
      });
    }

    set({
      stockAdjustments: state.stockAdjustments.map(a => a.id === id ? { ...a, status, reviewedBy: reviewerId } : a),
      stockBalances: status === 'approved' ? newBalances : state.stockBalances,
      batches: status === 'approved' ? newBatches : state.batches,
      stockMovements: status === 'approved' ? newMovements : state.stockMovements,
      serialUnits,
      serialEvents
    });

    get().recordAudit({
      action: `STOCK_ADJUSTMENT_${status.toUpperCase()}`,
      objectType: 'StockAdjustment',
      objectReference: adj.reference,
      performedBy: reviewerId
    });
    return { success: true };
  },

  // Stock Transfer with G6 Condition & Capacity Enforcement
  transferStock: (ppeItemId, fromLocationId, toLocationId, batchNumber, quantity, byId, serialIds) => {
    const state = get();
    const fromLoc = state.locations.find(l => l.id === fromLocationId);
    const toLoc = state.locations.find(l => l.id === toLocationId);

    if (!fromLoc || !toLoc) return { success: false, message: 'Invalid source or destination location.' };
    if (fromLocationId === toLocationId) return { success: false, message: 'Source and destination must be different.' };

    // PPE-058: a tracked item transfers picked serials; quantity = serials picked, units stay In Stock.
    const trackedItem = state.ppeItems.find(p => p.id === ppeItemId);
    let serialMove: ReturnType<typeof moveSerialUnits> | null = null;
    const transferRef = `TRF-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    if (trackedItem?.serialTracked) {
      const ids = serialIds || [];
      const picked = state.serialUnits.filter(u => ids.includes(u.id));
      if (picked.some(u => u.batchNumber !== batchNumber)) {
        return { success: false, message: 'All picked serials must belong to the selected batch.' };
      }
      serialMove = moveSerialUnits(state.serialUnits, state.serialEvents, {
        ppeItemId, serialIds: ids,
        expect: { status: 'In Stock', locationId: fromLocationId },
        to: { status: 'In Stock', locationId: toLocationId },
        eventTypes: ['Transfer'], userId: byId, reference: transferRef,
      }, state.describeSerialLocation);
      if (!serialMove.ok) return { success: false, message: serialMove.message };
      quantity = ids.length;
    }

    // Rule G6: Stock Condition Transitions
    if (fromLoc.locationType === 'Scrap' || fromLoc.stockCondition === 'Scrap') {
      return { success: false, message: 'Items in Scrap can never be transferred out (Rule G6).' };
    }
    if (toLoc.locationType === 'Scrap' || toLoc.stockCondition === 'Scrap') {
      return { success: false, message: 'Stock cannot be moved into a Scrap location by transfer. Scrap comes only from returns and Stock OUT (Rule G6).' };
    }
    if ((fromLoc.locationType === 'Used' || fromLoc.stockCondition === 'Used') && toLoc.stockCondition === 'New') {
      return { success: false, message: 'Used items cannot be transferred into a New stock location (Rule G6).' };
    }

    // PPE-027: Item must be linked to destination location
    const item = state.ppeItems.find(p => p.id === ppeItemId);
    if (item && !item.locationIds.includes(toLocationId)) {
      return { success: false, message: `Item ${item.itemCode} is not linked to destination location ${toLoc.name} (PPE-027).` };
    }

    // Capacity Check
    const destTotalOnHand = state.stockBalances
      .filter(b => b.locationId === toLocationId)
      .reduce((sum, b) => sum + b.quantityOnHand, 0);

    if (toLoc.capacityUnits && (destTotalOnHand + quantity > toLoc.capacityUnits)) {
      return { success: false, message: `Transfer exceeds destination capacity (${destTotalOnHand + quantity} / ${toLoc.capacityUnits} units).` };
    }

    const sourceBatch = state.batches.find(b => b.batchNumber === batchNumber && b.ppeItemId === ppeItemId && b.locationId === fromLocationId);
    if (!sourceBatch || sourceBatch.availableQty < quantity) {
      return { success: false, message: `Insufficient batch quantity. Available: ${sourceBatch?.availableQty || 0}.` };
    }

    let newBalances = [...state.stockBalances];
    let newBatches = [...state.batches];
    let newMovements = [...state.stockMovements];

    // Source balance
    const fromIdx = newBalances.findIndex(b => b.ppeItemId === ppeItemId && b.locationId === fromLocationId);
    if (fromIdx >= 0) {
      newBalances[fromIdx] = { ...newBalances[fromIdx], quantityOnHand: Math.max(0, newBalances[fromIdx].quantityOnHand - quantity) };
    }

    // Target balance
    const toIdx = newBalances.findIndex(b => b.ppeItemId === ppeItemId && b.locationId === toLocationId);
    if (toIdx >= 0) {
      newBalances[toIdx] = { ...newBalances[toIdx], quantityOnHand: newBalances[toIdx].quantityOnHand + quantity };
    } else {
      newBalances.push({ id: generateId(), ppeItemId, locationId: toLocationId, quantityOnHand: quantity, quarantinedOnHand: 0 });
    }

    // Source batch update
    const srcBatchIdx = newBatches.findIndex(b => b.id === sourceBatch.id);
    const newSrcAvail = sourceBatch.availableQty - quantity;
    newBatches[srcBatchIdx] = {
      ...sourceBatch,
      availableQty: newSrcAvail,
      quantity: sourceBatch.quantity - quantity,
      status: newSrcAvail <= 0 ? 'Depleted' : 'Active'
    };

    // Target batch update or creation
    const tgtBatchIdx = newBatches.findIndex(b => b.batchNumber === batchNumber && b.ppeItemId === ppeItemId && b.locationId === toLocationId);
    if (tgtBatchIdx >= 0) {
      newBatches[tgtBatchIdx] = {
        ...newBatches[tgtBatchIdx],
        availableQty: newBatches[tgtBatchIdx].availableQty + quantity,
        quantity: newBatches[tgtBatchIdx].quantity + quantity,
        status: 'Active'
      };
    } else {
      newBatches.push({
        ...sourceBatch,
        id: generateId(),
        locationId: toLocationId,
        availableQty: quantity,
        quantity: quantity,
        quarantinedQty: 0,
        isQuarantined: false,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
    }

    const ref = transferRef;
    newMovements.push({
      id: generateId(),
      type: 'transfer',
      ppeItemId,
      locationId: fromLocationId,
      toLocationId,
      quantity,
      reason: `Transfer from ${fromLoc.name} to ${toLoc.name}`,
      reference: ref,
      createdBy: byId,
      createdAt: new Date().toISOString()
    });

    set({
      stockBalances: newBalances,
      batches: newBatches,
      stockMovements: newMovements,
      ...(serialMove && serialMove.ok ? { serialUnits: serialMove.serialUnits, serialEvents: serialMove.serialEvents } : {})
    });

    get().recordAudit({
      action: 'STOCK_TRANSFER',
      objectType: 'Transfer',
      objectReference: ref,
      details: `Transferred ${quantity} units from ${fromLoc.name} to ${toLoc.name}` +
        (serialMove && serialMove.ok ? ` (serials: ${serialMove.moved.map(u => u.serial).join(', ')})` : ''),
      after: serialMove && serialMove.ok ? { serials: serialMove.moved.map(u => u.serial) } : undefined,
      performedBy: byId
    });

    return { success: true };
  },

  // G9 Quarantine Management
  quarantineBatch: (batchId, quantity, reason, byId) => {
    const state = get();
    const batch = state.batches.find(b => b.id === batchId);
    if (!batch || batch.availableQty < quantity) return;
    // Serial units have no Quarantined status, so tracked stock cannot be quarantined.
    if (state.ppeItems.find(p => p.id === batch.ppeItemId)?.serialTracked) return;

    const newAvail = batch.availableQty - quantity;
    const newQuar = (batch.quarantinedQty || 0) + quantity;

    set({
      batches: state.batches.map(b => b.id === batchId ? {
        ...b,
        availableQty: newAvail,
        quarantinedQty: newQuar,
        isQuarantined: true,
        quarantineReason: reason
      } : b),
      stockBalances: state.stockBalances.map(bal => 
        (bal.ppeItemId === batch.ppeItemId && bal.locationId === batch.locationId)
          ? { ...bal, quarantinedOnHand: (bal.quarantinedOnHand || 0) + quantity }
          : bal
      )
    });

    get().recordAudit({
      action: 'BATCH_QUARANTINE',
      objectType: 'Batch',
      objectReference: batch.batchNumber,
      details: `Quarantined ${quantity} units: ${reason}`,
      performedBy: byId,
      reason
    });
  },

  releaseQuarantineBatch: (batchId, quantity, byId) => {
    const state = get();
    const batch = state.batches.find(b => b.id === batchId);
    if (!batch || (batch.quarantinedQty || 0) < quantity) return;

    const newQuar = (batch.quarantinedQty || 0) - quantity;
    const newAvail = batch.availableQty + quantity;

    set({
      batches: state.batches.map(b => b.id === batchId ? {
        ...b,
        availableQty: newAvail,
        quarantinedQty: newQuar,
        isQuarantined: newQuar > 0,
        quarantineReason: newQuar > 0 ? b.quarantineReason : undefined
      } : b),
      stockBalances: state.stockBalances.map(bal => 
        (bal.ppeItemId === batch.ppeItemId && bal.locationId === batch.locationId)
          ? { ...bal, quarantinedOnHand: Math.max(0, (bal.quarantinedOnHand || 0) - quantity) }
          : bal
      )
    });

    get().recordAudit({
      action: 'BATCH_RELEASE_QUARANTINE',
      objectType: 'Batch',
      objectReference: batch.batchNumber,
      details: `Released ${quantity} quarantined units`,
      performedBy: byId
    });
  },

  // Lifespan & Gender Calculations
  calculateLifespanDate: (item, startDate = new Date()) => {
    const val = item.lifespanValue || 1;
    if (item.lifespanType === 'Days') return addDays(startDate, val).toISOString();
    if (item.lifespanType === 'Months') return addMonths(startDate, val).toISOString();
    return addYears(startDate, val).toISOString();
  },

  validateGenderMatch: (employeeId, ppeItemId, variantValueId) => {
    const state = get();
    const emp = state.employees.find(e => e.id === employeeId);
    const item = state.ppeItems.find(p => p.id === ppeItemId);
    if (!emp || !item) return { valid: true };

    const group = state.itemGroups.find(g => g.id === item.itemGroupId);
    if (!group || !group.requiresGenderMatch) return { valid: true };

    // Check item gender or variant gender
    const targetGender = item.gender;
    if (targetGender && targetGender !== 'Unisex' && emp.gender && targetGender !== emp.gender) {
      return { valid: false, reason: `Gender mismatch: Item is for ${targetGender}, employee is ${emp.gender} (Rule G4).` };
    }

    return { valid: true };
  },

  // Single Item Issuance
  issueItem: (issuanceData) => {
    const state = get();
    const id = generateId();
    const item = issuanceData.ppeItemId ? state.ppeItems.find(p => p.id === issuanceData.ppeItemId) : undefined;
    
    // Auto-calculate expected replacement date from lifespan (Rule G5)
    const expectedReplacementDate = item ? get().calculateLifespanDate(item, new Date(issuanceData.issueDate)) : undefined;

    const ref = `ISS-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}-${id.slice(0, 3).toUpperCase()}`;

    // PPE-058: a tracked item is issued by serial; quantity = serials picked, units become Issued.
    let serialMove: ReturnType<typeof moveSerialUnits> | null = null;
    if (item?.serialTracked) {
      const ids = issuanceData.serialIds || [];
      serialMove = moveSerialUnits(state.serialUnits, state.serialEvents, {
        ppeItemId: item.id, serialIds: ids,
        expect: { status: 'In Stock', locationId: issuanceData.locationId },
        to: { status: 'Issued', holderEmployeeId: issuanceData.employeeId, holderName: issuanceData.holderName, holderIssuanceId: id },
        eventTypes: ['Issue'], userId: issuanceData.issuedBy, reference: ref,
      }, state.describeSerialLocation);
      if (!serialMove.ok) return { success: false, id: '', message: serialMove.message };
      issuanceData = { ...issuanceData, quantity: ids.length, serialIds: ids, batchNumber: undefined };
    } else if (issuanceData.serialIds?.length) {
      return { success: false, id: '', message: 'Serial numbers can only be picked for a serial-tracked item.' };
    }

    const newIssuance: Issuance = {
      ...issuanceData,
      id,
      reference: ref,
      expectedReplacementDate,
      status: 'issued'
    };

    // Deduct stock
    let newBalances = [...state.stockBalances];
    let newBatches = serialMove && serialMove.ok
      ? deductSerialBatches(state.batches, serialMove.moved, issuanceData.locationId)
      : [...state.batches];
    let newMovements = [...state.stockMovements];

    if (issuanceData.ppeItemId) {
      const balIdx = newBalances.findIndex(b => b.ppeItemId === issuanceData.ppeItemId && b.locationId === issuanceData.locationId);
      if (balIdx >= 0) {
        newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: Math.max(0, newBalances[balIdx].quantityOnHand - issuanceData.quantity) };
      }

      if (issuanceData.batchNumber) {
        const batchIdx = newBatches.findIndex(b => b.batchNumber === issuanceData.batchNumber && b.ppeItemId === issuanceData.ppeItemId && b.locationId === issuanceData.locationId);
        if (batchIdx >= 0) {
          const updatedAvail = Math.max(0, newBatches[batchIdx].availableQty - issuanceData.quantity);
          newBatches[batchIdx] = {
            ...newBatches[batchIdx],
            availableQty: updatedAvail,
            status: updatedAvail <= 0 ? 'Depleted' : 'Active'
          };
        }
      }

      newMovements.push({
        id: generateId(),
        type: 'out',
        ppeItemId: issuanceData.ppeItemId,
        locationId: issuanceData.locationId,
        quantity: issuanceData.quantity,
        reason: `Issued to ${issuanceData.employeeId ? 'Employee' : 'Visitor'}`,
        reference: ref,
        createdBy: issuanceData.issuedBy,
        createdAt: new Date().toISOString()
      });
    }

    let updatedIssuances = [newIssuance, ...state.issuances];
    if (issuanceData.replacesIssuanceId) {
      updatedIssuances = updatedIssuances.map(i => 
        i.id === issuanceData.replacesIssuanceId ? { ...i, status: 'replaced' as const } : i
      );
      get().recordAudit({
        action: 'REPLACE_ISSUANCE',
        objectType: 'Issuance',
        objectReference: issuanceData.replacesIssuanceId,
        details: `Replaced by new issuance ${ref}`,
        performedBy: issuanceData.issuedBy
      });
    }

    set({
      issuances: updatedIssuances,
      stockBalances: newBalances,
      batches: newBatches,
      stockMovements: newMovements,
      ...(serialMove && serialMove.ok ? { serialUnits: serialMove.serialUnits, serialEvents: serialMove.serialEvents } : {})
    });

    get().recordAudit({
      action: 'ISSUE_PPE',
      objectType: 'Issuance',
      objectReference: ref,
      after: serialMove && serialMove.ok ? { ...newIssuance, serials: serialMove.moved.map(u => u.serial) } : newIssuance,
      performedBy: issuanceData.issuedBy
    });

    return { success: true, id };
  },

  // Kit Issuance with Rule G7 (single signature pair) and G8 (partial issuance)
  issueKit: ({ employeeId, kitId, locationId, quantity, itemVariants = {}, selectedItemIds, itemSerials = {}, storeKeeperSignature, receiverSignature, issuedBy }) => {
    const state = get();
    const kit = state.kits.find(k => k.id === kitId);
    if (!kit) return { success: false, issuanceIds: [], message: 'Kit not found.' };

    const itemsToIssue = kit.items.filter(ki => !selectedItemIds || selectedItemIds.includes(ki.ppeItemId));
    const issuanceIds: string[] = [];

    // PPE-058: each unit of a tracked kit line needs its own serial. Check every line before issuing any.
    for (const ki of itemsToIssue) {
      const ppeItem = state.ppeItems.find(p => p.id === ki.ppeItemId);
      if (!ppeItem?.serialTracked) continue;
      const reqQty = ki.qty * quantity;
      const inStock = state.inStockSerials(ppeItem.id, locationId).length;
      const expected = Math.min(reqQty, inStock);
      const picked = itemSerials[ki.ppeItemId] || [];
      if (expected > 0 && picked.length !== expected) {
        return { success: false, issuanceIds: [], message: `${ppeItem.itemCode}: pick ${expected} serial number(s), one per unit (${picked.length} picked).` };
      }
      for (const sid of picked) {
        const u = state.serialUnits.find(s => s.id === sid);
        if (!u || u.ppeItemId !== ppeItem.id || u.status !== 'In Stock' || u.locationId !== locationId) {
          return { success: false, issuanceIds: [], message: `${u?.serial || sid} is not In Stock at this location${u ? ` (${state.describeSerialLocation(u)})` : ''}.` };
        }
      }
    }

    for (const ki of itemsToIssue) {
      const ppeItem = state.ppeItems.find(p => p.id === ki.ppeItemId);
      if (!ppeItem) continue;

      const reqQty = ki.qty * quantity;
      const bal = get().stockBalances.find(b => b.ppeItemId === ki.ppeItemId && b.locationId === locationId);
      const availQty = bal ? Math.max(0, bal.quantityOnHand - (bal.quarantinedOnHand || 0)) : 0;

      // Rule G8: Partial issuance when stock is limited
      const issueQty = ppeItem.serialTracked ? (itemSerials[ki.ppeItemId] || []).length : Math.min(reqQty, availQty);
      if (issueQty <= 0) continue; // Skip out-of-stock items without blocking others

      // Find FIFO batch
      const batch = state.batches
        .filter(b => b.ppeItemId === ki.ppeItemId && b.locationId === locationId && b.availableQty > 0 && b.status === 'Active')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

      const res = get().issueItem({
        employeeId,
        kitId,
        ppeItemId: ki.ppeItemId,
        locationId,
        quantity: issueQty,
        batchNumber: batch?.batchNumber,
        variantKey: itemVariants[ki.ppeItemId] || ki.variantKey,
        issueDate: new Date().toISOString(),
        serialIds: ppeItem.serialTracked ? itemSerials[ki.ppeItemId] : undefined,
        storeKeeperSignature,
        receiverSignature,
        issuedBy
      });

      if (res.success) issuanceIds.push(res.id);
    }

    return { success: issuanceIds.length > 0, issuanceIds, message: issuanceIds.length === 0 ? 'Nothing was issued: no line had stock.' : undefined };
  },

  // Multi-line Loan Issuance (PPE-036, PPE-041)
  issueLoan: ({ holderName, holderType, companyName, contactNumber, hostEmployeeId, locationId, expectedReturnDate, items, storeKeeperSignature, receiverSignature, issuedBy }) => {
    const state = get();
    const loanId = generateId();
    const ref = `LN-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    // PPE-058: tracked lines loan picked serials (On Loan to the borrower). All lines or nothing.
    let serialUnits = state.serialUnits;
    let serialEvents = state.serialEvents;
    const movedByLine: SerialUnit[][] = [];
    items = items.map(it => ({ ...it })); // never mutate the caller's lines
    for (const it of items) {
      const item = state.ppeItems.find(p => p.id === it.ppeItemId);
      if (!item?.serialTracked) { movedByLine.push([]); continue; }
      const res = moveSerialUnits(serialUnits, serialEvents, {
        ppeItemId: item.id, serialIds: it.serialIds || [],
        expect: { status: 'In Stock', locationId },
        to: { status: 'On Loan', holderName: companyName ? `${holderName} (${companyName})` : holderName, holderIssuanceId: loanId },
        eventTypes: ['Loan'], userId: issuedBy, reference: ref,
      }, state.describeSerialLocation);
      if (!res.ok) return { success: false, reference: '', message: `${item.itemCode}: ${res.message}` };
      serialUnits = res.serialUnits;
      serialEvents = res.serialEvents;
      movedByLine.push(res.moved);
      it.quantity = (it.serialIds || []).length;
    }

    const lineItems: LoanLineItem[] = items.map((it, i) => ({
      id: generateId(),
      ppeItemId: it.ppeItemId,
      quantity: it.quantity,
      returnedQty: 0,
      status: 'open' as const,
      ...(movedByLine[i].length ? { serialIds: movedByLine[i].map(u => u.id), returnedSerialIds: [] } : {})
    }));

    const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);

    let newBalances = [...state.stockBalances];
    let newBatches = [...state.batches];
    let newMovements = [...state.stockMovements];

    for (const it of items) {
      // Deduct from stock balances
      const balIdx = newBalances.findIndex(b => b.ppeItemId === it.ppeItemId && b.locationId === locationId);
      if (balIdx >= 0) {
        newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: Math.max(0, newBalances[balIdx].quantityOnHand - it.quantity) };
      }

      // Tracked line: deduct the batch of each picked serial
      const lineIdx = items.indexOf(it);
      if (movedByLine[lineIdx].length > 0) {
        newBatches = deductSerialBatches(newBatches, movedByLine[lineIdx], locationId);
      }

      // Deduct from FIFO batch
      let batchToDeduct = movedByLine[lineIdx].length > 0 ? undefined : it.batchNumber;
      if (!batchToDeduct && movedByLine[lineIdx].length === 0) {
        const foundBatch = newBatches.find(b => b.ppeItemId === it.ppeItemId && b.locationId === locationId && b.availableQty >= it.quantity && b.status === 'Active');
        batchToDeduct = foundBatch?.batchNumber;
      }
      if (batchToDeduct) {
        const batchIdx = newBatches.findIndex(b => b.batchNumber === batchToDeduct && b.ppeItemId === it.ppeItemId && b.locationId === locationId);
        if (batchIdx >= 0) {
          const updatedAvail = Math.max(0, newBatches[batchIdx].availableQty - it.quantity);
          newBatches[batchIdx] = {
            ...newBatches[batchIdx],
            availableQty: updatedAvail,
            status: updatedAvail <= 0 ? 'Depleted' : 'Active'
          };
        }
      }

      newMovements.push({
        id: generateId(),
        type: 'out',
        ppeItemId: it.ppeItemId,
        locationId,
        quantity: it.quantity,
        reason: `Temporary custody loan to ${holderName} (${companyName || holderType})`,
        reference: ref,
        createdBy: issuedBy,
        createdAt: new Date().toISOString()
      });
    }

    const newLoanIssuance: Issuance = {
      id: loanId,
      reference: ref,
      holderName,
      holderType,
      companyName,
      contactNumber,
      hostEmployeeId,
      locationId,
      quantity: totalQty,
      ppeItemId: items[0]?.ppeItemId,
      batchNumber: items[0]?.batchNumber,
      issueDate: new Date().toISOString(),
      expectedReturnDate,
      storeKeeperSignature,
      receiverSignature,
      status: 'issued',
      isLoan: true,
      issuedBy,
      lines: lineItems
    };

    set({
      issuances: [newLoanIssuance, ...state.issuances],
      stockBalances: newBalances,
      batches: newBatches,
      stockMovements: newMovements,
      serialUnits,
      serialEvents
    });

    get().recordAudit({
      action: 'ISSUE_LOAN',
      objectType: 'Issuance',
      objectReference: ref,
      details: `Issued temporary custody loan to ${holderName} (${companyName || holderType}) with ${items.length} line items`,
      performedBy: issuedBy
    });

    return { success: true, reference: ref, id: loanId };
  },

  // Multi-line Loan Return (PPE-037, Rule G6, PPE-038)
  returnLoan: ({ loanId, returnedLines, storeKeeperSignature, receiverSignature, returnedBy }) => {
    const state = get();
    const loan = state.issuances.find(i => i.id === loanId);
    if (!loan || loan.status === 'returned') {
      return { success: false, message: 'Loan not found or already closed.' };
    }

    let updatedLines = loan.lines ? [...loan.lines] : [];
    let newBalances = [...state.stockBalances];
    let newScraps = [...state.scrapEntries];
    let newMovements = [...state.stockMovements];
    let newReturns = [...state.issuanceReturns];

    const usedLoc = state.locations.find(l => l.locationType === 'Used' || l.stockCondition === 'Used') || state.locations[0];
    const scrapLoc = state.locations.find(l => l.locationType === 'Scrap' || l.stockCondition === 'Scrap') || state.locations[0];

    // PPE-058: tracked lines return the exact serials the borrower holds. Validate all before changing anything.
    let serialUnits = state.serialUnits;
    let serialEvents = state.serialEvents;
    const returnedSerialsByLine = new Map<string, string[]>();
    returnedLines = returnedLines.map(r => ({ ...r }));
    for (const ret of returnedLines) {
      const line = updatedLines.find(l => l.id === ret.lineId);
      const item = line && state.ppeItems.find(p => p.id === line.ppeItemId);
      if (!line || !item?.serialTracked) continue;
      const ids = ret.serialIds || [];
      if (ids.length === 0) return { success: false, message: `${item.itemCode}: pick or scan the returned serial numbers.` };
      for (const sid of ids) {
        const u = serialUnits.find(s => s.id === sid);
        if (!u) return { success: false, message: `Serial ${sid} does not exist.` };
        if (!line.serialIds?.includes(sid) || line.returnedSerialIds?.includes(sid)) {
          return { success: false, message: `${u.serial} is not held by this borrower. ${state.describeSerialLocation(u)}.` };
        }
      }
      const target = serialReturnTarget(ret.condition, usedLoc.id, scrapLoc.id);
      const res = moveSerialUnits(serialUnits, serialEvents, {
        ppeItemId: item.id, serialIds: ids,
        expect: { status: 'On Loan', holderIssuanceId: loanId },
        to: target.to, eventTypes: ['Loan return', ...target.extraEvents],
        userId: returnedBy, reference: loan.reference || loan.id, note: `Condition: ${ret.condition}`,
      }, state.describeSerialLocation);
      if (!res.ok) return { success: false, message: res.message };
      serialUnits = res.serialUnits;
      serialEvents = res.serialEvents;
      ret.quantity = ids.length;
      returnedSerialsByLine.set(line.id, ids);
    }

    for (const ret of returnedLines) {
      const lineIdx = updatedLines.findIndex(l => l.id === ret.lineId);
      if (lineIdx === -1) continue;

      const currentLine = updatedLines[lineIdx];
      const prevReturned = currentLine.returnedQty || 0;
      const newReturned = prevReturned + ret.quantity;
      const isLineClosed = newReturned >= currentLine.quantity;

      updatedLines[lineIdx] = {
        ...currentLine,
        returnedQty: newReturned,
        condition: ret.condition,
        status: isLineClosed ? 'returned' : 'open',
        ...(returnedSerialsByLine.has(currentLine.id)
          ? { returnedSerialIds: [...(currentLine.returnedSerialIds || []), ...returnedSerialsByLine.get(currentLine.id)!] }
          : {})
      };

      const ppeItemId = currentLine.ppeItemId;

      // Condition routing (Rule G6)
      if (ret.condition === 'good' && ppeItemId) {
        // Routes to Used location
        const balIdx = newBalances.findIndex(b => b.ppeItemId === ppeItemId && b.locationId === usedLoc.id);
        if (balIdx >= 0) {
          newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: newBalances[balIdx].quantityOnHand + ret.quantity };
        } else {
          newBalances.push({ id: generateId(), ppeItemId, locationId: usedLoc.id, quantityOnHand: ret.quantity, quarantinedOnHand: 0 });
        }

        newMovements.push({
          id: generateId(),
          type: 'in',
          ppeItemId,
          locationId: usedLoc.id,
          quantity: ret.quantity,
          reason: `Loan line returned (Good -> Used) [${loan.reference || loan.id}]`,
          reference: loan.reference || loan.id,
          createdBy: returnedBy,
          createdAt: new Date().toISOString()
        });
      } else if ((ret.condition === 'damaged' || ret.condition === 'worn_out') && ppeItemId) {
        // Auto-scraps to Scrap location (Rule G6 & PPE-038)
        const newScrapId = generateId();
        newScraps.push({
          id: newScrapId,
          ppeItemId,
          locationId: scrapLoc.id,
          quantity: ret.quantity,
          reason: `Auto-scrapped from loan return (Condition: ${ret.condition}) [${loan.reference || loan.id}]`,
          relatedReferenceId: loan.id,
          reversed: false,
          scrappedBy: returnedBy,
          createdAt: new Date().toISOString()
        });

        const balIdx = newBalances.findIndex(b => b.ppeItemId === ppeItemId && b.locationId === scrapLoc.id);
        if (balIdx >= 0) {
          newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: newBalances[balIdx].quantityOnHand + ret.quantity };
        } else {
          newBalances.push({ id: generateId(), ppeItemId, locationId: scrapLoc.id, quantityOnHand: ret.quantity, quarantinedOnHand: 0 });
        }

        newMovements.push({
          id: generateId(),
          type: 'in',
          ppeItemId,
          locationId: scrapLoc.id,
          quantity: ret.quantity,
          reason: `Loan line returned (Damaged -> Scrap) [${loan.reference || loan.id}]`,
          reference: loan.reference || loan.id,
          createdBy: returnedBy,
          createdAt: new Date().toISOString()
        });
      }
      // If lost: closed with no inventory restored

      newReturns.push({
        id: generateId(),
        issuanceId: loan.id,
        lineId: ret.lineId,
        condition: ret.condition,
        physicalReceiptConfirmed: ret.condition !== 'lost',
        autoScrapped: ret.condition === 'damaged' || ret.condition === 'worn_out',
        returnedBy,
        returnDate: new Date().toISOString()
      });
    }

    const allLinesClosed = updatedLines.length > 0 && updatedLines.every(l => l.status === 'returned' || (l.returnedQty || 0) >= l.quantity);

    set({
      issuances: state.issuances.map(i => i.id === loanId ? {
        ...i,
        lines: updatedLines,
        status: allLinesClosed ? 'returned' as const : 'issued' as const
      } : i),
      stockBalances: newBalances,
      scrapEntries: newScraps,
      stockMovements: newMovements,
      issuanceReturns: newReturns,
      serialUnits,
      serialEvents
    });

    get().recordAudit({
      action: 'RETURN_LOAN',
      objectType: 'Issuance',
      objectReference: loan.reference || loan.id,
      details: `Loan items returned (${returnedLines.length} line(s)). Status: ${allLinesClosed ? 'Closed' : 'Partially Returned'}`,
      performedBy: returnedBy
    });

    return { success: true };
  },

  returnLoanLine: (issuanceId, lineId, condition, returnedBy) => {
    const state = get();
    const issuance = state.issuances.find(i => i.id === issuanceId);
    if (!issuance) return;

    if (issuance.lines && issuance.lines.length > 0) {
      const line = issuance.lines.find(l => l.id === lineId);
      const remainingQty = line ? Math.max(1, line.quantity - (line.returnedQty || 0)) : 1;
      // Whole-line return: a tracked line returns every serial still out on it.
      const outstanding = line?.serialIds?.filter(s => !line.returnedSerialIds?.includes(s));
      get().returnLoan({
        loanId: issuanceId,
        returnedLines: [{ lineId, quantity: remainingQty, condition, serialIds: outstanding }],
        returnedBy
      });
    } else {
      get().returnItem(issuanceId, condition, condition !== 'lost', returnedBy);
    }
  },

  // PPE Returns (PPE-038) with Condition Routing (G6)
  returnItem: (issuanceId, condition, physicalReceiptConfirmed, returnedBy, options) => {
    const state = get();
    const issuance = state.issuances.find(i => i.id === issuanceId);
    if (!issuance || issuance.status === 'returned') return { success: false, message: 'Issuance not found or already returned.' };

    let returnQty = (options?.quantity && options.quantity > 0) ? Math.min(options.quantity, issuance.quantity) : issuance.quantity;
    const isDamagedOrWornOut = condition === 'damaged' || condition === 'worn_out';
    const autoScrapped = isDamagedOrWornOut && physicalReceiptConfirmed;

    // PPE-058: a tracked item returns the exact serials the employee holds on this issuance.
    const item = state.ppeItems.find(p => p.id === issuance.ppeItemId);
    let serialMove: ReturnType<typeof moveSerialUnits> | null = null;
    if (item?.serialTracked && issuance.serialIds?.length) {
      const ids = options?.serialIds || [];
      if (ids.length === 0) return { success: false, message: 'Pick or scan the returned serial numbers.' };
      for (const sid of ids) {
        const u = state.serialUnits.find(s => s.id === sid);
        if (!u) return { success: false, message: `Serial ${sid} does not exist.` };
        if (!issuance.serialIds.includes(sid) || issuance.returnedSerialIds?.includes(sid) || u.holderIssuanceId !== issuanceId) {
          return { success: false, message: `${u.serial} is not held by this employee on this issuance. ${state.describeSerialLocation(u)}.` };
        }
      }
      const usedLocId = (state.locations.find(l => l.locationType === 'Used' || l.stockCondition === 'Used') || state.locations[0]).id;
      const scrapLocId = (state.locations.find(l => isScrapLocation(l)) || state.locations[0]).id;
      const target = serialReturnTarget(condition, usedLocId, scrapLocId, physicalReceiptConfirmed);
      serialMove = moveSerialUnits(state.serialUnits, state.serialEvents, {
        ppeItemId: item.id, serialIds: ids,
        expect: { status: 'Issued', holderIssuanceId: issuanceId },
        to: target.to, eventTypes: ['Return', ...target.extraEvents],
        userId: returnedBy, reference: issuance.reference || issuance.id, note: `Condition: ${condition}`,
      }, state.describeSerialLocation);
      if (!serialMove.ok) return { success: false, message: serialMove.message };
      returnQty = ids.length;
    }

    const newReturn: IssuanceReturn = {
      id: generateId(),
      issuanceId,
      quantity: returnQty,
      condition,
      physicalReceiptConfirmed,
      autoScrapped,
      storeKeeperSignature: options?.storeKeeperSignature,
      employeeSignature: options?.employeeSignature,
      returnedBy,
      returnDate: new Date().toISOString()
    };

    let newBalances = [...state.stockBalances];
    let newScraps = [...state.scrapEntries];

    // G6: Good condition routes to Used location
    if (condition === 'good' && issuance.ppeItemId) {
      const usedLoc = state.locations.find(l => l.locationType === 'Used' || l.stockCondition === 'Used') || state.locations[0];
      const balIdx = newBalances.findIndex(b => b.ppeItemId === issuance.ppeItemId && b.locationId === usedLoc.id);
      if (balIdx >= 0) {
        newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: newBalances[balIdx].quantityOnHand + returnQty };
      } else {
        newBalances.push({ id: generateId(), ppeItemId: issuance.ppeItemId, locationId: usedLoc.id, quantityOnHand: returnQty, quarantinedOnHand: 0 });
      }
    } else if (autoScrapped && issuance.ppeItemId) {
      // G6: Damaged or Worn Out routes to Scrap location
      const scrapLoc = state.locations.find(l => l.locationType === 'Scrap' || l.stockCondition === 'Scrap') || state.locations[0];
      const newScrapId = generateId();
      newScraps.push({
        id: newScrapId,
        ppeItemId: issuance.ppeItemId,
        locationId: scrapLoc.id,
        batchNumber: issuance.batchNumber,
        quantity: returnQty,
        reason: `Auto-scrapped from return (Condition: ${condition})`,
        relatedReferenceId: issuance.id,
        reversed: false,
        scrappedBy: returnedBy,
        createdAt: new Date().toISOString()
      });

      const balIdx = newBalances.findIndex(b => b.ppeItemId === issuance.ppeItemId && b.locationId === scrapLoc.id);
      if (balIdx >= 0) {
        newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: newBalances[balIdx].quantityOnHand + returnQty };
      } else {
        newBalances.push({ id: generateId(), ppeItemId: issuance.ppeItemId, locationId: scrapLoc.id, quantityOnHand: returnQty, quarantinedOnHand: 0 });
      }
    }

    const remainingQty = issuance.quantity - returnQty;
    const isFullyReturned = remainingQty <= 0;

    set({
      issuances: state.issuances.map(i => i.id === issuanceId ? {
        ...i,
        quantity: remainingQty > 0 ? remainingQty : i.quantity,
        status: isFullyReturned ? ('returned' as const) : ('partially_returned' as const),
        ...(serialMove && serialMove.ok
          ? { returnedSerialIds: [...(i.returnedSerialIds || []), ...serialMove.moved.map(u => u.id)] }
          : {})
      } : i),
      issuanceReturns: [newReturn, ...state.issuanceReturns],
      stockBalances: newBalances,
      scrapEntries: newScraps,
      ...(serialMove && serialMove.ok ? { serialUnits: serialMove.serialUnits, serialEvents: serialMove.serialEvents } : {})
    });

    get().recordAudit({
      action: 'RETURN_PPE',
      objectType: 'Issuance',
      objectReference: issuance.reference || issuance.id,
      details: `Returned ${returnQty} unit(s) with condition ${condition}. ${isFullyReturned ? 'Fully returned.' : `Remaining: ${remainingQty}`}` +
        (serialMove && serialMove.ok ? ` Serials: ${serialMove.moved.map(u => `${u.serial} -> ${u.status}`).join(', ')}` : ''),
      performedBy: returnedBy
    });
    return { success: true };
  },

  // Scrap Reversal (PPE-039)
  reverseScrap: (id, reason, reversedBy) => {
    const state = get();
    const scrap = state.scrapEntries.find(s => s.id === id);
    if (!scrap || scrap.reversed) return;

    const usedLoc = state.locations.find(l => l.locationType === 'Used' || l.stockCondition === 'Used') || state.locations[0];
    let newBalances = [...state.stockBalances];

    // Deduct from scrap location
    const scrapBalIdx = newBalances.findIndex(b => b.ppeItemId === scrap.ppeItemId && b.locationId === scrap.locationId);
    if (scrapBalIdx >= 0) {
      newBalances[scrapBalIdx] = { ...newBalances[scrapBalIdx], quantityOnHand: Math.max(0, newBalances[scrapBalIdx].quantityOnHand - scrap.quantity) };
    }

    // Add back to Used location
    const usedBalIdx = newBalances.findIndex(b => b.ppeItemId === scrap.ppeItemId && b.locationId === usedLoc.id);
    if (usedBalIdx >= 0) {
      newBalances[usedBalIdx] = { ...newBalances[usedBalIdx], quantityOnHand: newBalances[usedBalIdx].quantityOnHand + scrap.quantity };
    } else {
      newBalances.push({ id: generateId(), ppeItemId: scrap.ppeItemId, locationId: usedLoc.id, quantityOnHand: scrap.quantity, quarantinedOnHand: 0 });
    }

    set({
      scrapEntries: state.scrapEntries.map(s => s.id === id ? {
        ...s,
        reversed: true,
        reversalReason: reason,
        reversedBy,
        reversedAt: new Date().toISOString()
      } : s),
      stockBalances: newBalances
    });

    get().recordAudit({
      action: 'REVERSE_SCRAP',
      objectType: 'ScrapEntry',
      objectReference: id,
      details: `Reversed scrap entry: ${reason}`,
      performedBy: reversedBy,
      reason
    });
  },

  // Employee Lifecycle (G12)
  setEmployeeStatus: (employeeId, status, byId) => {
    const state = get();
    const emp = state.employees.find(e => e.id === employeeId);
    if (!emp) return;

    set({
      employees: state.employees.map(e => e.id === employeeId ? {
        ...e,
        status,
        active: status === 'Active'
      } : e)
    });

    get().recordAudit({
      action: `EMPLOYEE_LIFECYCLE_${status.toUpperCase()}`,
      objectType: 'Employee',
      objectReference: emp.employeeCode,
      details: `Status set to ${status}`,
      performedBy: byId
    });
  },

  // Historical Import (PPE-044) - Zero Stock Deduction
  importHistoricalIssuances: (imported, byId) => {
    const newIssuances: Issuance[] = imported.map(item => ({
      id: generateId(),
      reference: item.reference || `HIST-${Date.now().toString().slice(-6)}`,
      employeeId: item.employeeId,
      ppeItemId: item.ppeItemId,
      locationId: item.locationId || get().locations[0]?.id || 'loc-1',
      quantity: item.quantity || 1,
      batchNumber: item.batchNumber || 'HISTORICAL',
      issueDate: item.issueDate || new Date().toISOString(),
      expectedReplacementDate: item.expectedReplacementDate,
      status: item.status || 'issued',
      isHistorical: true,
      issuedBy: byId
    }));

    set((state) => ({
      issuances: [...newIssuances, ...state.issuances]
    }));

    get().recordAudit({
      action: 'HISTORICAL_IMPORT',
      objectType: 'Issuance',
      objectReference: `Batch of ${newIssuances.length}`,
      details: `Imported ${newIssuances.length} historical issuance records with zero stock deduction`,
      performedBy: byId
    });

    return { count: newIssuances.length };
  },

  // Module Settings (PPE-050)
  updateModuleSettings: (settings) => {
    set((state) => {
      const merged = { ...state.moduleSettings, ...settings };
      return { moduleSettings: merged, expirySettings: merged };
    });
    get().recordAudit({
      action: 'UPDATE_MODULE_SETTINGS',
      objectType: 'Settings',
      objectReference: 'GLOBAL',
      after: settings
    });
  },

  updateExpirySettings: (settings) => {
    get().updateModuleSettings(settings);
  }
}));

export const useStore = usePPEStore;
