import { z } from "zod";

export const jobPositionSchema = z.object({
  code: z.string().min(1).max(50),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  active: z.boolean().optional(),
});

export const locationSchema = z.object({
  code: z.string().min(1).max(50),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  site: z.string().min(1),
  locationType: z.enum(["Central Warehouse", "Site Store", "Department Store", "Scrap", "Used", "General", "Central_Warehouse", "Site_Store", "Department_Store"]),
  stockCondition: z.enum(["New", "Used", "Scrap"]).optional().default("New"),
  openingBalanceStatus: z.enum(["Open", "Closed"]).optional().default("Open"),
  description: z.string().optional().default(""),
  capacityUnits: z.coerce.number().int().min(0).optional().default(0),
  address: z.string().optional().default(""),
  active: z.boolean().optional(),
  assignedStoreKeeperIds: z.array(z.string()).optional().default([]),
  adminOverrideReason: z.string().optional(),
});

export const attributeValueSchema = z.object({
  id: z.string().optional().nullable(),
  value: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0),
});

export const attributeSchema = z.object({
  code: z.string().min(1).max(50),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  active: z.boolean().optional(),
  values: z.array(attributeValueSchema).min(1, "At least one attribute value is required"),
  adminOverrideReason: z.string().optional(),
});

export const itemGroupSchema = z.object({
  code: z.string().min(1).max(50),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  requiresGenderMatch: z.boolean().optional().default(false),
  active: z.boolean().optional(),
  attributeIds: z.array(z.string()).optional().default([]),
  adminOverrideReason: z.string().optional(),
});

export const ppeItemSchema = z.object({
  itemCode: z.string().min(1).max(50),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  photoUrl: z.string().optional().nullable(),
  category: z.string().min(1),
  itemGroupId: z.string().min(1),
  hasSize: z.boolean().optional().default(false),
  gender: z.enum(["Male", "Female", "Unisex"]),
  lifespanType: z.enum(["Days", "Months", "Years"]),
  lifespanValue: z.coerce.number().int().min(1),
  descriptionEn: z.string().optional().default(""),
  descriptionAr: z.string().optional().default(""),
  manufacturer: z.string().optional().default(""),
  model: z.string().optional().default(""),
  standardCertification: z.string().optional().default(""),
  riskCategory: z.enum(["I", "II", "III"]),
  reorderLevel: z.coerce.number().int().min(0),
  locationIds: z.array(z.string()).min(1),
  variantAttributeValueIds: z.array(z.string()).optional().default([]),
  uom: z.string().min(1),
  active: z.boolean().optional(),
  adminOverrideReason: z.string().optional(),
});

export const kitItemSchema = z.object({
  ppeItemId: z.string().min(1),
  qty: z.coerce.number().int().min(1),
  variantKey: z.string().optional().nullable(),
});

export const kitSchema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  jobPositionId: z.string().min(1),
  active: z.boolean().optional(),
  items: z.array(kitItemSchema).min(1),
  adminOverrideReason: z.string().optional(),
});

export const employeeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  jobPositionId: z.string().min(1).optional(),
  role: z.enum(["Admin", "HSE Supervisor", "Direct Supervisor", "Store Keeper", "Employee", "HSE_Supervisor", "Direct_Supervisor", "Store_Keeper"]).optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  employmentStatus: z.enum(["Active", "Terminated", "Transferred"]).optional(),
  supervisorId: z.string().optional().nullable(),
  department: z.string().optional(),
  site: z.string().optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export const stockAdjustmentSchema = z.object({
  ppeItemId: z.string().min(1),
  locationId: z.string().min(1),
  batchNumber: z.string().min(1).max(50),
  quantityDelta: z.coerce.number().int(), // positive for IN, negative for OUT handled via type
  type: z.enum(["IN", "OUT"]),
  reasonCategory: z.string().min(1),
  reason: z.string().min(10),
}).refine((data) => data.quantityDelta !== 0, {
  message: "Quantity delta cannot be zero",
  path: ["quantityDelta"],
}).refine((data) => {
  if (data.type === "IN" && data.quantityDelta <= 0) return false;
  return true;
}, {
  message: "Stock IN quantity must be positive",
  path: ["quantityDelta"],
});

export const stockAdjustmentReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const transferSchema = z.object({
  ppeItemId: z.string().min(1),
  fromLocationId: z.string().min(1),
  toLocationId: z.string().min(1),
  batchNumber: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

export const openingBalanceLineSchema = z.object({
  ppeItemId: z.string().min(1),
  batchNumber: z.string().min(1).max(50),
  expiryDate: z.coerce.date(),
  quantity: z.coerce.number().int().min(1),
  costPerUnit: z.coerce.number().min(0).optional().nullable(),
});

export const openingBalanceSchema = z.object({
  locationId: z.string().min(1),
  referenceDate: z.coerce.date(),
  notes: z.string().optional().nullable(),
  status: z.enum(["Draft", "Pending Approval", "Approved", "Rejected", "Pending_Approval"]).optional(),
  lines: z.array(openingBalanceLineSchema).min(1),
});

export const issuanceSchema = z.object({
  employeeId: z.string().optional().nullable(),
  holderName: z.string().optional().nullable(),
  holderType: z.string().optional().nullable(),
  ppeItemId: z.string().optional().nullable(),
  kitId: z.string().optional().nullable(),
  locationId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  batchNumber: z.string().optional().nullable(),
  variantKey: z.string().optional().nullable(),
  issueDate: z.coerce.date().optional(),
  expectedReturnDate: z.coerce.date().optional().nullable(),
  expectedReplacementDate: z.coerce.date().optional().nullable(),
  storeKeeperSignature: z.string().optional().nullable(),
  receiverSignature: z.string().optional().nullable(),
});

export const issuanceReturnSchema = z.object({
  condition: z.enum(["good", "damaged", "worn_out", "lost"]),
  physicalReceiptConfirmed: z.boolean().optional().default(false),
});

export const scrapReverseSchema = z.object({
  reason: z.string().min(10),
});

export const expirySettingsSchema = z.object({
  generalLeadTimeDays: z.coerce.number().int().min(1),
  categoryILeadTimeDays: z.coerce.number().int().min(1),
  categoryIILeadTimeDays: z.coerce.number().int().min(1),
  categoryIIILeadTimeDays: z.coerce.number().int().min(1),
});
