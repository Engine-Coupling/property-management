const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const defaultRent = 1500000 // 1.5M COP example

    console.log(`Updating all properties to have monthlyPayment = ${defaultRent}...`)

    const update = await prisma.property.updateMany({
        data: {
            monthlyPayment: defaultRent
        }
    })

    console.log(`Updated ${update.count} properties.`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
