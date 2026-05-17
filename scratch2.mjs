import { PrismaClient } from './node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
  });
  console.log("=== LATEST EXPENSES ===");
  for (const e of expenses) {
      if (e.amount === 100000) {
          console.log(`[TARGET] Date: ${e.date.toISOString()} | Desc: ${e.description} | Amount: ${e.amount} | ID: ${e.id}`);
      } else {
          console.log(`Normal -> Date: ${e.date.toISOString()} | Desc: ${e.description} | Amount: ${e.amount} | ID: ${e.id}`);
      }
  }
}
main().finally(() => prisma.$disconnect());
