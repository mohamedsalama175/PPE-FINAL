export type Role = 'Admin' | 'HSE Supervisor' | 'Direct Supervisor' | 'Store Keeper' | 'Employee';

export interface BaseEntity {
  id: string;
  active: boolean;
  deletedAt?: string | null;
}

export type LocationType = 'Central Warehouse' | 'Site Store' | 'Department Store' | 'Scrap' | 'Used' | 'General';

export interface Location extends BaseEntity {
  code: string;
  nameEn: string;
  nameAr: string;
  site: string;
  locationType: LocationType;
  description: string;
  capacityUnits: number;
  address: string;
  assignedStoreKeeperIds: string[];
}

export interface AttributeValue {
  id: string;
  value: string;
  sortOrder: number;
}

export interface Attribute extends BaseEntity {
  code: string;
  nameEn: string;
  nameAr: string;
  values: AttributeValue[];
}

export interface ItemGroup extends BaseEntity {
  code: string;
  nameEn: string;
  nameAr: string;
  attributeIds: string[];
}

export interface PPEItem extends BaseEntity {
  itemCode: string;
  nameEn: string;
  nameAr: string;
  photoUrl?: string;
  category: string;
  itemGroupId: string;
  hasSize: boolean;
  gender: 'Male' | 'Female' | 'Unisex';
  lifespanType: 'Days' | 'Months' | 'Years';
  lifespanValue: number;
  descriptionEn: string;
  descriptionAr: string;
  manufacturer: string;
  model: string;
  standardCertification: string;
  riskCategory: 'I' | 'II' | 'III';
  reorderLevel: number;
  locationIds: string[]; // Valid locations for this item
  variantAttributeValueIds: string[]; // default variants if applicable
  uom: string;
}

export interface KitItem {
  id: string;
  ppeItemId: string;
  qty: number;
  variantKey?: string;
}

export interface Kit extends BaseEntity {
  nameEn: string;
  nameAr: string;
  jobPositionId: string;
  items: KitItem[];
}

export interface JobPosition extends BaseEntity {
  code: string;
  nameEn: string;
  nameAr: string;
}

export interface Employee extends BaseEntity {
  name: string;
  employeeCode: string;
  jobPositionId: string;
  role: Role; // For mocking
}

export interface StockBalance {
  id: string; // surrogate key
  ppeItemId: string;
  locationId: string;
  variantKey?: string; // stringified attributes
  quantityOnHand: number;
}

export interface StockMovement {
  id: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment' | 'opening';
  ppeItemId: string;
  locationId: string;
  toLocationId?: string;
  quantity: number;
  reason: string;
  reference: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  reference: string;
  type: 'IN' | 'OUT';
  ppeItemId: string;
  locationId: string;
  batchNumber: string;
  quantityDelta: number;
  reasonCategory: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  submittedBy: string;
  reviewedBy?: string;
  createdAt: string;
}

export interface Issuance {
  id: string;
  employeeId?: string; 
  holderName?: string; // for loan
  holderType?: string; // for loan
  ppeItemId?: string;
  kitId?: string;
  locationId: string;
  quantity: number;
  batchNumber?: string;
  variantKey?: string; // size/color selection
  issueDate: string;
  expectedReturnDate?: string;
  expectedReplacementDate?: string; // Auto-calculated lifespan
  storeKeeperSignature?: string; // data URI
  receiverSignature?: string; // data URI
  status: 'issued' | 'returned' | 'scrapped';
  issuedBy: string;
}

export interface IssuanceReturn {
  id: string;
  issuanceId: string;
  condition: 'good' | 'damaged' | 'worn_out' | 'lost';
  physicalReceiptConfirmed?: boolean;
  autoScrapped: boolean;
  returnedBy: string;
  returnDate: string;
}

export interface ScrapEntry {
  id: string;
  ppeItemId: string;
  locationId: string;
  batchNumber?: string;
  quantity: number;
  reason: string;
  relatedReferenceId?: string; // issuanceId or stockMovementId
  reversed: boolean;
  reversedBy?: string;
  reversedAt?: string;
  reversalReason?: string;
  scrappedBy: string;
  createdAt: string;
}

export interface ExpirySettings {
  generalLeadTimeDays: number;
  categoryOverrides: { riskCategory: 'I' | 'II' | 'III'; leadTimeDays: number }[];
}

export interface OpeningBalanceLine {
  id: string;
  ppeItemId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPerUnit?: number;
}

export interface OpeningBalance {
  id: string;
  locationId: string;
  referenceDate: string;
  notes?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
  preparedBy: string;
  approvedBy?: string;
  rejectionReason?: string;
  lines: OpeningBalanceLine[];
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  ppeItemId: string;
  locationId: string;
  quantity: number; // original quantity
  availableQty: number; // currently available
  expiryDate: string;
  costPerUnit?: number;
  status: 'Active' | 'Depleted' | 'Recalled' | 'Scrapped';
  openingBalanceId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: 'OpeningBalance' | 'StockAdjustment' | 'Issuance' | 'Transfer' | 'Scrap';
  entityId: string;
  action: string;
  details?: string;
  performedBy: string;
  timestamp: string;
}
