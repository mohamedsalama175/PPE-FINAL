import { create } from 'zustand';
import { generateId } from '../lib/utils';
import * as mockData from './mockData';
import { 
  JobPosition, Location, Attribute, ItemGroup, PPEItem, Kit, Employee, 
  StockBalance, StockMovement, StockAdjustment, Issuance, IssuanceReturn, 
  ScrapEntry, ExpirySettings, Role, BaseEntity, OpeningBalance, Batch, AuditLog
} from '../types';

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
  expirySettings: ExpirySettings;
  openingBalances: OpeningBalance[];
  batches: Batch[];
  auditLogs: AuditLog[];
  
  // Actions for Entities (CRUD with soft delete)
  saveEntity: <T extends BaseEntity>(entityName: keyof AppState, entity: T) => void;
  softDeleteEntity: (entityName: keyof AppState, id: string) => void;
  restoreEntity: (entityName: keyof AppState, id: string) => void;
  
  // Specific Actions
  saveOpeningBalance: (ob: OpeningBalance) => void;
  approveOpeningBalance: (id: string, approverId: string) => void;
  rejectOpeningBalance: (id: string, reason: string) => void;

  adjustStock: (adjustment: StockAdjustment) => void;
  reviewAdjustment: (id: string, status: 'approved' | 'rejected', reviewerId: string) => void;
  transferStock: (ppeItemId: string, fromLocationId: string, toLocationId: string, batchNumber: string, quantity: number, byId: string) => void;
  issueItem: (issuance: Omit<Issuance, 'id' | 'status'>) => void;
  returnItem: (issuanceId: string, condition: 'good' | 'damaged' | 'worn_out' | 'lost', physicalReceiptConfirmed: boolean, returnedBy: string) => void;
  reverseScrap: (id: string, reason: string, reversedBy: string) => void;
  updateExpirySettings: (settings: ExpirySettings) => void;
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
  openingBalances: mockData.mockOpeningBalances,
  batches: mockData.mockBatches,
  auditLogs: [],

  saveEntity: (entityName, entity) => {
    set((state) => {
      const list = state[entityName] as any[];
      const existingIdx = list.findIndex(e => e.id === entity.id);
      if (existingIdx >= 0) {
        const newList = [...list];
        newList[existingIdx] = entity;
        return { [entityName]: newList } as Partial<AppState>;
      } else {
        return { [entityName]: [...list, { ...entity, id: entity.id || generateId() }] } as Partial<AppState>;
      }
    });
  },

  softDeleteEntity: (entityName, id) => {
    set((state) => {
      const list = state[entityName] as any[];
      return {
        [entityName]: list.map(e => e.id === id ? { ...e, active: false, deletedAt: new Date().toISOString() } : e)
      } as Partial<AppState>;
    });
  },

  restoreEntity: (entityName, id) => {
    set((state) => {
      const list = state[entityName] as any[];
      return {
        [entityName]: list.map(e => e.id === id ? { ...e, active: true, deletedAt: null } : e)
      } as Partial<AppState>;
    });
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
  },

  approveOpeningBalance: (id, approverId) => {
    set((state) => {
      const ob = state.openingBalances.find(o => o.id === id);
      if (!ob || ob.status !== 'Pending Approval') return state;

      const newObs = state.openingBalances.map(o => 
        o.id === id ? { ...o, status: 'Approved' as const, approvedBy: approverId, approvedAt: new Date().toISOString() } : o
      );

      // Create batch records
      const newBatches = ob.lines.map(line => ({
        id: generateId(),
        batchNumber: line.batchNumber,
        ppeItemId: line.ppeItemId,
        locationId: ob.locationId,
        quantity: line.quantity,
        availableQty: line.quantity,
        expiryDate: line.expiryDate,
        costPerUnit: line.costPerUnit,
        status: 'Active' as const,
        openingBalanceId: ob.id,
        createdAt: new Date().toISOString()
      }));

      // Also update stock balances
      let newBalances = [...state.stockBalances];
      ob.lines.forEach(line => {
        const balIdx = newBalances.findIndex(b => b.ppeItemId === line.ppeItemId && b.locationId === ob.locationId);
        if (balIdx >= 0) {
          newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: newBalances[balIdx].quantityOnHand + line.quantity };
        } else {
          newBalances.push({ id: generateId(), ppeItemId: line.ppeItemId, locationId: ob.locationId, quantityOnHand: line.quantity });
        }
      });

      const newAuditLog: AuditLog = {
        id: generateId(),
        entityType: 'OpeningBalance',
        entityId: id,
        action: 'APPROVED',
        performedBy: approverId,
        timestamp: new Date().toISOString()
      };

      return { openingBalances: newObs, batches: [...state.batches, ...newBatches], stockBalances: newBalances, auditLogs: [...state.auditLogs, newAuditLog] };
    });
  },

  rejectOpeningBalance: (id, reason) => {
    set((state) => {
      const newObs = state.openingBalances.map(o => 
        o.id === id ? { ...o, status: 'Rejected' as const, rejectionReason: reason } : o
      );
      return { openingBalances: newObs };
    });
  },

  adjustStock: (adjustment) => {
    set((state) => {
      const isApplied = adjustment.status === 'applied';
      const adjId = generateId();
      
      let newAdjustments = [...state.stockAdjustments, { ...adjustment, id: adjId, createdAt: new Date().toISOString() }];
      
      if (!isApplied) {
        return { stockAdjustments: newAdjustments };
      }

      // If applied immediately, update stock balances and batches
      let newBalances = [...state.stockBalances];
      let newBatches = [...state.batches];

      // Handle Stock Balance
      const balIdx = newBalances.findIndex(b => b.ppeItemId === adjustment.ppeItemId && b.locationId === adjustment.locationId);
      if (balIdx >= 0) {
        newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: Math.max(0, newBalances[balIdx].quantityOnHand + adjustment.quantityDelta) };
      } else if (adjustment.quantityDelta > 0) {
        newBalances.push({ id: generateId(), ppeItemId: adjustment.ppeItemId, locationId: adjustment.locationId, quantityOnHand: adjustment.quantityDelta });
      }

      // Handle Batch
      const batchIdx = newBatches.findIndex(b => b.batchNumber === adjustment.batchNumber && b.ppeItemId === adjustment.ppeItemId && b.locationId === adjustment.locationId);
      if (batchIdx >= 0) {
        newBatches[batchIdx] = { 
          ...newBatches[batchIdx], 
          quantity: newBatches[batchIdx].quantity + (adjustment.quantityDelta > 0 ? adjustment.quantityDelta : 0),
          availableQty: Math.max(0, newBatches[batchIdx].availableQty + adjustment.quantityDelta),
          status: newBatches[batchIdx].availableQty + adjustment.quantityDelta <= 0 ? 'Depleted' : 'Active'
        };
      } else if (adjustment.quantityDelta > 0) {
        newBatches.push({
          id: generateId(),
          batchNumber: adjustment.batchNumber,
          ppeItemId: adjustment.ppeItemId,
          locationId: adjustment.locationId,
          quantity: adjustment.quantityDelta,
          availableQty: adjustment.quantityDelta,
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(), // Fallback expiry
          status: 'Active',
          createdAt: new Date().toISOString()
        });
      }

      const newAuditLog: AuditLog = {
        id: generateId(),
        entityType: 'StockAdjustment',
        entityId: adjId,
        action: 'APPLIED',
        details: `Quantity delta: ${adjustment.quantityDelta}`,
        performedBy: adjustment.submittedBy,
        timestamp: new Date().toISOString()
      };

      return { stockAdjustments: newAdjustments, stockBalances: newBalances, batches: newBatches, auditLogs: [...state.auditLogs, newAuditLog] };
    });
  },

  reviewAdjustment: (id, status, reviewerId) => {
    set((state) => {
      const adj = state.stockAdjustments.find(a => a.id === id);
      if (!adj) return state;

      const newAdjustments = state.stockAdjustments.map(a => 
        a.id === id ? { ...a, status, reviewedBy: reviewerId } : a
      );

      let newBalances = [...state.stockBalances];
      let newBatches = [...state.batches];
      
      if (status === 'approved') {
        const balIdx = newBalances.findIndex(b => b.ppeItemId === adj.ppeItemId && b.locationId === adj.locationId);
        if (balIdx >= 0) {
          newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: Math.max(0, newBalances[balIdx].quantityOnHand + adj.quantityDelta) };
        } else if (adj.quantityDelta > 0) {
          newBalances.push({ id: generateId(), ppeItemId: adj.ppeItemId, locationId: adj.locationId, quantityOnHand: adj.quantityDelta });
        }

        const batchIdx = newBatches.findIndex(b => b.batchNumber === adj.batchNumber && b.ppeItemId === adj.ppeItemId && b.locationId === adj.locationId);
        if (batchIdx >= 0) {
          newBatches[batchIdx] = { 
            ...newBatches[batchIdx], 
            quantity: newBatches[batchIdx].quantity + (adj.quantityDelta > 0 ? adj.quantityDelta : 0),
            availableQty: Math.max(0, newBatches[batchIdx].availableQty + adj.quantityDelta),
            status: newBatches[batchIdx].availableQty + adj.quantityDelta <= 0 ? 'Depleted' : 'Active'
          };
        } else if (adj.quantityDelta > 0) {
          newBatches.push({
            id: generateId(),
            batchNumber: adj.batchNumber || `B-${new Date().getTime()}`,
            ppeItemId: adj.ppeItemId,
            locationId: adj.locationId,
            quantity: adj.quantityDelta,
            availableQty: adj.quantityDelta,
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
            status: 'Active',
            createdAt: new Date().toISOString()
          });
        }
      }

      const newAuditLog: AuditLog = {
        id: generateId(),
        entityType: 'StockAdjustment',
        entityId: id,
        action: status.toUpperCase(),
        performedBy: reviewerId,
        timestamp: new Date().toISOString()
      };

      return { stockAdjustments: newAdjustments, stockBalances: newBalances, batches: newBatches, auditLogs: [...state.auditLogs, newAuditLog] };
    });
  },

  transferStock: (ppeItemId, fromLocationId, toLocationId, batchNumber, quantity, byId) => {
    set((state) => {
      let newBalances = [...state.stockBalances];
      let newBatches = [...state.batches];
      let newMovements = [...state.stockMovements];
      
      const fromIdx = newBalances.findIndex(b => b.ppeItemId === ppeItemId && b.locationId === fromLocationId);
      if (fromIdx >= 0 && newBalances[fromIdx].quantityOnHand >= quantity) {
        newBalances[fromIdx] = { ...newBalances[fromIdx], quantityOnHand: newBalances[fromIdx].quantityOnHand - quantity };
        
        const toIdx = newBalances.findIndex(b => b.ppeItemId === ppeItemId && b.locationId === toLocationId);
        if (toIdx >= 0) {
          newBalances[toIdx] = { ...newBalances[toIdx], quantityOnHand: newBalances[toIdx].quantityOnHand + quantity };
        } else {
          newBalances.push({ id: generateId(), ppeItemId, locationId: toLocationId, quantityOnHand: quantity });
        }
        
        const sourceBatchIdx = newBatches.findIndex(b => b.batchNumber === batchNumber && b.ppeItemId === ppeItemId && b.locationId === fromLocationId);
        if (sourceBatchIdx >= 0 && newBatches[sourceBatchIdx].availableQty >= quantity) {
           newBatches[sourceBatchIdx] = {
             ...newBatches[sourceBatchIdx],
             availableQty: newBatches[sourceBatchIdx].availableQty - quantity,
             quantity: newBatches[sourceBatchIdx].quantity - quantity, // Also deduct original qty conceptually
             status: newBatches[sourceBatchIdx].availableQty - quantity <= 0 ? 'Depleted' : 'Active'
           };
           
           const targetBatchIdx = newBatches.findIndex(b => b.batchNumber === batchNumber && b.ppeItemId === ppeItemId && b.locationId === toLocationId);
           if (targetBatchIdx >= 0) {
             newBatches[targetBatchIdx] = {
               ...newBatches[targetBatchIdx],
               availableQty: newBatches[targetBatchIdx].availableQty + quantity,
               quantity: newBatches[targetBatchIdx].quantity + quantity,
               status: 'Active'
             };
           } else {
             newBatches.push({
               ...newBatches[sourceBatchIdx],
               id: generateId(),
               locationId: toLocationId,
               availableQty: quantity,
               quantity: quantity,
               status: 'Active'
             });
           }
        }
        
        const reference = `TRF-${new Date().getTime().toString().slice(-5)}`;
        
        newMovements.push({
          id: generateId(),
          type: 'transfer',
          ppeItemId,
          locationId: fromLocationId,
          toLocationId,
          quantity,
          reason: 'Location Transfer',
          reference,
          createdBy: byId,
          createdAt: new Date().toISOString()
        });
        
        const newAuditLog: AuditLog = {
          id: generateId(),
          entityType: 'Transfer',
          entityId: reference,
          action: 'TRANSFERRED',
          details: `Transferred ${quantity} of ${ppeItemId} from ${fromLocationId} to ${toLocationId}`,
          performedBy: byId,
          timestamp: new Date().toISOString()
        };
        
        return { stockBalances: newBalances, batches: newBatches, stockMovements: newMovements, auditLogs: [...state.auditLogs, newAuditLog] };
      }
      
      return { stockBalances: newBalances, batches: newBatches, stockMovements: newMovements };
    });
  },

  issueItem: (issuance) => {
    set((state) => {
      const newIssuance: Issuance = { ...issuance, id: generateId(), status: 'issued' };
      
      // Deduct from stock
      let newBalances = [...state.stockBalances];
      if (issuance.ppeItemId) {
        const balIdx = newBalances.findIndex(b => b.ppeItemId === issuance.ppeItemId && b.locationId === issuance.locationId);
        if (balIdx >= 0) {
          newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: Math.max(0, newBalances[balIdx].quantityOnHand - issuance.quantity) };
        }
      } else if (issuance.kitId) {
        const kit = state.kits?.find(k => k.id === issuance.kitId);
        if (kit) {
          kit.items.forEach(kItem => {
            const balIdx = newBalances.findIndex(b => b.ppeItemId === kItem.ppeItemId && b.locationId === issuance.locationId);
            if (balIdx >= 0) {
              newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: Math.max(0, newBalances[balIdx].quantityOnHand - (kItem.qty * issuance.quantity)) };
            }
          });
        }
      }

      const newAuditLog: AuditLog = {
        id: generateId(),
        entityType: 'Issuance',
        entityId: newIssuance.id,
        action: 'ISSUED',
        details: `Issued ${issuance.quantity} of ${issuance.ppeItemId ? 'Item ' + issuance.ppeItemId : 'Kit ' + issuance.kitId} at ${issuance.locationId}`,
        performedBy: issuance.issuedBy,
        timestamp: new Date().toISOString()
      };

      return { issuances: [...state.issuances, newIssuance], stockBalances: newBalances, auditLogs: [...state.auditLogs, newAuditLog] };
    });
  },

  returnItem: (issuanceId, condition, physicalReceiptConfirmed, returnedBy) => {
    set((state) => {
      const issuance = state.issuances.find(i => i.id === issuanceId);
      if (!issuance) return state;

      const isDamagedOrWornOut = condition === 'damaged' || condition === 'worn_out';
      const autoScrapped = isDamagedOrWornOut && physicalReceiptConfirmed;

      const newReturn: IssuanceReturn = {
        id: generateId(), 
        issuanceId, 
        condition, 
        physicalReceiptConfirmed,
        autoScrapped, 
        returnedBy, 
        returnDate: new Date().toISOString()
      };

      const newIssuances = state.issuances.map(i => i.id === issuanceId ? { ...i, status: 'returned' as const } : i);
      let newBalances = [...state.stockBalances];
      let newScraps = [...state.scrapEntries];
      let newAuditLogs = [...state.auditLogs];

      if (condition === 'good' && issuance.ppeItemId) {
        const usedLoc = state.locations.find(l => l.locationType === 'Used');
        const targetLocationId = usedLoc ? usedLoc.id : issuance.locationId;

        const balIdx = newBalances.findIndex(b => b.ppeItemId === issuance.ppeItemId && b.locationId === targetLocationId);
        if (balIdx >= 0) {
          newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: newBalances[balIdx].quantityOnHand + issuance.quantity };
        } else {
          newBalances.push({ id: generateId(), ppeItemId: issuance.ppeItemId, locationId: targetLocationId, quantityOnHand: issuance.quantity });
        }
      } else if (autoScrapped && issuance.ppeItemId) {
        const scrapLoc = state.locations.find(l => l.locationType === 'Scrap') || { id: issuance.locationId };
        
        const newScrapId = generateId();
        newScraps.push({
          id: newScrapId,
          ppeItemId: issuance.ppeItemId,
          locationId: scrapLoc.id,
          batchNumber: issuance.batchNumber,
          quantity: issuance.quantity,
          reason: `Returned condition: ${condition}`,
          relatedReferenceId: issuance.id,
          reversed: false,
          scrappedBy: returnedBy,
          createdAt: new Date().toISOString()
        });

        newAuditLogs.push({
          id: generateId(),
          entityType: 'Scrap',
          entityId: newScrapId,
          action: 'AUTO_SCRAPPED',
          details: `Condition: ${condition}`,
          performedBy: returnedBy,
          timestamp: new Date().toISOString()
        });
      }

      newAuditLogs.push({
        id: generateId(),
        entityType: 'Issuance',
        entityId: issuanceId,
        action: 'RETURNED',
        details: `Condition: ${condition}`,
        performedBy: returnedBy,
        timestamp: new Date().toISOString()
      });
      
      return { 
        issuances: newIssuances, 
        issuanceReturns: [...state.issuanceReturns, newReturn], 
        stockBalances: newBalances, 
        scrapEntries: newScraps,
        auditLogs: newAuditLogs
      };
    });
  },

  reverseScrap: (id, reason, reversedBy) => {
    set((state) => {
      const scrap = state.scrapEntries.find(s => s.id === id);
      if (!scrap || scrap.reversed) return state;

      const newScraps = state.scrapEntries.map(s => s.id === id ? { ...s, reversed: true, reversalReason: reason, reversedBy, reversedAt: new Date().toISOString() } : s);
      
      let newBalances = [...state.stockBalances];
      
      const usedLoc = state.locations.find(l => l.locationType === 'Used');
      let targetLocationId = usedLoc ? usedLoc.id : state.locations[0].id;
      
      if (scrap.relatedReferenceId) {
        const issuance = state.issuances.find(i => i.id === scrap.relatedReferenceId);
        if (issuance) {
           targetLocationId = usedLoc ? usedLoc.id : issuance.locationId;
        }
      }

      const balIdx = newBalances.findIndex(b => b.ppeItemId === scrap.ppeItemId && b.locationId === targetLocationId);
      if (balIdx >= 0) {
         newBalances[balIdx] = { ...newBalances[balIdx], quantityOnHand: newBalances[balIdx].quantityOnHand + scrap.quantity };
      } else {
         newBalances.push({ id: generateId(), ppeItemId: scrap.ppeItemId, locationId: targetLocationId, quantityOnHand: scrap.quantity });
      }

      const newAuditLogs = [...state.auditLogs, {
        id: generateId(),
        entityType: 'Scrap',
        entityId: id,
        action: 'REVERSED',
        details: reason,
        performedBy: reversedBy,
        timestamp: new Date().toISOString()
      } as AuditLog];

      return { scrapEntries: newScraps, stockBalances: newBalances, auditLogs: newAuditLogs };
    });
  },

  updateExpirySettings: (settings) => {
    set({ expirySettings: settings });
  }
}));
export const useStore = usePPEStore;
