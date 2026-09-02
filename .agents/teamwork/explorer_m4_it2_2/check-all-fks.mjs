import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'"
  );

  for (const t of tables) {
    const fks = await prisma.$queryRawUnsafe(`PRAGMA foreign_key_list("${t.name}")`);
    for (const fk of fks) {
      console.log(`FK: ${t.name}.${fk.from} -> ${fk.table}.${fk.to} (on_delete: ${fk.on_delete})`);
    }
  }
}

main().finally(() => prisma.$disconnect());
