export type Role = 'Admin' | 'HSE Supervisor' | 'Direct Supervisor' | 'Store Keeper' | 'Employee';

export interface BaseEntity {
  id: string;
  active: boolean;
  deletedAt?: string | null;
}

export type LocationType = 'Central Warehouse' | 'Site Store' | 'Department Store' | 'General' | 'Scrap' | 'Used';
export type StockCondition = 'New' | 'Used' | 'Scrap';

export interface Location extends BaseEntity {
  code: string;
  name: string;
  site: string;
  locationType: LocationType;
  stockCondition: StockCondition;
  description: string;
  capacityUnits: number;
  address: string;
  assignedStoreKeeperIds: string[];
  openingBalanceClosed?: boolean;
}

export interface AttributeValue {
  id: string;
  value: string;
  sortOrder: number;
}

export interface Attribute extends BaseEntity {
  code: string;
  name: string;
  values: AttributeValue[];
}

export interface ItemGroup extends BaseEntity {
  code: string;
  name: string;
  attributeIds: string[];
  requiresGenderMatch?: boolean;
}

export interface PPEItem extends BaseEntity {
  itemCode: string;
  name: string;
  photoUrl?: string;
  category: string;
  itemGroupId: string;
  hasSize: boolean;
  gender: 'Male' | 'Female' | 'Unisex';
  lifespanType: 'Days' | 'Months' | 'Years';
  lifespanValue: number;
  description: string;
  manufacturer: string;
  model: string;
  standardCertification: string;
  riskCategory: 'I' | 'II' | 'III';
  reorderLevel: number;
  locationIds: string[]; // Valid locations for this item
  locationReorderLevels?: { locationId: string; reorderLevel: number }[]; // Reorder level per location (PPE-001)
  variantAttributeValueIds: string[]; // default variants if applicable
  unitId: string; // PPE-001 / PPE-051: reference to UnitOfMeasure.id
  serialTracked: boolean; // PPE-001 / PPE-057: locked after the first transaction (PPE-002)
}

// Epic 11: Units of Measure (PPE-051 to PPE-056)
export interface UnitOfMeasure extends BaseEntity {
  code: string; // unique (case-insensitive, trashed included), one word, immutable after save
  name: string; // English only (G13)
  symbol: string; // short, shown next to quantities
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Epic 12: Serial Numbers (PPE-057 to PPE-059)
export type SerialStatus = 'In Stock' | 'Issued' | 'On Loan' | 'Scrapped' | 'Written off';
export type SerialEventType = 'Stock in' | 'Transfer' | 'Issue' | 'Return' | 'Loan' | 'Loan return' | 'Scrap' | 'Write off';

export interface SerialUnit {
  id: string;
  ppeItemId: string;
  serial: string; // stored upper-case, unique per item
  status: SerialStatus;
  locationId?: string; // where the unit physically is (In Stock, or Scrapped at a Scrap location)
  lastLocationId: string; // last physical location, used for Store Keeper scoping when issued or on loan
  holderEmployeeId?: string; // when Issued
  holderName?: string; // borrower name when On Loan
  holderIssuanceId?: string; // issuance or loan that holds the unit
  batchNumber?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// Append-only: never edited, never purged.
export interface SerialEvent {
  id: string;
  serialUnitId: string;
  type: SerialEventType;
  date: string;
  userId: string;
  fromLocationId?: string;
  toLocationId?: string;
  reference?: string; // source document reference
  holderEmployeeId?: string;
  holderName?: string;
  note?: string;
}

export interface KitItem {
  id: string;
  ppeItemId: string;
  qty: number;
  variantKey?: string;
}

export interface Kit extends BaseEntity {
  name: string;
  jobPositionId: string;
  items: KitItem[];
}

export interface JobPosition extends BaseEntity {
  code: string;
  name: string;
}

export interface Employee extends BaseEntity {
  name: string;
  employeeCode: string;
  jobPositionId: string;
  role: Role;
  gender?: 'Male' | 'Female';
  status?: 'Active' | 'Terminated' | 'Transferred' | 'Inactive';
  department?: string;
  site?: string;
  supervisorId?: string; // For Direct Supervisor team scoping
}

export interface StockBalance {
  id: string; // surrogate key
  ppeItemId: string;
  locationId: string;
  variantKey?: string; // stringified attributes
  quantityOnHand: number;
  quarantinedOnHand?: number;
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
  variantKey?: string;
  batchNumber: string;
  quantityDelta: number;
  reasonCategory: string;
  reason: string;
  manufacturerExpiryDate?: string;
  supplierDeliveryNote?: string;
  destinationLocationId?: string; // Optional destination (e.g. Scrap location for damaged goods)
  serialNumbers?: string[]; // PPE-057: Stock IN of a tracked item (registered on apply)
  serialIds?: string[]; // PPE-058: Stock OUT of a tracked item (picked units)
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  submittedBy: string;
  reviewedBy?: string;
  createdAt: string;
}

export interface LoanLineItem {
  id: string;
  ppeItemId: string;
  quantity: number;
  returnedQty?: number;
  condition?: 'good' | 'damaged' | 'worn_out' | 'lost';
  status: 'open' | 'returned';
  serialIds?: string[]; // PPE-058: serial units on loan for a tracked item
  returnedSerialIds?: string[];
}

export interface Issuance {
  id: string;
  reference?: string;
  employeeId?: string; 
  holderName?: string; // for loan or visitor
  holderType?: string; // 'Employee' | 'Visitor' | 'Contractor'
  companyName?: string;
  contactNumber?: string;
  hostEmployeeId?: string;
  ppeItemId?: string;
  kitId?: string;
  locationId: string;
  quantity: number;
  batchNumber?: string;
  variantKey?: string; // size/color selection
  issueDate: string;
  expectedReturnDate?: string;
  expectedReplacementDate?: string; // Auto-calculated lifespan
  replacesIssuanceId?: string; // PPE-034 / PPE-040 link to replaced issuance
  storeKeeperSignature?: string; // data URI
  receiverSignature?: string; // data URI
  status: 'issued' | 'returned' | 'scrapped' | 'replaced' | 'partially_returned';
  issuedBy: string;
  isLoan?: boolean;
  isHistorical?: boolean;
  lines?: LoanLineItem[];
  serialIds?: string[]; // PPE-058: serial units issued on this issuance (tracked items)
  returnedSerialIds?: string[];
}

export interface IssuanceReturn {
  id: string;
  issuanceId: string;
  lineId?: string;
  quantity?: number;
  condition: 'good' | 'damaged' | 'worn_out' | 'lost';
  physicalReceiptConfirmed?: boolean;
  autoScrapped: boolean;
  storeKeeperSignature?: string;
  employeeSignature?: string;
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

export interface ModuleSettings {
  generalLeadTimeDays: number;
  categoryOverrides: { riskCategory: 'I' | 'II' | 'III'; leadTimeDays: number }[];
  recentIssuanceWindowDays: number;
  trashRetentionDays: number;
  siteLeadTimes: { site: string; leadTimeDays: number }[];
}

export type ExpirySettings = ModuleSettings;

export interface OpeningBalanceLine {
  id: string;
  ppeItemId: string;
  variantKey?: string;
  batchNumber: string;
  expiryDate?: string;
  quantity: number;
  costPerUnit?: number;
  serialNumbers?: string[]; // PPE-057: one per unit for a tracked item; quantity = serialNumbers.length
}

export interface OpeningBalance {
  id: string;
  reference?: string; // ADJ-OB-YYYY-NNNNN (PPE-024)
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
  variantKey?: string;
  quantity: number; // original quantity
  availableQty: number; // currently available
  quarantinedQty?: number;
  isQuarantined?: boolean;
  quarantineReason?: string;
  expiryDate: string;
  costPerUnit?: number;
  status: 'Active' | 'Depleted' | 'Recalled' | 'Scrapped';
  openingBalanceId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType?: 'OpeningBalance' | 'StockAdjustment' | 'Issuance' | 'Transfer' | 'Scrap' | 'Catalog' | 'Attribute' | 'ItemGroup' | 'Location' | 'Kit' | 'Settings';
  entityId?: string;
  action: string;
  details?: string;
  performedBy: string;
  timestamp: string;
  // Enhanced G1 fields:
  user?: string;
  objectType?: string;
  objectReference?: string;
  reason?: string;
  before?: any;
  after?: any;
}
