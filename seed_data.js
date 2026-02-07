const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = 'pjramg@gmail.com'

    // 1. Promote User to ADMIN
    console.log(`Promoting user ${email} to ADMIN...`)
    const user = await prisma.user.update({
        where: { email },
        data: { role: 'POWER_ADMIN' }
    })
    console.log(`User ${user.name} is now ${user.role}`)

    // 2. Create Properties
    const propertyNames = ['S101', '101', '102', '201', '202', '301', '302']

    console.log('Seeding properties...')
    for (const name of propertyNames) {
        const existing = await prisma.property.findFirst({
            where: { name }
        })

        if (!existing) {
            await prisma.property.create({
                data: {
                    name,
                    address: `Apartment ${name}`,
                    ownerId: user.id
                }
            })
            console.log(`Created property: ${name}`)
        } else {
            console.log(`Property ${name} already exists.`)
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
