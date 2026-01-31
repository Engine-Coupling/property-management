const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const updates = [
        { name: '101', rent: 980000 },
        { name: '102', rent: 870000 },
        { name: '201', rent: 980000 },
        { name: '202', rent: 950000 },
        { name: '301', rent: 980000 },
        { name: '302', rent: 950000 },
        { name: 'S101', rent: 800000 },
    ]

    console.log('Updating specific property rents...')

    for (const update of updates) {
        const property = await prisma.property.findFirst({
            where: { name: update.name }
        })

        if (property) {
            await prisma.property.update({
                where: { id: property.id },
                data: { monthlyPayment: update.rent }
            })
            console.log(`Updated ${update.name} to $${update.rent}`)
        } else {
            console.log(`Property ${update.name} not found!`)
        }
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
