import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function testDelete() {
  try {
    console.log("Current employee count:", await prisma.employee.count());
    console.log("Employees with supervisorId:", await prisma.employee.count({ where: { supervisorId: { not: null } } }));
    console.log("Audit logs count:", await prisma.auditLog.count());
    
    // Let's test deleteMany
    await prisma.auditLog.deleteMany();
    await prisma.employee.deleteMany();
    console.log("Delete succeeded without error!");
  } catch (err) {
    console.error("Delete failed with error:", err);
  }
}

testDelete().finally(() => prisma.$disconnect());
