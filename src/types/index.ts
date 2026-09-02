export type Role = 'Admin' | 'HSE Supervisor' | 'Direct Supervisor' | 'Store Keeper' | 'Employee';

export interface BaseEntity {
  id: string;
  active: boolean;
  deletedAt?: string | null;
}

export type LocationType = 'Central Warehouse' | 'Site Store' | 'Department Store' | 'General';
export type StockCondition = 'New' | 'Used' | 'Scrap';

export interface Location extends BaseEntity {
  code: string;
  nameEn: string;
  nameAr: string;
  site: string;
  locationType: LocationType;
  stockCondition: StockCondition;
  description: string;
  capacityUnits: number;
  address: string;
  assignedStoreKeeperIds: string[];
  openingBalanceStatus: 'Open' | 'Closed';
  hasHeldStock?: boolean;
}

export interface AttributeValue {
  id: string;
  valueEn: string;
  valueAr: string;
  sortOrder: number;
  active: boolean;
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
  assignedAttributeIds: string[];
  requiresGenderMatch: boolean;
}

export type RiskCategory = 'Category I' | 'Category II' | 'Category III';
export type LifespanUnit = 'Days' | 'Months' | 'Years';
export type UnitOfMeasure = 'Piece' | 'Pair' | 'Set' | 'Box' | string;

export interface PPEItem extends BaseEntity {
  itemCode: string;
  nameEn: string;
  nameAr: string;
  photoUrl?: string;
  category: string;
  itemGroupId: string;
  lifespanValue: number;
  lifespanUnit: LifespanUnit;
  uom: UnitOfMeasure;
  descriptionEn: string;
  descriptionAr: string;
  manufacturer: string;
  model: string;
  standardCertification: string;
  riskCategory: RiskCategory;
  reorderLevels: Record<string, number>; // locationId -> reorder level
  locationIds: string[]; // Assigned active non-scrap locations
  assignedLocationIds?: string[]; // Alias for locationIds
  itemCodeLocked?: boolean;
}

export interface KitItem {
  id: string;
  ppeItemId: string;
  quantity: number;
  qty?: number;
  defaultVariant?: any;
}

export interface Kit extends BaseEntity {
  nameEn: string;
  nameAr: string;
  jobPositionId: string;
  jobPosition?: string;
  items: KitItem[];
  lineItems?: any[];
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
  jobPosition?: string;
  role: Role;
  email?: string;
  photoUrl?: string;
  site?: string;
  department?: string;
  status?: 'Active' | 'Terminated' | 'Transferred';
  gender?: 'Male' | 'Female';
  supervisorId?: string;
  lastReceivedSizes?: any;
}

export interface Batch {
  id: string;
  batchNumber: string;
  ppeItemId: string;
  locationId: string;
  variantKey?: string; // e.g. "SIZE:L|COLOR:Yellow|GENDER:Male"
  quantity: number; // On Hand quantity
  availableQty: number; // On Hand - Quarantined
  quarantinedQty: number;
  condition: 'New' | 'Reused' | 'Scrapped';
  expiryDate?: string;
  manufacturerExpiryDate?: string;
  costPerUnit?: number;
  supplierDeliveryNote?: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Quarantined' | 'Depleted';
  openingBalanceId?: string;
  createdAt: string;
}

export interface StockBalance {
  id: string;
  ppeItemId: string;
  locationId: string;
  quantityOnHand: number;
  quarantinedQuantity: number;
  availableQuantity: number;
}

export interface StockMovement {
  id: string;
  type: 'in' | 'out' | 'transfer' | 'adjustment' | 'opening' | 'quarantine' | 'release_quarantine';
  ppeItemId: string;
  locationId: string;
  toLocationId?: string;
  batchNumber?: string;
  variantKey?: string;
  quantity: number;
  reason: string;
  reference: string;
  createdBy: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  reference: string; // ADJ-OB-YYYY-NNNNN, ADJ-IN-YYYY-NNNNN, ADJ-OUT-YYYY-NNNNN
  type: 'OB' | 'IN' | 'OUT';
  ppeItemId: string;
  locationId: string;
  batchNumber: string;
  variantKey?: string;
  quantityDelta: number;
  reasonCategory: string;
  reasonDetail: string;
  quarantineReason?: string;
  manufacturerExpiryDate?: string;
  supplierDeliveryNote?: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  submittedBy: string;
  reviewedBy?: string;
  createdAt: string;
}

export interface Issuance {
  id: string;
  reference: string; // ISS-YYYY-NNNNN
  employeeId?: string;
  holderName?: string;
  holderType?: 'Employee' | 'Visitor' | 'Contractor';
  ppeItemId?: string;
  kitId?: string;
  locationId: string;
  quantity: number;
  batchNumber?: string;
  variantKey?: string;
  conditionAtIssue: 'New' | 'Reused';
  issueDate: string;
  expectedReplacementDate?: string;
  expectedReturnDate?: string;
  replacesIssuanceId?: string;
  storeKeeperSignature?: string; // base64 data url
  receiverSignature?: string; // base64 data url
  isImported?: boolean;
  imported?: boolean;
  status: 'issued' | 'returned' | 'scrapped' | 'lost';
  issuedBy: string;
  createdAt: string;
}

export interface IssuanceReturn {
  id: string;
  issuanceId: string;
  quantityReturned: number;
  condition: 'good' | 'damaged' | 'worn_out' | 'lost';
  physicalReceiptConfirmed?: boolean;
  returnedToLocationId?: string;
  storeKeeperSignature?: string;
  receiverSignature?: string;
  returnedBy: string;
  returnDate: string;
}

export interface VisitorLoanItem {
  id: string;
  ppeItemId: string;
  variantKey?: string;
  batchNumber: string;
  quantity: number;
  returnedQuantity: number;
  fromLocationId: string;
  conditionOnReturn?: 'good' | 'damaged' | 'lost';
  status?: 'Open' | 'Returned' | 'Damaged' | 'Lost';
}

export interface VisitorLoan {
  id: string;
  loanNumber: string; // LN-YYYY-NNNNN
  recipientName: string;
  recipientCompany: string;
  hostEmployeeId: string;
  issueDate: string;
  expectedReturnDate: string;
  fromLocationId: string;
  status: 'Open' | 'Overdue' | 'Partially Returned' | 'Closed';
  items: VisitorLoanItem[];
  storeKeeperSignature?: string;
  recipientSignature?: string;
  receiverSignature?: string;
  issuedBy: string;
  createdAt: string;
}

export interface ScrapEntry {
  id: string;
  ppeItemId: string;
  locationId: string;
  batchNumber?: string;
  quantity: number;
  reason: string;
  relatedReferenceId?: string;
  reversed: boolean;
  reversedBy?: string;
  reversedAt?: string;
  reversalReason?: string;
  scrappedBy: string;
  createdAt: string;
}

export interface OpeningBalanceLine {
  id: string;
  ppeItemId: string;
  variantKey?: string;
  batchNumber: string;
  expiryDate?: string;
  manufacturerExpiryDate?: string;
  quantity: number;
  costPerUnit?: number;
}

export interface OpeningBalance {
  id: string;
  reference: string; // ADJ-OB-YYYY-NNNNN
  locationId: string;
  referenceDate: string;
  notes?: string;
  status: 'Draft' | 'Approved';
  preparedBy: string;
  lines: OpeningBalanceLine[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestampUTC: string;
  user: string;
  role: Role;
  objectType: 'Item' | 'Attribute' | 'ItemGroup' | 'Location' | 'Kit' | 'Issuance' | 'Loan' | 'Stock' | 'Settings' | 'StoreKeeperAssignment' | string;
  objectReference: string;
  action: string;
  beforeValues: any;
  afterValues: any;
  reason?: string;
  source: 'Screen' | 'Import' | 'System Job';
  retentionFlag: '7_YEARS';
}

export interface TrashItem {
  id: string;
  entityType: 'Item' | 'Attribute' | 'ItemGroup' | 'Location' | 'Kit';
  originalId: string;
  code: string;
  nameEn: string;
  nameAr: string;
  deletedBy: string;
  deletedAt: string;
  reason: string;
  hasHistory: boolean;
  daysInTrash: number;
  data: any;
}

export interface InAppNotification {
  id: string;
  type: 'low_stock' | 'replacement_reminder' | 'overdue_loan' | 'approval_request' | 'approval_decision' | 'trash_purge_warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'critical' | 'warning' | 'info';
  linkTo?: string;
}

export interface ModuleSettings {
  reminderLeadTimePerSite: Record<string, number>; // Site -> days (1 - 90, default 14)
  recentIssuanceWindowDays: number; // default 90
  trashRetentionDays: number; // default 90, min 30
}
