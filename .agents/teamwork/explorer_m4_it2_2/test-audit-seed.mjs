import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testAuditLogSeed() {
  console.log("1. Creating dummy employee...");
  const emp = await prisma.employee.create({
    data: {
      id: "emp-test-audit",
      employeeCode: "EMP-TEST-AUDIT",
      name: "Audit Test User",
      role: "Admin",
      jobPositionId: "jp-1",
    },
  });

  console.log("2. Creating dummy audit log pointing to employee...");
  await prisma.auditLog.create({
    data: {
      id: "audit-test-1",
      entityType: "Test",
      entityId: "test-id",
      action: "CREATE",
      performedBy: emp.id,
    },
  });

  console.log("3. Now running seed.ts deletion order...");
  await prisma.auditLog.deleteMany();
  await prisma.issuanceReturn.deleteMany();
  await prisma.scrapEntry.deleteMany();
  await prisma.issuance.deleteMany();
  await prisma.kitItem.deleteMany();
  await prisma.kit.deleteMany();
  await prisma.pPEItemVariantValue.deleteMany();
  await prisma.pPEItemLocation.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockAdjustment.deleteMany();
  await prisma.stockBalance.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.openingBalanceLine.deleteMany();
  await prisma.openingBalance.deleteMany();
  await prisma.locationStoreKeeper.deleteMany();
  await prisma.pPEItem.deleteMany();
  await prisma.itemGroupAttribute.deleteMany();
  await prisma.itemGroup.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.location.deleteMany();
  await prisma.jobPosition.deleteMany();
  await prisma.expirySettings.deleteMany();
  await prisma.moduleSettings.deleteMany();

  console.log("SUCCESS! All tables cleaned cleanly!");
}

testAuditLogSeed().finally(() => prisma.$disconnect());
