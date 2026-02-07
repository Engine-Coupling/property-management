const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const powerAdminEmail = 'pjramg@gmail.com' // Paula (Owner)
    // You can add Carlos's email here if known, otherwise we just focus on fixing ownership
    // const adminEmail = 'carlos@example.com' 

    // 1. Promote Paula to POWER_ADMIN (and ensure she owns properties)
    console.log(`Promoting user ${powerAdminEmail} to POWER_ADMIN...`)

    // We try to update, if not found we might need to wait for login or create?
    // Assuming Paula has logged in at least once or exists.
    const powerAdmin = await prisma.user.findUnique({ where: { email: powerAdminEmail } })

    if (powerAdmin) {
        await prisma.user.update({
            where: { email: powerAdminEmail },
            data: { role: 'POWER_ADMIN' }
        })
        console.log(`User ${powerAdminEmail} is now POWER_ADMIN`)

        // 2. Reassign ALL properties to Paula (The Owner)
        // because currently they are assigned to whoever ran the seed (maybe Carlos?)
        console.log(`Reassigning all properties to ${powerAdminEmail}...`)
        await prisma.property.updateMany({
            data: { ownerId: powerAdmin.id }
        })
        console.log("All properties reassigned to Power Admin.")

    } else {
        console.log(`User ${powerAdminEmail} not found. Please log in first or create user manually.`)
    }

    // 3. Create Properties (if they don't exist)
    // They will be assigned to Power Admin
    if (powerAdmin) {
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
                        ownerId: powerAdmin.id
                    }
                })
                console.log(`Created property: ${name}`)
            } else {
                console.log(`Property ${name} already exists.`)
            }
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
