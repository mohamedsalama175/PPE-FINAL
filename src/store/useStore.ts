import { create } from 'zustand';
import { generateId } from '../lib/utils';
import * as mockData from './mockData';
import { 
  JobPosition, Location, Attribute, ItemGroup, PPEItem, Kit, Employee, 
  StockBalance, StockMovement, StockAdjustment, Issuance, IssuanceReturn, 
  ScrapEntry, ModuleSettings, BaseEntity, OpeningBalance, Batch, AuditLog, LoanLineItem
} from '../types';
import { addDays, addMonths, addYears } from 'date-fns';

export interface InUseCheckResult {
  inUse: boolean;
  reasons: string[];
}

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
  saveEntity: <T extends BaseEntity>(entityName: keyof AppState, entity: T, reason?: string) => void;
  softDeleteEntity: (entityName: keyof AppState, id: string, overrideReason?: string) => { success: boolean; message?: string };
  toggleEntityActive: (entityName: keyof AppState, id: string, active: boolean, overrideReason?: string) => { success: boolean; message?: string };
  restoreEntity: (entityName: keyof AppState, id: string) => { success: boolean; message?: string };
  purgeEntity: (entityName: keyof AppState, id: string) => { success: boolean; message?: string };
  purgeEligibleTrash: () => { purgedCount: number };

  // Stock & Opening Balance
  saveOpeningBalance: (ob: OpeningBalance) => void;
  approveOpeningBalance: (id: string, approverId: string) => { success: boolean; message?: string };
  rejectOpeningBalance: (id: string, reason: string) => void;
  closeOpeningBalance: (locationId: string, byId: string) => void;

  // Stock Adjustments & Movements
  adjustStock: (adjustment: any) => { success: boolean; message?: string; id?: string };
  reviewAdjustment: (id: string, status: 'approved' | 'rejected', reviewerId: string) => void;
  transferStock: (ppeItemId: string, fromLocationId: string, toLocationId: string, batchNumber: string, quantity: number, byId: string) => { success: boolean; message?: string };
  
  // G9 Quarantine Management
  quarantineBatch: (batchId: string, quantity: number, reason: string, byId: string) => void;
  releaseQuarantineBatch: (batchId: string, quantity: number, byId: string) => void;

  // Issuances & Kits
  calculateLifespanDate: (item: PPEItem, startDate?: Date) => string;
  validateGenderMatch: (employeeId: string, ppeItemId: string, variantValueId?: string) => { valid: boolean; reason?: string };
  issueItem: (issuance: Omit<Issuance, 'id' | 'status'>) => { success: boolean; id: string };
  issueKit: (data: {
    employeeId: string;
    kitId: string;
    locationId: string;
    quantity: number;
    itemVariants?: Record<string, string>;
    selectedItemIds?: string[];
    storeKeeperSignature?: string;
    receiverSignature?: string;
    issuedBy: string;
  }) => { success: boolean; issuanceIds: string[] };

  // Loans (PPE-036, PPE-037, PPE-041)
  issueLoan: (data: {
    holderName: string;
    holderType: string;
    companyName?: string;
    contactNumber?: string;
    hostEmployeeId?: string;
    locationId: string;
    expectedReturnDate: string;
    items: { ppeItemId: string; quantity: number; batchNumber?: string }[];
    storeKeeperSignature?: string;
    receiverSignature?: string;
    issuedBy: string;
  }) => { success: boolean; reference: string; id?: string };
  returnLoan: (data: {
    loanId: string;
    returnedLines: { lineId: string; quantity: number; condition: 'good' | 'damaged' | 'worn_out' | 'lost' }[];
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
    }
  ) => void;
  reverseScrap: (id: string, reason: string, reversedBy: string) => void;

  // Employee Lifecycle & Tracking (PPE-042, PPE-043, G12)
  setEmployeeStatus: (employeeId: string, status: 'Active' | 'Terminated' | 'Transferred' | 'Inactive', byId: string) => void;

  // Historical Import (PPE-044)
  importHistoricalIssuances: (imported: Partial<Issuance>[], byId: string) => { count: number };

  // Module Settings (PPE-050)
  updateModuleSettings: (settings: Partial<ModuleSettings>) => void;
  updateExpirySettings: (settings: ModuleSettings) => void;
}

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
    return hasIssuances || hasAdjustments || hasMovements || hasBatches;
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
    const entityToSave = { ...entity, id: entity.id || generateId() };

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
      objectReference: entityToSave.id,
      before,
      after: entityToSave,
      reason
    });
  },

  softDeleteEntity: (entityName, id, overrideReason) => {
    const state = get();
    const currentUser = state.currentUser;

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
        if (!overrideReason || overrideReason.trim().length < 5) {
          return { success: false, message: `Admin override requires a valid justification reason (at least 5 characters). In-use reasons: ${inUseCheck.reasons.join(' ')}` };
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
        if (!overrideReason || overrideReason.trim().length < 5) {
          return { success: false, message: `Admin override requires a written reason. ${inUseCheck.reasons.join(' ')}` };
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

  restoreEntity: (entityName, id) => {
    const state = get();
    const list = state[entityName] as any[];
    const item = list.find(e => e.id === id);
    if (!item) return { success: false, message: 'Entity not found.' };

    // Dependency validation on restore
    if (entityName === 'ppeItems') {
      const parentGroup = state.itemGroups.find(g => g.id === item.itemGroupId);
      if (parentGroup && (parentGroup.deletedAt || !parentGroup.active)) {
        return { success: false, message: `Cannot restore item: its Item Group (${parentGroup.nameEn}) is deleted or inactive. Restore the group first.` };
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
    const updated = { ...item, active: true, deletedAt: null };

    set((s) => ({
      [entityName]: (s[entityName] as any[]).map(e => e.id === id ? updated : e)
    } as Partial<AppState>));

    get().recordAudit({
      action: 'RESTORE',
      objectType: String(entityName),
      objectReference: id,
      before,
      after: updated,
      reason: 'Restored from Trash Bin'
    });

    return { success: true };
  },

  // Rule G10: Permanent Purge from Trash
  purgeEntity: (entityName, id) => {
    const state = get();
    // Rule G10: Protect records with transaction history
    let hasHistory = false;
    if (entityName === 'ppeItems') {
      hasHistory = state.issuances.some(i => i.ppeItemId === id) || state.stockMovements.some(m => m.ppeItemId === id);
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
      objectReference: id,
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

    const types: (keyof AppState)[] = ['ppeItems', 'locations', 'attributes', 'itemGroups', 'kits'];
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

    set({ openingBalances: newObs, batches: [...state.batches, ...newBatches], stockBalances: newBalances });

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
      scrapEntries: isApplied ? newScraps : state.scrapEntries
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
    if (!adj) return;

    let newBalances = [...state.stockBalances];
    let newBatches = [...state.batches];
    let newMovements = [...state.stockMovements];

    if (status === 'approved') {
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
      stockMovements: status === 'approved' ? newMovements : state.stockMovements
    });

    get().recordAudit({
      action: `STOCK_ADJUSTMENT_${status.toUpperCase()}`,
      objectType: 'StockAdjustment',
      objectReference: adj.reference,
      performedBy: reviewerId
    });
  },

  // Stock Transfer with G6 Condition & Capacity Enforcement
  transferStock: (ppeItemId, fromLocationId, toLocationId, batchNumber, quantity, byId) => {
    const state = get();
    const fromLoc = state.locations.find(l => l.id === fromLocationId);
    const toLoc = state.locations.find(l => l.id === toLocationId);

    if (!fromLoc || !toLoc) return { success: false, message: 'Invalid source or destination location.' };

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
      return { success: false, message: `Item ${item.itemCode} is not linked to destination location ${toLoc.nameEn} (PPE-027).` };
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

    const ref = `TRF-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    newMovements.push({
      id: generateId(),
      type: 'transfer',
      ppeItemId,
      locationId: fromLocationId,
      toLocationId,
      quantity,
      reason: `Transfer from ${fromLoc.nameEn} to ${toLoc.nameEn}`,
      reference: ref,
      createdBy: byId,
      createdAt: new Date().toISOString()
    });

    set({ stockBalances: newBalances, batches: newBatches, stockMovements: newMovements });

    get().recordAudit({
      action: 'STOCK_TRANSFER',
      objectType: 'Transfer',
      objectReference: ref,
      details: `Transferred ${quantity} units from ${fromLoc.nameEn} to ${toLoc.nameEn}`,
      performedBy: byId
    });

    return { success: true };
  },

  // G9 Quarantine Management
  quarantineBatch: (batchId, quantity, reason, byId) => {
    const state = get();
    const batch = state.batches.find(b => b.id === batchId);
    if (!batch || batch.availableQty < quantity) return;

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

    const ref = `ISS-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const newIssuance: Issuance = {
      ...issuanceData,
      id,
      reference: ref,
      expectedReplacementDate,
      status: 'issued'
    };

    // Deduct stock
    let newBalances = [...state.stockBalances];
    let newBatches = [...state.batches];
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
      stockMovements: newMovements
    });

    get().recordAudit({
      action: 'ISSUE_PPE',
      objectType: 'Issuance',
      objectReference: ref,
      after: newIssuance,
      performedBy: issuanceData.issuedBy
    });

    return { success: true, id };
  },

  // Kit Issuance with Rule G7 (single signature pair) and G8 (partial issuance)
  issueKit: ({ employeeId, kitId, locationId, quantity, itemVariants = {}, selectedItemIds, storeKeeperSignature, receiverSignature, issuedBy }) => {
    const state = get();
    const kit = state.kits.find(k => k.id === kitId);
    if (!kit) return { success: false, issuanceIds: [] };

    const itemsToIssue = kit.items.filter(ki => !selectedItemIds || selectedItemIds.includes(ki.ppeItemId));
    const issuanceIds: string[] = [];

    itemsToIssue.forEach(ki => {
      const ppeItem = state.ppeItems.find(p => p.id === ki.ppeItemId);
      if (!ppeItem) return;

      const reqQty = ki.qty * quantity;
      const bal = state.stockBalances.find(b => b.ppeItemId === ki.ppeItemId && b.locationId === locationId);
      const availQty = bal ? Math.max(0, bal.quantityOnHand - (bal.quarantinedOnHand || 0)) : 0;
      
      // Rule G8: Partial issuance when stock is limited
      const issueQty = Math.min(reqQty, availQty);
      if (issueQty <= 0) return; // Skip out-of-stock items without blocking others

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
        storeKeeperSignature,
        receiverSignature,
        issuedBy
      });

      if (res.success) issuanceIds.push(res.id);
    });

    return { success: issuanceIds.length > 0, issuanceIds };
  },

  // Multi-line Loan Issuance (PPE-036, PPE-041)
  issueLoan: ({ holderName, holderType, companyName, contactNumber, hostEmployeeId, locationId, expectedReturnDate, items, storeKeeperSignature, receiverSignature, issuedBy }) => {
    const state = get();
    const loanId = generateId();
    const ref = `LN-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const lineItems: LoanLineItem[] = items.map(it => ({
      id: generateId(),
      ppeItemId: it.ppeItemId,
      quantity: it.quantity,
      returnedQty: 0,
      status: 'open' as const
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

      // Deduct from FIFO batch
      let batchToDeduct = it.batchNumber;
      if (!batchToDeduct) {
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
      stockMovements: newMovements
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
        status: isLineClosed ? 'returned' : 'open'
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
      issuanceReturns: newReturns
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
      get().returnLoan({
        loanId: issuanceId,
        returnedLines: [{ lineId, quantity: remainingQty, condition }],
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
    if (!issuance || issuance.status === 'returned') return;

    const returnQty = (options?.quantity && options.quantity > 0) ? Math.min(options.quantity, issuance.quantity) : issuance.quantity;
    const isDamagedOrWornOut = condition === 'damaged' || condition === 'worn_out';
    const autoScrapped = isDamagedOrWornOut && physicalReceiptConfirmed;

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
        status: isFullyReturned ? ('returned' as const) : ('partially_returned' as const)
      } : i),
      issuanceReturns: [newReturn, ...state.issuanceReturns],
      stockBalances: newBalances,
      scrapEntries: newScraps
    });

    get().recordAudit({
      action: 'RETURN_PPE',
      objectType: 'Issuance',
      objectReference: issuance.reference || issuance.id,
      details: `Returned ${returnQty} unit(s) with condition ${condition}. ${isFullyReturned ? 'Fully returned.' : `Remaining: ${remainingQty}`}`,
      performedBy: returnedBy
    });
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
