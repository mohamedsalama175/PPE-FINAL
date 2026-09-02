-- CreateTable
CREATE TABLE "JobPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "capacityUnits" INTEGER NOT NULL DEFAULT 0,
    "address" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LocationStoreKeeper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LocationStoreKeeper_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LocationStoreKeeper_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attribute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AttributeValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "attributeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ItemGroupAttribute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemGroupId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    CONSTRAINT "ItemGroupAttribute_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemGroupAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PPEItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemCode" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "photoUrl" TEXT,
    "category" TEXT NOT NULL,
    "itemGroupId" TEXT NOT NULL,
    "hasSize" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT NOT NULL,
    "lifespanType" TEXT NOT NULL,
    "lifespanValue" INTEGER NOT NULL,
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "manufacturer" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "standardCertification" TEXT NOT NULL DEFAULT '',
    "riskCategory" TEXT NOT NULL,
    "reorderLevel" INTEGER NOT NULL,
    "uom" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PPEItem_itemGroupId_fkey" FOREIGN KEY ("itemGroupId") REFERENCES "ItemGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PPEItemLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ppeItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    CONSTRAINT "PPEItemLocation_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "PPEItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PPEItemLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PPEItemVariantValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ppeItemId" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,
    CONSTRAINT "PPEItemVariantValue_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "PPEItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PPEItemVariantValue_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "AttributeValue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "jobPositionId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kit_jobPositionId_fkey" FOREIGN KEY ("jobPositionId") REFERENCES "JobPosition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KitItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kitId" TEXT NOT NULL,
    "ppeItemId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "variantKey" TEXT,
    CONSTRAINT "KitItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KitItem_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "PPEItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobPositionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_jobPositionId_fkey" FOREIGN KEY ("jobPositionId") REFERENCES "JobPosition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ppeItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "variantKey" TEXT,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockBalance_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "PPEItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockBalance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchNumber" TEXT NOT NULL,
    "ppeItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "availableQty" INTEGER NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "costPerUnit" REAL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "openingBalanceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Batch_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "PPEItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Batch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Batch_openingBalanceId_fkey" FOREIGN KEY ("openingBalanceId") REFERENCES "OpeningBalance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "ppeItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "toLocationId" TEXT,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "approvedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "PPEItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ppeItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "reasonCategory" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockAdjustment_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "PPEItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockAdjustment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockAdjustment_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockAdjustment_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpeningBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "locationId" TEXT NOT NULL,
    "referenceDate" DATETIME NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "preparedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OpeningBalance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpeningBalance_preparedBy_fkey" FOREIGN KEY ("preparedBy") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OpeningBalance_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpeningBalanceLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openingBalanceId" TEXT NOT NULL,
    "ppeItemId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costPerUnit" REAL,
    CONSTRAINT "OpeningBalanceLine_openingBalanceId_fkey" FOREIGN KEY ("openingBalanceId") REFERENCES "OpeningBalance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OpeningBalanceLine_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "PPEItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Issuance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT,
    "holderName" TEXT,
    "holderType" TEXT,
    "ppeItemId" TEXT,
    "kitId" TEXT,
    "locationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "batchNumber" TEXT,
    "variantKey" TEXT,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" DATETIME,
    "expectedReplacementDate" DATETIME,
    "storeKeeperSignature" TEXT,
    "receiverSignature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "issuedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Issuance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issuance_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "PPEItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issuance_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issuance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issuance_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IssuanceReturn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issuanceId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "physicalReceiptConfirmed" BOOLEAN DEFAULT false,
    "autoScrapped" BOOLEAN NOT NULL DEFAULT false,
    "returnedBy" TEXT NOT NULL,
    "returnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IssuanceReturn_issuanceId_fkey" FOREIGN KEY ("issuanceId") REFERENCES "Issuance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "IssuanceReturn_returnedBy_fkey" FOREIGN KEY ("returnedBy") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScrapEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ppeItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "batchNumber" TEXT,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "relatedReferenceId" TEXT,
    "reversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedBy" TEXT,
    "reversedAt" DATETIME,
    "reversalReason" TEXT,
    "scrappedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScrapEntry_ppeItemId_fkey" FOREIGN KEY ("ppeItemId") REFERENCES "PPEItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScrapEntry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScrapEntry_relatedReferenceId_fkey" FOREIGN KEY ("relatedReferenceId") REFERENCES "Issuance" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScrapEntry_scrappedBy_fkey" FOREIGN KEY ("scrappedBy") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpirySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generalLeadTimeDays" INTEGER NOT NULL DEFAULT 30,
    "categoryILeadTimeDays" INTEGER NOT NULL DEFAULT 15,
    "categoryIILeadTimeDays" INTEGER NOT NULL DEFAULT 30,
    "categoryIIILeadTimeDays" INTEGER NOT NULL DEFAULT 60,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "performedBy" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "JobPosition_code_key" ON "JobPosition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LocationStoreKeeper_locationId_employeeId_key" ON "LocationStoreKeeper"("locationId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_code_key" ON "Attribute"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_attributeId_value_key" ON "AttributeValue"("attributeId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "ItemGroup_code_key" ON "ItemGroup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ItemGroupAttribute_itemGroupId_attributeId_key" ON "ItemGroupAttribute"("itemGroupId", "attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "PPEItem_itemCode_key" ON "PPEItem"("itemCode");

-- CreateIndex
CREATE UNIQUE INDEX "PPEItemLocation_ppeItemId_locationId_key" ON "PPEItemLocation"("ppeItemId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "PPEItemVariantValue_ppeItemId_attributeValueId_key" ON "PPEItemVariantValue"("ppeItemId", "attributeValueId");

-- CreateIndex
CREATE UNIQUE INDEX "KitItem_kitId_ppeItemId_key" ON "KitItem"("kitId", "ppeItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "StockBalance_ppeItemId_locationId_variantKey_key" ON "StockBalance"("ppeItemId", "locationId", "variantKey");

-- CreateIndex
CREATE INDEX "Batch_ppeItemId_locationId_status_idx" ON "Batch"("ppeItemId", "locationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNumber_ppeItemId_locationId_key" ON "Batch"("batchNumber", "ppeItemId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_reference_key" ON "StockMovement"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "StockAdjustment_reference_key" ON "StockAdjustment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "OpeningBalanceLine_openingBalanceId_ppeItemId_batchNumber_key" ON "OpeningBalanceLine"("openingBalanceId", "ppeItemId", "batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "IssuanceReturn_issuanceId_key" ON "IssuanceReturn"("issuanceId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
