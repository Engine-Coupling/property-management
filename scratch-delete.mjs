import { PrismaClient } from './node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const targetDate = new Date("2026-04-18T12:00:00.000Z");

  const deleted = await prisma.expense.deleteMany({
      where: { date: targetDate }
  });
  console.log(`Successfully deleted ${deleted.count} isolated global expense(s) on ${targetDate.toISOString()}`);
}

main().finally(() => prisma.$disconnect());
