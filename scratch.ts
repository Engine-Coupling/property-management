import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.monthlyReport.findMany({
    include: { property: true }
  });
  console.log("Total Reports in DB:", reports.length);
  const apt101 = reports.filter(r => r.property.name.includes("101"));
  if (apt101.length === 0) {
      console.log("NO reports for 101 found.");
  } else {
      for (const r of apt101) {
          console.log(`Report 101: Date=${r.reportDate.toISOString()} | Rent=${r.totalRent} | Payout=${r.payout}`);
      }
  }

  const allBatches = new Set(reports.map(r => r.reportDate.toISOString()));
  console.log("Existing Batch Dates:");
  console.log(Array.from(allBatches).join("\n"));
}

main().catch(console.error).finally(() => prisma.$disconnect());
