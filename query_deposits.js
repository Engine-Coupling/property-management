const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const deps = await prisma.expense.findMany({
    where: { category: "DEPOSIT" }
  })
  console.log("Deposits:")
  console.log(deps)
}

main().catch(console.error).finally(() => prisma.$disconnect())
