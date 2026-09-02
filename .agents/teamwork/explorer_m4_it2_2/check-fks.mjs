import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'"
  );
  console.log("All tables in SQLite:", tables.map((t) => t.name));

  for (const t of tables) {
    const fks = await prisma.$queryRawUnsafe(`PRAGMA foreign_key_list("${t.name}")`);
    for (const fk of fks) {
      if (fk.table === "Employee") {
        console.log(`FK to Employee: Table ${t.name} (column ${fk.from}) -> Employee(${fk.to}), on_delete: ${fk.on_delete}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
