import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  mockJobPositions,
  mockLocations,
  mockAttributes,
  mockItemGroups,
  mockPPEItems,
  mockKits,
  mockEmployees,
  mockStockBalances,
  mockIssuances,
  mockIssuanceReturns,
  mockStockAdjustments,
  mockScrapEntries,
  mockModuleSettings,
  mockOpeningBalances,
  mockBatches,
  mockAuditLogs,
} from "../src/store/mockData.js";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing
  // Delete in reverse dependency order within an atomic transaction
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.issuanceReturn.deleteMany(),
    prisma.scrapEntry.deleteMany(),
    prisma.issuance.deleteMany(),
    prisma.kitItem.deleteMany(),
    prisma.kit.deleteMany(),
    prisma.pPEItemVariantValue.deleteMany(),
    prisma.pPEItemLocation.deleteMany(),
    prisma.stockMovement.deleteMany(),
    prisma.stockAdjustment.deleteMany(),
    prisma.stockBalance.deleteMany(),
    prisma.batch.deleteMany(),
    prisma.openingBalanceLine.deleteMany(),
    prisma.openingBalance.deleteMany(),
    prisma.locationStoreKeeper.deleteMany(),
    prisma.pPEItem.deleteMany(),
    prisma.itemGroupAttribute.deleteMany(),
    prisma.itemGroup.deleteMany(),
    prisma.attributeValue.deleteMany(),
    prisma.attribute.deleteMany(),
    prisma.employee.updateMany({ data: { supervisorId: null } }),
    prisma.employee.deleteMany(),
    prisma.location.deleteMany(),
    prisma.jobPosition.deleteMany(),
    prisma.expirySettings.deleteMany(),
    prisma.moduleSettings.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);

  // JobPositions
  for (const jp of mockJobPositions) {
    await prisma.jobPosition.create({
      data: { id: jp.id, code: jp.code, nameEn: jp.nameEn, nameAr: jp.nameAr, active: jp.active },
    });
  }
  console.log(`Seeded ${mockJobPositions.length} job positions`);

  // Locations
  for (const loc of mockLocations) {
    await prisma.location.create({
      data: {
        id: loc.id,
        code: loc.code,
        nameEn: loc.nameEn,
        nameAr: loc.nameAr,
        site: loc.site,
        locationType: loc.locationType.replace(" ", "_") as any,
        stockCondition: (loc as any).stockCondition || "New",
        openingBalanceStatus: (loc as any).openingBalanceStatus || "Open",
        description: loc.description,
        capacityUnits: loc.capacityUnits,
        address: loc.address,
        active: (loc as any).active ?? true,
      },
    });
  }
  console.log(`Seeded ${mockLocations.length} locations`);

  // Employees (first pass: without supervisorId to satisfy foreign key self-relation)
  for (const emp of mockEmployees) {
    await prisma.employee.create({
      data: {
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.name,
        gender: (emp as any).gender || "Male",
        employmentStatus: (emp as any).status || "Active",
        department: (emp as any).department || "",
        site: (emp as any).site || "",
        jobPositionId: emp.jobPositionId,
        role: (emp.role as string).replace(" ", "_") as any,
        passwordHash,
        active: emp.active,
      },
    });
  }
  // Second pass: establish supervisor hierarchy
  for (const emp of mockEmployees) {
    if ((emp as any).supervisorId) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { supervisorId: (emp as any).supervisorId },
      });
    }
  }
  console.log(`Seeded ${mockEmployees.length} employees with supervisor hierarchy (password: password123)`);

  // LocationStoreKeeper links (after employees)
  for (const loc of mockLocations) {
    for (const keeperId of (loc as any).assignedStoreKeeperIds || []) {
      try {
        await prisma.locationStoreKeeper.create({ data: { locationId: loc.id, employeeId: keeperId } });
      } catch {}
    }
  }

  // Attributes
  for (const attr of mockAttributes) {
    await prisma.attribute.create({
      data: { id: attr.id, code: attr.code, nameEn: attr.nameEn, nameAr: attr.nameAr, active: attr.active },
    });
    for (const val of attr.values) {
      await prisma.attributeValue.create({
        data: { id: val.id, attributeId: attr.id, value: val.valueEn || (val as any).value || "", sortOrder: val.sortOrder },
      });
    }
  }
  console.log(`Seeded ${mockAttributes.length} attributes`);

  // ItemGroups
  for (const ig of mockItemGroups) {
    await prisma.itemGroup.create({
      data: {
        id: ig.id,
        code: ig.code,
        nameEn: ig.nameEn,
        nameAr: ig.nameAr,
        requiresGenderMatch: (ig as any).requiresGenderMatch ?? false,
        active: ig.active,
      },
    });
    for (const aid of (ig as any).assignedAttributeIds || (ig as any).attributeIds || []) {
      try {
        await prisma.itemGroupAttribute.create({ data: { itemGroupId: ig.id, attributeId: aid } });
      } catch {}
    }
  }
  console.log(`Seeded ${mockItemGroups.length} item groups`);

  // PPE Items
  for (const ppe of mockPPEItems) {
    await prisma.pPEItem.create({
      data: {
        id: ppe.id,
        itemCode: ppe.itemCode,
        nameEn: ppe.nameEn,
        nameAr: ppe.nameAr,
        category: ppe.category,
        itemGroupId: ppe.itemGroupId,
        hasSize: (ppe as any).hasSize ?? false,
        gender: ((ppe as any).gender as any) || "Unisex",
        lifespanType: ppe.lifespanUnit || "Months",
        lifespanValue: ppe.lifespanValue,
        descriptionEn: ppe.descriptionEn || "",
        descriptionAr: ppe.descriptionAr || "",
        manufacturer: ppe.manufacturer || "",
        model: ppe.model || "",
        standardCertification: ppe.standardCertification || "",
        riskCategory: ppe.riskCategory.replace("Category ", "") as any,
        reorderLevel: typeof ppe.reorderLevels === "object" ? Object.values(ppe.reorderLevels)[0] || 0 : (ppe as any).reorderLevel || 0,
        uom: ppe.uom,
        active: ppe.active,
      },
    });
    for (const locId of ppe.locationIds || []) {
      try {
        await prisma.pPEItemLocation.create({ data: { ppeItemId: ppe.id, locationId: locId } });
      } catch {}
    }
    for (const valId of (ppe as any).variantAttributeValueIds || []) {
      try {
        await prisma.pPEItemVariantValue.create({ data: { ppeItemId: ppe.id, attributeValueId: valId } });
      } catch {}
    }
  }
  console.log(`Seeded ${mockPPEItems.length} PPE items`);

  // Kits
  for (const kit of mockKits) {
    await prisma.kit.create({
      data: { id: kit.id, nameEn: kit.nameEn, nameAr: kit.nameAr, jobPositionId: kit.jobPositionId, active: kit.active },
    });
    for (const ki of kit.items) {
      await prisma.kitItem.create({
        data: { id: ki.id, kitId: kit.id, ppeItemId: ki.ppeItemId, qty: ki.qty || ki.quantity || 1, variantKey: (ki as any).variantKey || null },
      });
    }
  }
  console.log(`Seeded ${mockKits.length} kits`);

  // Stock Balances
  for (const sb of mockStockBalances) {
    await prisma.stockBalance.create({
      data: {
        id: sb.id,
        ppeItemId: sb.ppeItemId,
        locationId: sb.locationId,
        quantityOnHand: sb.quantityOnHand,
        quarantinedQuantity: (sb as any).quarantinedQuantity || 0,
        variantKey: (sb as any).variantKey || null,
      },
    });
  }
  console.log(`Seeded ${mockStockBalances.length} stock balances`);

  // Opening Balances + lines
  for (const ob of mockOpeningBalances as any[]) {
    await prisma.openingBalance.create({
      data: {
        id: ob.id,
        locationId: ob.locationId,
        referenceDate: new Date(ob.referenceDate),
        notes: ob.notes,
        status: ob.status.replace(" ", "_") as any,
        preparedBy: ob.preparedBy,
        approvedBy: ob.approvedBy || null,
        approvedAt: ob.approvedAt ? new Date(ob.approvedAt) : null,
        createdAt: new Date(ob.createdAt),
      },
    });
    for (const line of ob.lines) {
      await prisma.openingBalanceLine.create({
        data: {
          id: line.id,
          openingBalanceId: ob.id,
          ppeItemId: line.ppeItemId,
          batchNumber: line.batchNumber,
          expiryDate: new Date(line.expiryDate),
          quantity: line.quantity,
          costPerUnit: line.costPerUnit ?? null,
        },
      });
    }
  }
  console.log(`Seeded ${mockOpeningBalances.length} opening balances`);

  // Batches
  for (const b of mockBatches as any[]) {
    await prisma.batch.create({
      data: {
        id: b.id,
        batchNumber: b.batchNumber,
        ppeItemId: b.ppeItemId,
        locationId: b.locationId,
        quantity: b.quantity,
        availableQty: b.availableQty,
        quarantinedQty: b.quarantinedQty || 0,
        condition: b.condition || "New",
        expiryDate: b.expiryDate ? new Date(b.expiryDate) : null,
        manufacturerExpiryDate: b.manufacturerExpiryDate ? new Date(b.manufacturerExpiryDate) : null,
        costPerUnit: b.costPerUnit ?? null,
        status: b.status as any,
        openingBalanceId: b.openingBalanceId || null,
        createdAt: new Date(b.createdAt),
      },
    });
  }
  console.log(`Seeded ${mockBatches.length} batches`);

  // Stock Adjustments
  for (const adj of mockStockAdjustments as any[]) {
    await prisma.stockAdjustment.create({
      data: {
        id: adj.id,
        reference: adj.reference,
        type: adj.type as any,
        ppeItemId: adj.ppeItemId,
        locationId: adj.locationId,
        batchNumber: adj.batchNumber,
        quantityDelta: adj.quantityDelta,
        reasonCategory: adj.reasonCategory,
        reason: adj.reasonDetail || adj.reason || "",
        status: adj.status as any,
        submittedBy: adj.submittedBy,
        reviewedBy: adj.reviewedBy || null,
        createdAt: new Date(adj.createdAt),
      },
    });
  }
  console.log(`Seeded ${mockStockAdjustments.length} adjustments`);

  // Issuances
  for (const iss of mockIssuances as any[]) {
    await prisma.issuance.create({
      data: {
        id: iss.id,
        employeeId: iss.employeeId || null,
        holderName: iss.holderName || null,
        holderType: iss.holderType || null,
        ppeItemId: iss.ppeItemId || null,
        kitId: iss.kitId || null,
        locationId: iss.locationId,
        quantity: iss.quantity,
        batchNumber: iss.batchNumber || null,
        variantKey: iss.variantKey || null,
        issueDate: new Date(iss.issueDate),
        expectedReturnDate: iss.expectedReturnDate ? new Date(iss.expectedReturnDate) : null,
        expectedReplacementDate: iss.expectedReplacementDate ? new Date(iss.expectedReplacementDate) : null,
        storeKeeperSignature: iss.storeKeeperSignature || null,
        receiverSignature: iss.receiverSignature || null,
        status: iss.status as any,
        issuedBy: iss.issuedBy === "SYSTEM_IMPORT" ? "emp-1" : (iss.issuedBy || "emp-1"),
      },
    });
  }
  console.log(`Seeded ${mockIssuances.length} issuances`);

  for (const ret of mockIssuanceReturns as any[]) {
    await prisma.issuanceReturn.create({
      data: {
        id: ret.id,
        issuanceId: ret.issuanceId,
        quantityReturned: ret.quantityReturned || 1,
        condition: ret.condition as any,
        physicalReceiptConfirmed: ret.physicalReceiptConfirmed ?? false,
        autoScrapped: (ret as any).autoScrapped ?? false,
        returnedToLocationId: ret.returnedToLocationId || null,
        storeKeeperSignature: ret.storeKeeperSignature || null,
        returnerSignature: (ret as any).receiverSignature || ret.returnerSignature || null,
        returnedBy: ret.returnedBy,
        returnDate: new Date(ret.returnDate),
      },
    });
  }
  console.log(`Seeded ${mockIssuanceReturns.length} returns`);

  // Scrap
  for (const scr of mockScrapEntries as any[]) {
    await prisma.scrapEntry.create({
      data: {
        id: scr.id,
        ppeItemId: scr.ppeItemId,
        locationId: scr.locationId,
        batchNumber: scr.batchNumber || null,
        quantity: scr.quantity,
        reason: scr.reason,
        relatedReferenceId: scr.relatedReferenceId || null,
        reversed: scr.reversed,
        reversedBy: scr.reversedBy || null,
        reversedAt: scr.reversedAt ? new Date(scr.reversedAt) : null,
        reversalReason: (scr as any).reversalReason || null,
        scrappedBy: scr.scrappedBy,
        createdAt: new Date(scr.createdAt),
      },
    });
  }
  console.log(`Seeded ${mockScrapEntries.length} scrap entries`);

  // Audit Logs
  for (const log of mockAuditLogs as any[]) {
    await prisma.auditLog.create({
      data: {
        id: log.id,
        entityType: log.objectType || "System",
        entityId: log.objectReference || "INITIAL",
        action: log.action,
        details: log.reason || null,
        beforeValues: log.beforeValues ? JSON.stringify(log.beforeValues) : null,
        afterValues: log.afterValues ? JSON.stringify(log.afterValues) : null,
        reason: log.reason || null,
        source: log.source || "Screen",
        retentionFlag: log.retentionFlag || "7_YEARS",
        performedBy: "emp-1",
        timestamp: new Date(log.timestampUTC || Date.now()),
      },
    });
  }
  console.log(`Seeded ${mockAuditLogs.length} audit logs`);

  // Expiry Settings
  await prisma.expirySettings.create({
    data: {
      generalLeadTimeDays: 30,
      categoryILeadTimeDays: 15,
      categoryIILeadTimeDays: 30,
      categoryIIILeadTimeDays: 60,
    },
  });
  console.log("Seeded expiry settings");

  // Module Settings
  await prisma.moduleSettings.create({
    data: {
      reminderLeadTimePerSite: JSON.stringify(mockModuleSettings.reminderLeadTimePerSite),
      recentIssuanceWindowDays: mockModuleSettings.recentIssuanceWindowDays,
      trashRetentionDays: mockModuleSettings.trashRetentionDays,
    },
  });
  console.log("Seeded module settings");

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
