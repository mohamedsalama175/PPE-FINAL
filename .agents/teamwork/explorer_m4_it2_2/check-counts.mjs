import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkCounts() {
  console.log("LocationStoreKeeper:", await prisma.locationStoreKeeper.count());
  console.log("StockMovement:", await prisma.stockMovement.count());
  console.log("StockAdjustment:", await prisma.stockAdjustment.count());
  console.log("OpeningBalance:", await prisma.openingBalance.count());
  console.log("Issuance:", await prisma.issuance.count());
  console.log("ScrapEntry:", await prisma.scrapEntry.count());
  console.log("AuditLog:", await prisma.auditLog.count());
  console.log("IssuanceReturn:", await prisma.issuanceReturn.count());
  console.log("Employee with supervisorId:", await prisma.employee.count({ where: { supervisorId: { not: null } } }));
}

checkCounts().finally(() => prisma.$disconnect());
