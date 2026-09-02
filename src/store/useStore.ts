import { create } from 'zustand';
import { generateId } from '../lib/utils';
import * as mockData from './mockData';
import { 
  JobPosition, Location, Attribute, ItemGroup, PPEItem, Kit, Employee, 
  Batch, StockBalance, StockMovement, StockAdjustment, Issuance, IssuanceReturn, 
  VisitorLoan, ScrapEntry, OpeningBalance, AuditLog, TrashItem, InAppNotification, 
  ModuleSettings, Role, BaseEntity
} from '../types';

export interface AppState {
  // Current user & RBAC
  currentUser: Employee;
  setCurrentUser: (user: Employee) => void;
  selectedStoreKeeperPersonaId: string;
  setSelectedStoreKeeperPersonaId: (id: string) => void;
  
  // External service status
  isEmployeeMasterOnline: boolean;
  toggleEmployeeMasterStatus: () => void;
  cachedEmployees: Employee[];

  // Master Data
  jobPositions: JobPosition[];
  locations: Location[];
  attributes: Attribute[];
  itemGroups: ItemGroup[];
  ppeItems: PPEItem[];
  kits: Kit[];
  employees: Employee[];

  // Inventory & Stock
  batches: Batch[];
  stockMovements: StockMovement[];
  stockAdjustments: StockAdjustment[];
  openingBalances: OpeningBalance[];
  scrapEntries: ScrapEntry[];

  // Operations
  issuances: Issuance[];
  issuanceReturns: IssuanceReturn[];
  visitorLoans: VisitorLoan[];

  // System Foundation
  auditLogs: AuditLog[];
  trashItems: TrashItem[];
  notifications: InAppNotification[];
  settings: ModuleSettings;

  // Actions
  writeAuditLog: (log: Omit<AuditLog, 'id' | 'timestampUTC' | 'retentionFlag'>) => void;
  addNotification: (notif: Omit<InAppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  runNightlyCronJobs: () => { reminderCount: number; overdueLoanCount: number; autoPurgedCount: number };

  // Master Data CRUD with in-use checks & Audit Log
  savePPEItem: (item: PPEItem, reason?: string) => void;
  trashPPEItem: (id: string, reason: string) => void;
  saveAttribute: (attribute: Attribute, reason?: string) => void;
  trashAttribute: (id: string, reason: string) => void;
  saveItemGroup: (group: ItemGroup, reason?: string) => void;
  trashItemGroup: (id: string, reason: string) => void;
  saveLocation: (location: Location, reason?: string) => void;
  trashLocation: (id: string, reason: string) => void;
  saveKit: (kit: Kit, reason?: string) => void;
  trashKit: (id: string, reason: string) => void;
  restoreTrashItem: (trashId: string, newCode?: string) => { success: boolean; error?: string };

  // Stock Management (OB, IN, OUT, Quarantine, Transfers)
  postOpeningBalance: (locationId: string, lines: { ppeItemId: string; variantKey?: string; batchNumber: string; expiryDate?: string; quantity: number; costPerUnit?: number }[]) => void;
  closeOpeningBalanceForLocation: (locationId: string) => void;
  recordStockIn: (params: {
    locationId: string;
    ppeItemId: string;
    variantKey?: string;
    batchNumber: string;
    quantity: number;
    manufacturerExpiryDate?: string;
    supplierDeliveryNote?: string;
    reasonCategory: string;
    reasonDetail: string;
  }) => { requiresApproval: boolean; reference: string };
  recordStockOut: (params: {
    locationId: string;
    ppeItemId: string;
    variantKey?: string;
    batchNumber: string;
    quantity: number;
    reasonCategory: string;
    reasonDetail: string;
    quarantineReason?: string;
  }) => { requiresApproval: boolean; reference: string };
  releaseQuarantine: (batchId: string, releaseReason: string) => void;
  reviewAdjustment: (adjustmentId: string, action: 'approved' | 'rejected', reviewerId: string) => { success: boolean; error?: string };
  transferStock: (params: {
    ppeItemId: string;
    fromLocationId: string;
    toLocationId: string;
    batchNumber: string;
    quantity: number;
  }) => { success: boolean; error?: string; overcapacityWarning?: boolean };

  // Issuance, Returns, Loans
  issueSinglePPE: (issuanceData: Omit<Issuance, 'id' | 'reference' | 'status' | 'createdAt'>) => string;
  issueKitPPE: (params: {
    employeeId: string;
    kitId: string;
    locationId: string;
    lines: { ppeItemId: string; variantKey: string; quantity: number }[];
    storeKeeperSignature: string;
    receiverSignature: string;
  }) => { issuedCount: number; skippedCount: number };
  returnPPE: (params: {
    issuanceId: string;
    quantity: number;
    condition: 'good' | 'damaged' | 'worn_out' | 'lost';
    physicalReceiptConfirmed: boolean;
    storeKeeperSignature?: string;
    receiverSignature?: string;
  }) => { success: boolean; error?: string };
  issueVisitorLoan: (loanData: Omit<VisitorLoan, 'id' | 'loanNumber' | 'status' | 'createdAt'>) => string;
  returnLoanLine: (params: {
    loanId: string;
    lineId: string;
    returnedQuantity: number;
    condition: 'good' | 'damaged' | 'lost';
    storeKeeperSignature: string;
    recipientSignature: string;
  }) => { success: boolean; error?: string };

  // Settings & Access Matrix
  updateSettings: (newSettings: Partial<ModuleSettings>, reason: string) => void;
  updateStoreKeeperAssignments: (storeKeeperId: string, locationIds: string[]) => void;
  importHistoricalIssuances: (rows: Array<{
    employeeId: string;
    itemCode: string;
    variantKey?: string;
    quantity: number;
    issueDate: string;
    locationId?: string;
  }>) => { importedCount: number; batchId: string };
  reverseScrap: (scrapId: string, reason: string) => void;
}

export const usePPEStore = create<AppState>((set, get) => ({
  currentUser: mockData.mockEmployees[0], // Default Admin
  setCurrentUser: (user) => set({ currentUser: user }),
  selectedStoreKeeperPersonaId: 'emp-8', // Sam by default
  setSelectedStoreKeeperPersonaId: (id) => {
    const found = get().employees.find(e => e.id === id);
    if (found) {
      set({ selectedStoreKeeperPersonaId: id, currentUser: found });
    }
  },

  isEmployeeMasterOnline: true,
  toggleEmployeeMasterStatus: () => set(state => ({
    isEmployeeMasterOnline: !state.isEmployeeMasterOnline,
    cachedEmployees: state.employees
  })),
  cachedEmployees: mockData.mockEmployees,

  jobPositions: mockData.mockJobPositions,
  locations: mockData.mockLocations,
  attributes: mockData.mockAttributes,
  itemGroups: mockData.mockItemGroups,
  ppeItems: mockData.mockPPEItems,
  kits: mockData.mockKits,
  employees: mockData.mockEmployees,

  batches: mockData.mockBatches,
  stockMovements: [],
  stockAdjustments: mockData.mockStockAdjustments,
  openingBalances: [],
  scrapEntries: [],

  issuances: mockData.mockIssuances,
  issuanceReturns: mockData.mockIssuanceReturns,
  visitorLoans: mockData.mockVisitorLoans,

  auditLogs: mockData.mockAuditLogs,
  trashItems: mockData.mockTrashItems,
  notifications: mockData.mockNotifications,
  settings: mockData.mockModuleSettings,

  writeAuditLog: (log) => {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestampUTC: new Date().toISOString(),
      retentionFlag: '7_YEARS',
      ...log
    };
    set(state => ({ auditLogs: [entry, ...state.auditLogs] }));
  },

  addNotification: (notif) => {
    const item: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif
    };
    set(state => ({ notifications: [item, ...state.notifications] }));
  },

  markNotificationRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  runNightlyCronJobs: () => {
    const state = get();
    const today = new Date();
    let reminderCount = 0;
    let overdueLoanCount = 0;
    let autoPurgedCount = 0;

    // 1. Replacement Reminders (BD-I473 & NEW-07)
    state.issuances.forEach(iss => {
      if (iss.status !== 'issued' || !iss.expectedReplacementDate) return;
      const emp = state.employees.find(e => e.id === iss.employeeId);
      if (!emp || emp.status === 'Terminated' || emp.status === 'Transferred') return;

      const loc = state.locations.find(l => l.id === iss.locationId);
      const site = loc ? loc.site : 'Cairo Site';
      const leadTimeDays = state.settings.reminderLeadTimePerSite[site] || 14;

      const replDate = new Date(iss.expectedReplacementDate);
      const diffDays = Math.ceil((replDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

      if (diffDays <= leadTimeDays && diffDays >= 0) {
        reminderCount++;
        const ppe = state.ppeItems.find(p => p.id === iss.ppeItemId);
        const itemName = ppe ? ppe.nameEn : 'PPE Item';

        // Notify
        state.addNotification({
          type: 'replacement_reminder',
          title: `Replacement Reminder: ${emp.name}`,
          message: `${itemName} is due for replacement on ${iss.expectedReplacementDate} (${diffDays} days remaining).`,
          severity: 'warning',
          linkTo: '/issuances/replacements-due'
        });

        // If employee has no email, log partial failure (BD-I473)
        if (!emp.email || emp.email.trim() === '') {
          state.writeAuditLog({
            user: 'SYSTEM_CRON',
            role: 'Admin',
            objectType: 'Issuance',
            objectReference: iss.reference,
            action: 'REMINDER_EMAIL_FAILED_NO_ADDRESS',
            beforeValues: null,
            afterValues: { employeeId: emp.id, employeeName: emp.name },
            reason: `Email dispatch failed: Employee ${emp.name} has no email address configured in Employee Master.`,
            source: 'System Job'
          });
        }
      }
    });

    // 2. Overdue Loans (BD-I470 & NEW-08)
    const updatedLoans = state.visitorLoans.map(loan => {
      if (loan.status === 'Open' || loan.status === 'Partially Returned') {
        const retDate = new Date(loan.expectedReturnDate);
        if (retDate < today) {
          overdueLoanCount++;
          state.addNotification({
            type: 'overdue_loan',
            title: `Overdue Loan: ${loan.loanNumber}`,
            message: `Loan to ${loan.recipientName} (${loan.recipientCompany}) passed expected return date (${loan.expectedReturnDate}).`,
            severity: 'critical',
            linkTo: '/issuances/open-loans'
          });
          return { ...loan, status: 'Overdue' as const };
        }
      }
      return loan;
    });

    // 3. Trash Bin 90-day countdown & Auto-Purge (NEW-04)
    const updatedTrash: TrashItem[] = [];
    state.trashItems.forEach(tItem => {
      if (tItem.hasHistory) {
        // Records with history are never auto-purged
        updatedTrash.push(tItem);
      } else {
        const newDaysInTrash = tItem.daysInTrash + 1;
        const daysLeft = state.settings.trashRetentionDays - newDaysInTrash;

        if (daysLeft <= 0) {
          // Auto-purge eligible record without history
          autoPurgedCount++;
          state.writeAuditLog({
            user: 'SYSTEM_CRON',
            role: 'Admin',
            objectType: tItem.entityType,
            objectReference: tItem.code,
            action: 'AUTO_PURGED',
            beforeValues: tItem.data,
            afterValues: null,
            reason: `Auto-purged after exceeding ${state.settings.trashRetentionDays} days in Trash Bin with no historical transactions.`,
            source: 'System Job'
          });
        } else {
          if (daysLeft === 7) {
            // 7-day advance Admin warning
            state.addNotification({
              type: 'trash_purge_warning',
              title: `Trash Auto-Purge in 7 Days: ${tItem.code}`,
              message: `${tItem.entityType} "${tItem.nameEn}" has no historical transactions and will be auto-purged in 7 days.`,
              severity: 'warning',
              linkTo: '/trash'
            });
          }
          updatedTrash.push({ ...tItem, daysInTrash: newDaysInTrash });
        }
      }
    });

    set({ visitorLoans: updatedLoans, trashItems: updatedTrash });
    return { reminderCount, overdueLoanCount, autoPurgedCount };
  },

  savePPEItem: (item, reason) => {
    const state = get();
    const existing = state.ppeItems.find(p => p.id === item.id);
    const user = state.currentUser;

    if (existing) {
      set({
        ppeItems: state.ppeItems.map(p => p.id === item.id ? item : p)
      });
      state.writeAuditLog({
        user: user.name,
        role: user.role,
        objectType: 'Item',
        objectReference: item.itemCode,
        action: existing.active !== item.active ? (item.active ? 'ACTIVATED' : 'DEACTIVATED') : 'EDITED',
        beforeValues: existing,
        afterValues: item,
        reason: reason || 'Item details updated',
        source: 'Screen'
      });
    } else {
      const newItem = { ...item, id: item.id || `ppe-${Date.now()}` };
      set({ ppeItems: [...state.ppeItems, newItem] });
      state.writeAuditLog({
        user: user.name,
        role: user.role,
        objectType: 'Item',
        objectReference: item.itemCode,
        action: 'CREATED',
        beforeValues: null,
        afterValues: newItem,
        reason: reason || 'New catalog item added',
        source: 'Screen'
      });
    }
  },

  trashPPEItem: (id, reason) => {
    const state = get();
    const item = state.ppeItems.find(p => p.id === id);
    if (!item) return;

    // Check if item has transactions
    const hasHistory = state.issuances.some(i => i.ppeItemId === id) ||
                       state.batches.some(b => b.ppeItemId === id) ||
                       state.visitorLoans.some(l => l.items.some(li => li.ppeItemId === id));

    const trashEntry: TrashItem = {
      id: `trash-${Date.now()}`,
      entityType: 'Item',
      originalId: item.id,
      code: item.itemCode,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      deletedBy: state.currentUser.name,
      deletedAt: new Date().toISOString(),
      reason,
      hasHistory,
      daysInTrash: 0,
      data: item
    };

    set({
      ppeItems: state.ppeItems.filter(p => p.id !== id),
      trashItems: [trashEntry, ...state.trashItems]
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Item',
      objectReference: item.itemCode,
      action: 'TRASHED',
      beforeValues: item,
      afterValues: { trashed: true, hasHistory },
      reason,
      source: 'Screen'
    });
  },

  saveAttribute: (attribute, reason) => {
    const state = get();
    const existing = state.attributes.find(a => a.id === attribute.id);
    const user = state.currentUser;

    if (existing) {
      set({
        attributes: state.attributes.map(a => a.id === attribute.id ? attribute : a)
      });
      state.writeAuditLog({
        user: user.name,
        role: user.role,
        objectType: 'Attribute',
        objectReference: attribute.code,
        action: 'EDITED',
        beforeValues: existing,
        afterValues: attribute,
        reason: reason || 'Attribute updated',
        source: 'Screen'
      });
    } else {
      const newAttr = { ...attribute, id: attribute.id || `attr-${Date.now()}` };
      set({ attributes: [...state.attributes, newAttr] });
      state.writeAuditLog({
        user: user.name,
        role: user.role,
        objectType: 'Attribute',
        objectReference: attribute.code,
        action: 'CREATED',
        beforeValues: null,
        afterValues: newAttr,
        reason: reason || 'New attribute created',
        source: 'Screen'
      });
    }
  },

  trashAttribute: (id, reason) => {
    const state = get();
    const attr = state.attributes.find(a => a.id === id);
    if (!attr) return;

    // Check if attribute is linked to item groups or past issuances
    const isLinkedToGroup = state.itemGroups.some(g => g.assignedAttributeIds.includes(id));
    const hasHistory = isLinkedToGroup || state.issuances.some(i => i.variantKey && i.variantKey.includes(attr.code));

    const trashEntry: TrashItem = {
      id: `trash-${Date.now()}`,
      entityType: 'Attribute',
      originalId: attr.id,
      code: attr.code,
      nameEn: attr.nameEn,
      nameAr: attr.nameAr,
      deletedBy: state.currentUser.name,
      deletedAt: new Date().toISOString(),
      reason,
      hasHistory,
      daysInTrash: 0,
      data: attr
    };

    // Unlink from active item groups while preserving past issuance data
    const updatedGroups = state.itemGroups.map(g => ({
      ...g,
      assignedAttributeIds: g.assignedAttributeIds.filter(aId => aId !== id)
    }));

    set({
      attributes: state.attributes.filter(a => a.id !== id),
      itemGroups: updatedGroups,
      trashItems: [trashEntry, ...state.trashItems]
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Attribute',
      objectReference: attr.code,
      action: 'TRASHED',
      beforeValues: attr,
      afterValues: { trashed: true, unlinkedFromGroups: isLinkedToGroup },
      reason,
      source: 'Screen'
    });
  },

  saveItemGroup: (group, reason) => {
    const state = get();
    const existing = state.itemGroups.find(g => g.id === group.id);
    const user = state.currentUser;

    if (existing) {
      set({
        itemGroups: state.itemGroups.map(g => g.id === group.id ? group : g)
      });
      state.writeAuditLog({
        user: user.name,
        role: user.role,
        objectType: 'ItemGroup',
        objectReference: group.code,
        action: 'EDITED',
        beforeValues: existing,
        afterValues: group,
        reason: reason || 'Item group updated',
        source: 'Screen'
      });
    } else {
      const newGrp = { ...group, id: group.id || `grp-${Date.now()}` };
      set({ itemGroups: [...state.itemGroups, newGrp] });
      state.writeAuditLog({
        user: user.name,
        role: user.role,
        objectType: 'ItemGroup',
        objectReference: group.code,
        action: 'CREATED',
        beforeValues: null,
        afterValues: newGrp,
        reason: reason || 'New item group created',
        source: 'Screen'
      });
    }
  },

  trashItemGroup: (id, reason) => {
    const state = get();
    const grp = state.itemGroups.find(g => g.id === id);
    if (!grp) return;

    const hasHistory = state.ppeItems.some(p => p.itemGroupId === id);

    const trashEntry: TrashItem = {
      id: `trash-${Date.now()}`,
      entityType: 'ItemGroup',
      originalId: grp.id,
      code: grp.code,
      nameEn: grp.nameEn,
      nameAr: grp.nameAr,
      deletedBy: state.currentUser.name,
      deletedAt: new Date().toISOString(),
      reason,
      hasHistory,
      daysInTrash: 0,
      data: grp
    };

    set({
      itemGroups: state.itemGroups.filter(g => g.id !== id),
      trashItems: [trashEntry, ...state.trashItems]
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'ItemGroup',
      objectReference: grp.code,
      action: 'TRASHED',
      beforeValues: grp,
      afterValues: { trashed: true, hasHistory },
      reason,
      source: 'Screen'
    });
  },

  saveLocation: (location, reason) => {
    const state = get();
    const existing = state.locations.find(l => l.id === location.id);
    const user = state.currentUser;

    if (existing) {
      set({
        locations: state.locations.map(l => l.id === location.id ? location : l)
      });
      state.writeAuditLog({
        user: user.name,
        role: user.role,
        objectType: 'Location',
        objectReference: location.code,
        action: 'EDITED',
        beforeValues: existing,
        afterValues: location,
        reason: reason || 'Location modified',
        source: 'Screen'
      });
    } else {
      const newLoc = { ...location, id: location.id || `loc-${Date.now()}` };
      set({ locations: [...state.locations, newLoc] });
      state.writeAuditLog({
        user: user.name,
        role: user.role,
        objectType: 'Location',
        objectReference: location.code,
        action: 'CREATED',
        beforeValues: null,
        afterValues: newLoc,
        reason: reason || 'New location created',
        source: 'Screen'
      });
    }
  },

  trashLocation: (id, reason) => {
    const state = get();
    const loc = state.locations.find(l => l.id === id);
    if (!loc) return;

    const hasHistory = state.batches.some(b => b.locationId === id) ||
                       state.issuances.some(i => i.locationId === id) ||
                       state.visitorLoans.some(v => v.fromLocationId === id);

    const trashEntry: TrashItem = {
      id: `trash-${Date.now()}`,
      entityType: 'Location',
      originalId: loc.id,
      code: loc.code,
      nameEn: loc.nameEn,
      nameAr: loc.nameAr,
      deletedBy: state.currentUser.name,
      deletedAt: new Date().toISOString(),
      reason,
      hasHistory,
      daysInTrash: 0,
      data: loc
    };

    set({
      locations: state.locations.filter(l => l.id !== id),
      trashItems: [trashEntry, ...state.trashItems]
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Location',
      objectReference: loc.code,
      action: 'TRASHED',
      beforeValues: loc,
      afterValues: { trashed: true, hasHistory },
      reason,
      source: 'Screen'
    });
  },

  saveKit: (kit, reason) => {
    const state = get();
    const existing = state.kits.find(k => k.id === kit.id);
    const user = state.currentUser;

    if (existing) {
      set({
        kits: state.kits.map(k => k.id === kit.id ? kit : k)
      });
      state.writeAuditLog({
        user: user.name,
        role: user.role,
        objectType: 'Kit',
        objectReference: kit.nameEn,
        action: 'EDITED',
        beforeValues: existing,
        afterValues: kit,
        reason: reason || 'Job kit updated',
        source: 'Screen'
      });
    } else {
      const newKit = { ...kit, id: kit.id || `kit-${Date.now()}` };
      set({ kits: [...state.kits, newKit] });
      state.writeAuditLog({
        user: user.name,
        role: user.role,
        objectType: 'Kit',
        objectReference: kit.nameEn,
        action: 'CREATED',
        beforeValues: null,
        afterValues: newKit,
        reason: reason || 'New job kit created',
        source: 'Screen'
      });
    }
  },

  trashKit: (id, reason) => {
    const state = get();
    const kit = state.kits.find(k => k.id === id);
    if (!kit) return;

    const hasHistory = state.issuances.some(i => i.kitId === id);

    const trashEntry: TrashItem = {
      id: `trash-${Date.now()}`,
      entityType: 'Kit',
      originalId: kit.id,
      code: kit.nameEn,
      nameEn: kit.nameEn,
      nameAr: kit.nameAr,
      deletedBy: state.currentUser.name,
      deletedAt: new Date().toISOString(),
      reason,
      hasHistory,
      daysInTrash: 0,
      data: kit
    };

    set({
      kits: state.kits.filter(k => k.id !== id),
      trashItems: [trashEntry, ...state.trashItems]
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Kit',
      objectReference: kit.nameEn,
      action: 'TRASHED',
      beforeValues: kit,
      afterValues: { trashed: true, hasHistory },
      reason,
      source: 'Screen'
    });
  },

  restoreTrashItem: (trashId, newCode) => {
    const state = get();
    const item = state.trashItems.find(t => t.id === trashId);
    if (!item) return { success: false, error: 'Trash item not found.' };

    const effectiveCode = newCode || item.code;

    // 1. Parent Checks
    if (item.entityType === 'Item') {
      const ppeData = item.data as PPEItem;
      const groupInTrash = state.trashItems.some(t => t.entityType === 'ItemGroup' && t.originalId === ppeData.itemGroupId);
      if (groupInTrash) {
        return { success: false, error: 'Restore the parent Item Group first.' };
      }
      // Duplicate Code Check
      if (state.ppeItems.some(p => p.itemCode.toLowerCase() === effectiveCode.toLowerCase())) {
        return { success: false, error: `Item Code "${effectiveCode}" is already in use by an active item. Provide a new unique code.` };
      }
      const restored = { ...ppeData, itemCode: effectiveCode, active: true };
      set({
        ppeItems: [...state.ppeItems, restored],
        trashItems: state.trashItems.filter(t => t.id !== trashId)
      });
    } else if (item.entityType === 'Attribute') {
      if (state.attributes.some(a => a.code.toLowerCase() === effectiveCode.toLowerCase())) {
        return { success: false, error: `Attribute Code "${effectiveCode}" is already in use. Provide a new code.` };
      }
      const restored = { ...(item.data as Attribute), code: effectiveCode, active: true };
      set({
        attributes: [...state.attributes, restored],
        trashItems: state.trashItems.filter(t => t.id !== trashId)
      });
    } else if (item.entityType === 'ItemGroup') {
      const grpData = item.data as ItemGroup;
      // Check if any assigned attribute is in trash
      const hasAttrInTrash = grpData.assignedAttributeIds.some(aId => state.trashItems.some(t => t.entityType === 'Attribute' && t.originalId === aId));
      if (hasAttrInTrash) {
        return { success: false, error: 'Restore the assigned Attributes first.' };
      }
      if (state.itemGroups.some(g => g.code.toLowerCase() === effectiveCode.toLowerCase())) {
        return { success: false, error: `Item Group Code "${effectiveCode}" is already in use. Provide a new code.` };
      }
      const restored = { ...grpData, code: effectiveCode, active: true };
      set({
        itemGroups: [...state.itemGroups, restored],
        trashItems: state.trashItems.filter(t => t.id !== trashId)
      });
    } else if (item.entityType === 'Location') {
      if (state.locations.some(l => l.code.toLowerCase() === effectiveCode.toLowerCase())) {
        return { success: false, error: `Location Code "${effectiveCode}" is already in use. Provide a new code.` };
      }
      const restored = { ...(item.data as Location), code: effectiveCode, active: true };
      set({
        locations: [...state.locations, restored],
        trashItems: state.trashItems.filter(t => t.id !== trashId)
      });
    } else if (item.entityType === 'Kit') {
      const kitData = item.data as Kit;
      const jobPos = state.jobPositions.find(j => j.id === kitData.jobPositionId);
      if (!jobPos || !jobPos.active) {
        return { success: false, error: 'Restore or assign a valid Job Position first.' };
      }
      if (state.kits.some(k => k.nameEn.toLowerCase() === effectiveCode.toLowerCase())) {
        return { success: false, error: `Kit Name "${effectiveCode}" is already taken. Provide a new name.` };
      }
      const restored = { ...kitData, nameEn: effectiveCode, active: true };
      set({
        kits: [...state.kits, restored],
        trashItems: state.trashItems.filter(t => t.id !== trashId)
      });
    }

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: item.entityType,
      objectReference: effectiveCode,
      action: 'RESTORED',
      beforeValues: { trashed: true },
      afterValues: { code: effectiveCode, active: true },
      reason: newCode ? `Restored from trash with remapped code "${effectiveCode}"` : 'Restored from trash',
      source: 'Screen'
    });

    return { success: true };
  },

  postOpeningBalance: (locationId, lines) => {
    const state = get();
    const loc = state.locations.find(l => l.id === locationId);
    if (!loc) return;

    const refNumber = `ADJ-OB-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBatches: Batch[] = lines.map(line => ({
      id: `bat-ob-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      batchNumber: line.batchNumber,
      ppeItemId: line.ppeItemId,
      locationId,
      variantKey: line.variantKey,
      quantity: line.quantity,
      availableQty: line.quantity,
      quarantinedQty: 0,
      condition: loc.stockCondition === 'Used' ? 'Reused' : 'New',
      expiryDate: line.expiryDate,
      costPerUnit: line.costPerUnit,
      status: 'Active',
      createdAt: new Date().toISOString()
    }));

    // Mark location as having held stock
    const updatedLocations = state.locations.map(l => l.id === locationId ? { ...l, hasHeldStock: true } : l);

    set({
      batches: [...state.batches, ...newBatches],
      locations: updatedLocations
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Stock',
      objectReference: refNumber,
      action: 'OPENING_BALANCE_POSTED',
      beforeValues: null,
      afterValues: { locationId, linesCount: lines.length, totalQuantity: lines.reduce((acc, l) => acc + l.quantity, 0) },
      reason: `Opening balance posted for location ${loc.nameEn}`,
      source: 'Screen'
    });
  },

  closeOpeningBalanceForLocation: (locationId) => {
    const state = get();
    const loc = state.locations.find(l => l.id === locationId);
    if (!loc) return;

    set({
      locations: state.locations.map(l => l.id === locationId ? { ...l, openingBalanceStatus: 'Closed' } : l)
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Location',
      objectReference: loc.code,
      action: 'OPENING_BALANCE_CLOSED',
      beforeValues: { openingBalanceStatus: loc.openingBalanceStatus },
      afterValues: { openingBalanceStatus: 'Closed' },
      reason: `Opening balance permanently locked for location ${loc.nameEn}`,
      source: 'Screen'
    });
  },

  recordStockIn: (params) => {
    const state = get();
    const ppe = state.ppeItems.find(p => p.id === params.ppeItemId);
    const loc = state.locations.find(l => l.id === params.locationId);
    const ref = `ADJ-IN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const isCategoryIII = ppe?.riskCategory === 'Category III';
    const isPurchaseReceipt = params.reasonCategory === 'Purchase Receipt';
    const requiresApproval = isCategoryIII && !isPurchaseReceipt;

    const adjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      reference: ref,
      type: 'IN',
      ppeItemId: params.ppeItemId,
      locationId: params.locationId,
      batchNumber: params.batchNumber,
      variantKey: params.variantKey,
      quantityDelta: params.quantity,
      reasonCategory: params.reasonCategory,
      reasonDetail: params.reasonDetail,
      manufacturerExpiryDate: params.manufacturerExpiryDate,
      supplierDeliveryNote: params.supplierDeliveryNote,
      status: requiresApproval ? 'pending' : 'applied',
      submittedBy: state.currentUser.name,
      createdAt: new Date().toISOString()
    };

    if (requiresApproval) {
      set({ stockAdjustments: [adjustment, ...state.stockAdjustments] });
      state.addNotification({
        type: 'approval_request',
        title: `HSE Approval Needed: ${ref}`,
        message: `Stock IN of ${params.quantity} pcs of Category III item "${ppe?.nameEn}" requires HSE Supervisor approval.`,
        severity: 'warning',
        linkTo: '/stock/adjustments'
      });
      state.writeAuditLog({
        user: state.currentUser.name,
        role: state.currentUser.role,
        objectType: 'StockAdjustment',
        objectReference: ref,
        action: 'SUBMITTED_FOR_APPROVAL',
        beforeValues: null,
        afterValues: adjustment,
        reason: params.reasonDetail,
        source: 'Screen'
      });
      return { requiresApproval: true, reference: ref };
    }

    // Apply immediately
    const existingBatch = state.batches.find(b => 
      b.batchNumber === params.batchNumber && 
      b.ppeItemId === params.ppeItemId && 
      b.locationId === params.locationId
    );

    let updatedBatches = [...state.batches];
    if (existingBatch) {
      updatedBatches = updatedBatches.map(b => b.id === existingBatch.id ? {
        ...b,
        quantity: b.quantity + params.quantity,
        availableQty: b.availableQty + params.quantity,
        status: 'Active'
      } : b);
    } else {
      updatedBatches.push({
        id: `bat-${Date.now()}`,
        batchNumber: params.batchNumber,
        ppeItemId: params.ppeItemId,
        locationId: params.locationId,
        variantKey: params.variantKey,
        quantity: params.quantity,
        availableQty: params.quantity,
        quarantinedQty: 0,
        condition: loc?.stockCondition === 'Used' ? 'Reused' : 'New',
        expiryDate: params.manufacturerExpiryDate,
        manufacturerExpiryDate: params.manufacturerExpiryDate,
        supplierDeliveryNote: params.supplierDeliveryNote,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
    }

    const updatedLocations = state.locations.map(l => l.id === params.locationId ? { ...l, hasHeldStock: true } : l);

    set({
      batches: updatedBatches,
      locations: updatedLocations,
      stockAdjustments: [adjustment, ...state.stockAdjustments]
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Stock',
      objectReference: ref,
      action: 'STOCK_IN_APPLIED',
      beforeValues: null,
      afterValues: { batchNumber: params.batchNumber, quantityAdded: params.quantity },
      reason: params.reasonDetail,
      source: 'Screen'
    });

    return { requiresApproval: false, reference: ref };
  },

  recordStockOut: (params) => {
    const state = get();
    const ppe = state.ppeItems.find(p => p.id === params.ppeItemId);
    const ref = `ADJ-OUT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const isCategoryIII = ppe?.riskCategory === 'Category III';
    const isQuarantine = params.reasonCategory === 'Quarantine';
    const requiresApproval = isCategoryIII;

    const adjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      reference: ref,
      type: 'OUT',
      ppeItemId: params.ppeItemId,
      locationId: params.locationId,
      batchNumber: params.batchNumber,
      variantKey: params.variantKey,
      quantityDelta: -params.quantity,
      reasonCategory: params.reasonCategory,
      reasonDetail: params.reasonDetail,
      quarantineReason: params.quarantineReason,
      status: requiresApproval ? 'pending' : 'applied',
      submittedBy: state.currentUser.name,
      createdAt: new Date().toISOString()
    };

    // If quarantine, mark batch quarantined immediately (even if approval is pending)
    let updatedBatches = [...state.batches];
    if (isQuarantine) {
      updatedBatches = updatedBatches.map(b => {
        if (b.batchNumber === params.batchNumber && b.ppeItemId === params.ppeItemId && b.locationId === params.locationId) {
          const moveQty = Math.min(b.availableQty, params.quantity);
          return {
            ...b,
            availableQty: Math.max(0, b.availableQty - moveQty),
            quarantinedQty: b.quarantinedQty + moveQty,
            status: 'Quarantined' as const
          };
        }
        return b;
      });
    }

    if (requiresApproval) {
      set({
        batches: updatedBatches,
        stockAdjustments: [adjustment, ...state.stockAdjustments]
      });
      state.addNotification({
        type: 'approval_request',
        title: `HSE Approval Needed: ${ref}`,
        message: `Stock OUT of ${params.quantity} pcs of Category III item "${ppe?.nameEn}" requires HSE Supervisor approval.`,
        severity: 'warning',
        linkTo: '/stock/adjustments'
      });
      state.writeAuditLog({
        user: state.currentUser.name,
        role: state.currentUser.role,
        objectType: 'StockAdjustment',
        objectReference: ref,
        action: isQuarantine ? 'QUARANTINE_PENDING_APPROVAL' : 'STOCK_OUT_PENDING_APPROVAL',
        beforeValues: null,
        afterValues: adjustment,
        reason: params.quarantineReason || params.reasonDetail,
        source: 'Screen'
      });
      return { requiresApproval: true, reference: ref };
    }

    // Apply deduction immediately if not quarantine
    if (!isQuarantine) {
      updatedBatches = updatedBatches.map(b => {
        if (b.batchNumber === params.batchNumber && b.ppeItemId === params.ppeItemId && b.locationId === params.locationId) {
          const newQty = Math.max(0, b.quantity - params.quantity);
          const newAvail = Math.max(0, b.availableQty - params.quantity);
          return {
            ...b,
            quantity: newQty,
            availableQty: newAvail,
            status: newQty === 0 ? 'Depleted' as const : b.status
          };
        }
        return b;
      });
    }

    set({
      batches: updatedBatches,
      stockAdjustments: [adjustment, ...state.stockAdjustments]
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Stock',
      objectReference: ref,
      action: isQuarantine ? 'BATCH_QUARANTINED' : 'STOCK_OUT_APPLIED',
      beforeValues: null,
      afterValues: { batchNumber: params.batchNumber, quantityDeducted: params.quantity },
      reason: params.quarantineReason || params.reasonDetail,
      source: 'Screen'
    });

    return { requiresApproval: false, reference: ref };
  },

  releaseQuarantine: (batchId, releaseReason) => {
    const state = get();
    const batch = state.batches.find(b => b.id === batchId);
    if (!batch) return;

    const releasedQty = batch.quarantinedQty;
    const updatedBatches = state.batches.map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          availableQty: b.availableQty + releasedQty,
          quarantinedQty: 0,
          status: 'Active' as const
        };
      }
      return b;
    });

    set({ batches: updatedBatches });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Stock',
      objectReference: batch.batchNumber,
      action: 'RELEASE_QUARANTINE',
      beforeValues: { quarantinedQty: batch.quarantinedQty, status: batch.status },
      afterValues: { quarantinedQty: 0, availableQty: batch.availableQty + releasedQty, status: 'Active' },
      reason: releaseReason,
      source: 'Screen'
    });
  },

  reviewAdjustment: (adjustmentId, action, reviewerId) => {
    const state = get();
    const adj = state.stockAdjustments.find(a => a.id === adjustmentId);
    if (!adj || adj.status !== 'pending') return { success: false, error: 'Adjustment not found or already reviewed.' };

    const reviewer = state.employees.find(e => e.id === reviewerId);
    const updatedStatus = action === 'approved' ? 'approved' : 'rejected';

    if (action === 'approved') {
      const batch = state.batches.find(b => b.batchNumber === adj.batchNumber && b.ppeItemId === adj.ppeItemId && b.locationId === adj.locationId);

      if (adj.type === 'IN') {
        let updatedBatches = [...state.batches];
        if (batch) {
          updatedBatches = updatedBatches.map(b => b.id === batch.id ? {
            ...b,
            quantity: b.quantity + adj.quantityDelta,
            availableQty: b.availableQty + adj.quantityDelta,
            status: 'Active'
          } : b);
        } else {
          updatedBatches.push({
            id: `bat-${Date.now()}`,
            batchNumber: adj.batchNumber,
            ppeItemId: adj.ppeItemId,
            locationId: adj.locationId,
            variantKey: adj.variantKey,
            quantity: adj.quantityDelta,
            availableQty: adj.quantityDelta,
            quarantinedQty: 0,
            condition: 'New',
            status: 'Active',
            createdAt: new Date().toISOString()
          });
        }
        set({ batches: updatedBatches });
      } else if (adj.type === 'OUT') {
        if (!batch || batch.availableQty < Math.abs(adj.quantityDelta)) {
          return { success: false, error: `Approved quantity (${Math.abs(adj.quantityDelta)}) is no longer available in batch ${adj.batchNumber}.` };
        }
        const updatedBatches = state.batches.map(b => b.id === batch.id ? {
          ...b,
          quantity: Math.max(0, b.quantity - Math.abs(adj.quantityDelta)),
          availableQty: Math.max(0, b.availableQty - Math.abs(adj.quantityDelta))
        } : b);
        set({ batches: updatedBatches });
      }
    }

    set({
      stockAdjustments: state.stockAdjustments.map(a => a.id === adjustmentId ? {
        ...a,
        status: updatedStatus,
        reviewedBy: reviewer?.name || reviewerId
      } : a)
    });

    state.writeAuditLog({
      user: reviewer?.name || state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'StockAdjustment',
      objectReference: adj.reference,
      action: action === 'approved' ? 'ADJUSTMENT_APPROVED' : 'ADJUSTMENT_REJECTED',
      beforeValues: { status: 'pending' },
      afterValues: { status: updatedStatus, reviewedBy: reviewer?.name },
      reason: `HSE Supervisor decision: ${action.toUpperCase()}`,
      source: 'Screen'
    });

    return { success: true };
  },

  transferStock: (params) => {
    const state = get();
    const fromLoc = state.locations.find(l => l.id === params.fromLocationId);
    const toLoc = state.locations.find(l => l.id === params.toLocationId);

    // Enforce Stock Condition transfer routing matrix
    if (fromLoc?.stockCondition === 'Used' && toLoc?.stockCondition === 'New') {
      return { success: false, error: 'Transfer from Used to New location is strictly blocked.' };
    }
    if (fromLoc?.stockCondition === 'Scrap' || toLoc?.stockCondition === 'Scrap') {
      return { success: false, error: 'Transfers directly into or out of a Scrap location are strictly blocked.' };
    }

    const sourceBatch = state.batches.find(b => 
      b.batchNumber === params.batchNumber && 
      b.ppeItemId === params.ppeItemId && 
      b.locationId === params.fromLocationId
    );

    if (!sourceBatch || sourceBatch.availableQty < params.quantity) {
      return { success: false, error: 'Insufficient available quantity in selected batch.' };
    }

    // Deduct from source batch
    let updatedBatches = state.batches.map(b => {
      if (b.id === sourceBatch.id) {
        return {
          ...b,
          quantity: b.quantity - params.quantity,
          availableQty: b.availableQty - params.quantity,
          status: b.availableQty - params.quantity <= 0 ? 'Depleted' as const : b.status
        };
      }
      return b;
    });

    // Add to target batch (mark as Reused if target is Used)
    const targetCondition = toLoc?.stockCondition === 'Used' ? 'Reused' : sourceBatch.condition;
    const existingTargetBatch = updatedBatches.find(b => 
      b.batchNumber === params.batchNumber && 
      b.ppeItemId === params.ppeItemId && 
      b.locationId === params.toLocationId
    );

    if (existingTargetBatch) {
      updatedBatches = updatedBatches.map(b => b.id === existingTargetBatch.id ? {
        ...b,
        quantity: b.quantity + params.quantity,
        availableQty: b.availableQty + params.quantity,
        condition: targetCondition,
        status: 'Active'
      } : b);
    } else {
      updatedBatches.push({
        ...sourceBatch,
        id: `bat-trf-${Date.now()}`,
        locationId: params.toLocationId,
        quantity: params.quantity,
        availableQty: params.quantity,
        quarantinedQty: 0,
        condition: targetCondition,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
    }

    const currentToLocStock = updatedBatches
      .filter(b => b.locationId === params.toLocationId)
      .reduce((sum, b) => sum + b.quantity, 0);
    const overcapacityWarning = toLoc ? (currentToLocStock > toLoc.capacityUnits) : false;

    set({ batches: updatedBatches });

    const ref = `TRF-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Stock',
      objectReference: ref,
      action: 'STOCK_TRANSFERRED',
      beforeValues: { from: fromLoc?.nameEn, batch: params.batchNumber, qty: params.quantity },
      afterValues: { to: toLoc?.nameEn, newCondition: targetCondition, overcapacityWarning },
      reason: `Stock transfer from ${fromLoc?.nameEn} to ${toLoc?.nameEn}`,
      source: 'Screen'
    });

    return { success: true, overcapacityWarning };
  },

  issueSinglePPE: (issuanceData) => {
    const state = get();
    const ref = `ISS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newIssuance: Issuance = {
      ...issuanceData,
      id: `iss-${Date.now()}`,
      reference: ref,
      status: 'issued',
      createdAt: new Date().toISOString()
    };

    // Deduct from batch
    const updatedBatches = state.batches.map(b => {
      if (b.batchNumber === issuanceData.batchNumber && 
          b.ppeItemId === issuanceData.ppeItemId && 
          b.locationId === issuanceData.locationId) {
        return {
          ...b,
          quantity: Math.max(0, b.quantity - issuanceData.quantity),
          availableQty: Math.max(0, b.availableQty - issuanceData.quantity)
        };
      }
      return b;
    });

    // Check if employee last received sizes need to be updated
    const updatedEmployees = state.employees.map(emp => {
      if (emp.id === issuanceData.employeeId && issuanceData.variantKey && issuanceData.ppeItemId) {
        return {
          ...emp,
          lastReceivedSizes: {
            ...emp.lastReceivedSizes,
            [issuanceData.ppeItemId]: { rawKey: issuanceData.variantKey }
          }
        };
      }
      return emp;
    });

    // Handle replaces issuance if specified
    let updatedIssuances = [...state.issuances, newIssuance];
    if (issuanceData.replacesIssuanceId) {
      updatedIssuances = updatedIssuances.map(i => i.id === issuanceData.replacesIssuanceId ? { ...i, status: 'returned' as const } : i);
    }

    set({
      issuances: updatedIssuances,
      batches: updatedBatches,
      employees: updatedEmployees
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Issuance',
      objectReference: ref,
      action: 'SINGLE_ITEM_ISSUED',
      beforeValues: null,
      afterValues: { employeeId: issuanceData.employeeId, ppeItemId: issuanceData.ppeItemId, quantity: issuanceData.quantity },
      reason: issuanceData.replacesIssuanceId ? `Replaces prior issuance ${issuanceData.replacesIssuanceId}` : 'Standard issuance',
      source: 'Screen'
    });

    return ref;
  },

  issueKitPPE: (params) => {
    const state = get();
    const kit = state.kits.find(k => k.id === params.kitId);
    let issuedCount = 0;
    let skippedCount = 0;
    const newIssuances: Issuance[] = [];
    let updatedBatches = [...state.batches];

    params.lines.forEach(line => {
      const ppe = state.ppeItems.find(p => p.id === line.ppeItemId);
      if (!ppe) return;

      // Find available batch
      const availableBatch = updatedBatches.find(b => 
        b.ppeItemId === line.ppeItemId && 
        b.locationId === params.locationId && 
        b.availableQty >= line.quantity
      );

      if (!availableBatch) {
        // Skip out of stock item with no open sub-request created (BD-I468)
        skippedCount++;
        return;
      }

      // Calculate Expected Replacement Date
      const issueDate = new Date();
      let replDate = new Date(issueDate);
      if (ppe.lifespanUnit === 'Days') replDate.setDate(replDate.getDate() + ppe.lifespanValue);
      else if (ppe.lifespanUnit === 'Months') replDate.setMonth(replDate.getMonth() + ppe.lifespanValue);
      else if (ppe.lifespanUnit === 'Years') replDate.setFullYear(replDate.getFullYear() + ppe.lifespanValue);

      const ref = `ISS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      newIssuances.push({
        id: `iss-${Date.now()}-${line.ppeItemId}`,
        reference: ref,
        employeeId: params.employeeId,
        ppeItemId: line.ppeItemId,
        kitId: params.kitId,
        locationId: params.locationId,
        quantity: line.quantity,
        batchNumber: availableBatch.batchNumber,
        variantKey: line.variantKey,
        conditionAtIssue: availableBatch.condition === 'Reused' ? 'Reused' : 'New',
        issueDate: issueDate.toISOString().split('T')[0],
        expectedReplacementDate: replDate.toISOString().split('T')[0],
        storeKeeperSignature: params.storeKeeperSignature,
        receiverSignature: params.receiverSignature,
        status: 'issued',
        issuedBy: state.currentUser.name,
        createdAt: new Date().toISOString()
      });

      // Deduct stock
      updatedBatches = updatedBatches.map(b => b.id === availableBatch.id ? {
        ...b,
        quantity: b.quantity - line.quantity,
        availableQty: b.availableQty - line.quantity
      } : b);

      issuedCount++;
    });

    set({
      issuances: [...state.issuances, ...newIssuances],
      batches: updatedBatches
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Issuance',
      objectReference: kit?.nameEn || params.kitId,
      action: 'KIT_ISSUED',
      beforeValues: null,
      afterValues: { employeeId: params.employeeId, kitId: params.kitId, issuedCount, skippedCount },
      reason: `Kit issuance: ${issuedCount} items issued, ${skippedCount} skipped due to stock`,
      source: 'Screen'
    });

    return { issuedCount, skippedCount };
  },

  returnPPE: (params) => {
    const state = get();
    const issuance = state.issuances.find(i => i.id === params.issuanceId);
    if (!issuance) return { success: false, error: 'Issuance record not found.' };

    const issuingLoc = state.locations.find(l => l.id === issuance.locationId);
    const site = issuingLoc ? issuingLoc.site : 'Cairo Site';

    let targetLocationId: string | undefined;

    if (params.condition === 'good') {
      // Good return routes to Used location of SAME SITE
      const usedLoc = state.locations.find(l => l.site === site && l.stockCondition === 'Used' && l.active);
      if (!usedLoc) {
        return { success: false, error: `No active Used-condition location found at site "${site}".` };
      }
      targetLocationId = usedLoc.id;
    } else if (params.condition === 'damaged' || params.condition === 'worn_out') {
      // Damaged/Worn out routes to Scrap location of SAME SITE
      const scrapLoc = state.locations.find(l => l.site === site && l.stockCondition === 'Scrap' && l.active);
      if (!scrapLoc) {
        // Block return with clear error message if site has no Scrap location (BD-I472)
        return { success: false, error: `Site "${site}" does not have an active Scrap-condition location. Damaged or worn-out returns cannot be processed until a Scrap location is created for this site.` };
      }
      targetLocationId = scrapLoc.id;
    }

    // Update stock if physical return
    let updatedBatches = [...state.batches];
    if (targetLocationId && params.condition !== 'lost') {
      const isScrap = params.condition === 'damaged' || params.condition === 'worn_out';
      updatedBatches.push({
        id: `bat-ret-${Date.now()}`,
        batchNumber: issuance.batchNumber || `RET-${Date.now().toString().slice(-4)}`,
        ppeItemId: issuance.ppeItemId || '',
        locationId: targetLocationId,
        variantKey: issuance.variantKey,
        quantity: params.quantity,
        availableQty: isScrap ? 0 : params.quantity,
        quarantinedQty: 0,
        condition: isScrap ? 'Scrapped' : 'Reused',
        status: isScrap ? 'Depleted' : 'Active',
        createdAt: new Date().toISOString()
      });
    }

    const returnRecord: IssuanceReturn = {
      id: `ret-${Date.now()}`,
      issuanceId: params.issuanceId,
      quantityReturned: params.quantity,
      condition: params.condition,
      physicalReceiptConfirmed: params.physicalReceiptConfirmed,
      returnedToLocationId: targetLocationId,
      storeKeeperSignature: params.storeKeeperSignature,
      receiverSignature: params.receiverSignature,
      returnedBy: state.currentUser.name,
      returnDate: new Date().toISOString()
    };

    // Close or partially close issuance
    const isFullReturn = params.quantity >= issuance.quantity;
    const updatedIssuances = state.issuances.map(i => i.id === params.issuanceId ? {
      ...i,
      quantity: Math.max(0, i.quantity - params.quantity),
      status: isFullReturn ? (params.condition === 'lost' ? 'lost' : 'returned') : i.status
    } : i);

    set({
      issuances: updatedIssuances,
      issuanceReturns: [...state.issuanceReturns, returnRecord],
      batches: updatedBatches
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Issuance',
      objectReference: issuance.reference,
      action: 'ITEM_RETURNED',
      beforeValues: { status: issuance.status, quantity: issuance.quantity },
      afterValues: { condition: params.condition, targetLocationId, quantityReturned: params.quantity },
      reason: `Return processed: ${params.condition}`,
      source: 'Screen'
    });

    return { success: true };
  },

  issueVisitorLoan: (loanData) => {
    const state = get();
    const loanNum = `LN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newLoan: VisitorLoan = {
      ...loanData,
      id: `loan-${Date.now()}`,
      loanNumber: loanNum,
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    // Deduct stock for each loan item
    let updatedBatches = [...state.batches];
    loanData.items.forEach(item => {
      updatedBatches = updatedBatches.map(b => {
        if (b.batchNumber === item.batchNumber && b.ppeItemId === item.ppeItemId && b.locationId === item.fromLocationId) {
          return {
            ...b,
            quantity: Math.max(0, b.quantity - item.quantity),
            availableQty: Math.max(0, b.availableQty - item.quantity)
          };
        }
        return b;
      });
    });

    set({
      visitorLoans: [newLoan, ...state.visitorLoans],
      batches: updatedBatches
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Loan',
      objectReference: loanNum,
      action: 'LOAN_ISSUED',
      beforeValues: null,
      afterValues: { recipientName: loanData.recipientName, itemsCount: loanData.items.length },
      reason: `Loan issued to ${loanData.recipientName} (${loanData.recipientCompany})`,
      source: 'Screen'
    });

    return loanNum;
  },

  returnLoanLine: (params) => {
    const state = get();
    const loan = state.visitorLoans.find(l => l.id === params.loanId);
    if (!loan) return { success: false, error: 'Loan record not found.' };

    const line = loan.items.find(i => i.id === params.lineId);
    if (!line) return { success: false, error: 'Loan line item not found.' };

    const loc = state.locations.find(l => l.id === line.fromLocationId);
    const site = loc ? loc.site : 'Cairo Site';

    let targetLocationId: string | undefined;

    if (params.condition === 'good') {
      const usedLoc = state.locations.find(l => l.site === site && l.stockCondition === 'Used' && l.active);
      if (!usedLoc) return { success: false, error: `No active Used location found at site "${site}".` };
      targetLocationId = usedLoc.id;
    } else if (params.condition === 'damaged') {
      const scrapLoc = state.locations.find(l => l.site === site && l.stockCondition === 'Scrap' && l.active);
      if (!scrapLoc) return { success: false, error: `No active Scrap location found at site "${site}". Damaged item cannot be returned until Scrap location exists.` };
      targetLocationId = scrapLoc.id;
    }

    // Add back to inventory
    let updatedBatches = [...state.batches];
    if (targetLocationId && params.condition !== 'lost') {
      const isScrap = params.condition === 'damaged';
      updatedBatches.push({
        id: `bat-loan-ret-${Date.now()}`,
        batchNumber: line.batchNumber,
        ppeItemId: line.ppeItemId,
        locationId: targetLocationId,
        variantKey: line.variantKey,
        quantity: params.returnedQuantity,
        availableQty: isScrap ? 0 : params.returnedQuantity,
        quarantinedQty: 0,
        condition: isScrap ? 'Scrapped' : 'Reused',
        status: isScrap ? 'Depleted' : 'Active',
        createdAt: new Date().toISOString()
      });
    }

    // Update line item in loan
    const updatedItems = loan.items.map(item => {
      if (item.id === params.lineId) {
        const newRet = item.returnedQuantity + params.returnedQuantity;
        const isClosed = newRet >= item.quantity;
        return {
          ...item,
          returnedQuantity: newRet,
          conditionOnReturn: params.condition,
          status: isClosed ? (params.condition === 'damaged' ? 'Damaged' as const : params.condition === 'lost' ? 'Lost' as const : 'Returned' as const) : 'Open' as const
        };
      }
      return item;
    });

    const allLinesClosed = updatedItems.every(i => i.status !== 'Open');
    const updatedStatus = allLinesClosed ? 'Closed' : 'Partially Returned';

    const updatedLoans = state.visitorLoans.map(l => l.id === params.loanId ? {
      ...l,
      items: updatedItems,
      status: updatedStatus as any
    } : l);

    set({ visitorLoans: updatedLoans, batches: updatedBatches });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Loan',
      objectReference: loan.loanNumber,
      action: 'LOAN_ITEM_RETURNED',
      beforeValues: { returnedQuantity: line.returnedQuantity },
      afterValues: { returnedQuantity: line.returnedQuantity + params.returnedQuantity, condition: params.condition, loanStatus: updatedStatus },
      reason: `Loan return: ${params.condition}`,
      source: 'Screen'
    });

    return { success: true };
  },

  updateSettings: (newSettings, reason) => {
    const state = get();
    const oldSettings = state.settings;
    const merged = { ...oldSettings, ...newSettings };

    set({ settings: merged });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Settings',
      objectReference: 'MODULE_CONFIG',
      action: 'SETTINGS_UPDATED',
      beforeValues: oldSettings,
      afterValues: merged,
      reason,
      source: 'Screen'
    });
  },

  updateStoreKeeperAssignments: (storeKeeperId, locationIds) => {
    const state = get();
    const keeper = state.employees.find(e => e.id === storeKeeperId);
    const oldAssignments = state.locations.filter(l => l.assignedStoreKeeperIds.includes(storeKeeperId)).map(l => l.code);

    const updatedLocations = state.locations.map(loc => {
      const hasKeeper = loc.assignedStoreKeeperIds.includes(storeKeeperId);
      const shouldHave = locationIds.includes(loc.id);

      if (hasKeeper && !shouldHave) {
        return { ...loc, assignedStoreKeeperIds: loc.assignedStoreKeeperIds.filter(id => id !== storeKeeperId) };
      } else if (!hasKeeper && shouldHave) {
        return { ...loc, assignedStoreKeeperIds: [...loc.assignedStoreKeeperIds, storeKeeperId] };
      }
      return loc;
    });

    const newAssignments = updatedLocations.filter(l => l.assignedStoreKeeperIds.includes(storeKeeperId)).map(l => l.code);

    set({ locations: updatedLocations });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'StoreKeeperAssignment',
      objectReference: keeper?.name || storeKeeperId,
      action: 'STORE_KEEPER_LOCATIONS_UPDATED',
      beforeValues: { assignedLocations: oldAssignments },
      afterValues: { assignedLocations: newAssignments },
      reason: `Updated location access assignments for ${keeper?.name}`,
      source: 'Screen'
    });
  },

  importHistoricalIssuances: (rows: Array<{
    employeeId: string;
    itemCode: string;
    variantKey?: string;
    quantity: number;
    issueDate: string;
    locationId?: string;
  }>) => {
    const state = get();
    const batchId = `IMP-BATCH-${Date.now()}`;
    const newIssuances: Issuance[] = [];

    rows.forEach(row => {
      const ppe = state.ppeItems.find(p => p.itemCode.toLowerCase() === row.itemCode.toLowerCase());
      if (!ppe) return;

      const issueD = new Date(row.issueDate);
      let replD = new Date(issueD);
      if (ppe.lifespanUnit === 'Days') replD.setDate(replD.getDate() + ppe.lifespanValue);
      else if (ppe.lifespanUnit === 'Months') replD.setMonth(replD.getMonth() + ppe.lifespanValue);
      else if (ppe.lifespanUnit === 'Years') replD.setFullYear(replD.getFullYear() + ppe.lifespanValue);

      const ref = `ISS-IMP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      newIssuances.push({
        id: `iss-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        reference: ref,
        employeeId: row.employeeId,
        ppeItemId: ppe.id,
        locationId: row.locationId || (ppe.locationIds?.[0] || state.locations[0]?.id),
        quantity: row.quantity,
        variantKey: row.variantKey || 'Standard',
        conditionAtIssue: 'New',
        issueDate: row.issueDate,
        expectedReplacementDate: replD.toISOString().split('T')[0],
        status: 'issued',
        isImported: true,
        issuedBy: `Import (${state.currentUser.name})`,
        createdAt: new Date().toISOString()
      });
    });

    set({ issuances: [...state.issuances, ...newIssuances] });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Issuance',
      objectReference: batchId,
      action: 'HISTORICAL_ISSUANCES_IMPORTED',
      beforeValues: null,
      afterValues: { importedRows: newIssuances.length, batchId },
      reason: `Historical issuances imported via Excel (${newIssuances.length} records)`,
      source: 'Import'
    });

    return { importedCount: newIssuances.length, batchId };
  },

  reverseScrap: (scrapId, reason) => {
    const state = get();
    const entry = state.scrapEntries.find(s => s.id === scrapId);
    if (!entry || entry.reversed) return;

    set({
      scrapEntries: state.scrapEntries.map(s => s.id === scrapId ? {
        ...s,
        reversed: true,
        reversedBy: state.currentUser.name,
        reversedAt: new Date().toISOString(),
        reversalReason: reason
      } : s)
    });

    state.writeAuditLog({
      user: state.currentUser.name,
      role: state.currentUser.role,
      objectType: 'Stock',
      objectReference: scrapId,
      action: 'SCRAP_REVERSED',
      beforeValues: { reversed: false },
      afterValues: { reversed: true, reversalReason: reason },
      reason,
      source: 'Screen'
    });
  }
}));

export const useStore = usePPEStore;
