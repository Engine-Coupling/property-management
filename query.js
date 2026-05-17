const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const properties = await prisma.property.findMany({ select: { name: true } })
  console.log("Properties:", properties.map(p => p.name))
  
  const reports = await prisma.monthlyReport.findMany({
    include: { property: { select: { name: true } } },
    orderBy: { reportDate: 'desc' },
    take: 20
  })
  
  console.log("Recent reports:")
  reports.forEach(r => {
    console.log(`${r.property.name} | ${r.startDate.toISOString().split('T')[0]} to ${r.endDate.toISOString().split('T')[0]} | reportDate: ${r.reportDate.toISOString().split('T')[0]}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
