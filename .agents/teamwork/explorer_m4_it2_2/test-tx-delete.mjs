import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testTransactionDelete() {
  console.log("Testing atomic transaction delete...");
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
  console.log("Transaction delete succeeded completely!");
}

testTransactionDelete().finally(() => prisma.$disconnect());
