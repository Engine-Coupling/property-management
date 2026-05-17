const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const exps = await prisma.expense.findMany({
    where: { description: { startsWith: "Global" } }
  })
  console.log("Global Expenses:")
  console.log(exps)
}

main().catch(console.error).finally(() => prisma.$disconnect())
