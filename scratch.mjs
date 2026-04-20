import { PrismaClient } from './node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.monthlyReport.findMany({
    include: { property: true }
  });
  console.log("=== DB SUMMARY ===");
  console.log("Total Reports:", reports.length);
  const rep101 = reports.filter(r => r.property.name.includes("101"));
  console.log("Reports for 101:");
  for (const r of rep101) {
    if (r.payout === 148166 || r.totalRent === 148166) {
        console.log(`BINGO -> Date: ${r.reportDate.toISOString()} | Start: ${r.startDate.toISOString()} | End: ${r.endDate.toISOString()} | Rent: ${r.totalRent} | Payout: ${r.payout} | ID: ${r.id}`);
    } else {
        console.log(`Normal -> Date: ${r.reportDate.toISOString()} | Rent: ${r.totalRent} | Payout: ${r.payout} | ID: ${r.id}`);
    }
  }

  // Are there any batches not successfully deleted?
  const dates = new Set(reports.map(r => r.reportDate.toISOString()));
  console.log("Existing Batch Dates List:");
  console.log(Array.from(dates).join("\n"));
}
main().finally(() => prisma.$disconnect());
