const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const reports = await prisma.monthlyReport.findMany({
    where: {
      property: {
        name: { in: ['301', '302', '101', '201'] }
      }
    },
    include: { property: { select: { name: true } } },
    orderBy: { reportDate: 'desc' }
  })
  
  reports.forEach(r => {
    console.log(`${r.property.name} | ${r.startDate.toISOString().split('T')[0]} to ${r.endDate.toISOString().split('T')[0]} | reportDate: ${r.reportDate.toISOString().split('T')[0]} | HOA: ${r.totalHoa} | Rent: ${r.totalRent}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
