import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testFullDelete() {
  try {
    console.log("Starting step-by-step deletion exactly as prisma/seed.ts...");
    console.log("1. auditLog:", await prisma.auditLog.deleteMany());
    console.log("2. issuanceReturn:", await prisma.issuanceReturn.deleteMany());
    console.log("3. scrapEntry:", await prisma.scrapEntry.deleteMany());
    console.log("4. issuance:", await prisma.issuance.deleteMany());
    console.log("5. kitItem:", await prisma.kitItem.deleteMany());
    console.log("6. kit:", await prisma.kit.deleteMany());
    console.log("7. ppeItemVariantValue:", await prisma.pPEItemVariantValue.deleteMany());
    console.log("8. ppeItemLocation:", await prisma.pPEItemLocation.deleteMany());
    console.log("9. stockMovement:", await prisma.stockMovement.deleteMany());
    console.log("10. stockAdjustment:", await prisma.stockAdjustment.deleteMany());
    console.log("11. stockBalance:", await prisma.stockBalance.deleteMany());
    console.log("12. batch:", await prisma.batch.deleteMany());
    console.log("13. openingBalanceLine:", await prisma.openingBalanceLine.deleteMany());
    console.log("14. openingBalance:", await prisma.openingBalance.deleteMany());
    console.log("15. locationStoreKeeper:", await prisma.locationStoreKeeper.deleteMany());
    console.log("16. ppeItem:", await prisma.pPEItem.deleteMany());
    console.log("17. itemGroupAttribute:", await prisma.itemGroupAttribute.deleteMany());
    console.log("18. itemGroup:", await prisma.itemGroup.deleteMany());
    console.log("19. attributeValue:", await prisma.attributeValue.deleteMany());
    console.log("20. attribute:", await prisma.attribute.deleteMany());
    console.log("21. employee:", await prisma.employee.deleteMany());
    console.log("All deletions succeeded!");
  } catch (err) {
    console.error("Full delete failed at step:", err);
  }
}

testFullDelete().finally(() => prisma.$disconnect());
