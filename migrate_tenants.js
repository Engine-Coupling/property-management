const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// The data from the user request, to match email -> tenant info
const data = [
    {
        "Apartamento": "101",
        "Usuario Nombre": "Antoni Utima",
        "Correo": "Antoniasesorias@gmail.com",
    },
    {
        "Apartamento": "102",
        "Usuario Nombre": "Jorge Ceron",
        "Correo": "jhelsaer913@gmail.com",
    },
    {
        "Apartamento": "201",
        "Usuario Nombre": "Juan Camilo Salazar",
        "Correo": "salazarjuan105@gmail.com",
    },
    {
        "Apartamento": "202",
        "Usuario Nombre": "Bella Araujo Benavides",
        "Correo": "humbisbell@gmail.com",
    },
    {
        "Apartamento": "301",
        "Usuario Nombre": "Laura Sofia Diaz Martinez",
        "Correo": "lauradiaz0717@gmail.com",
    },
    {
        "Apartamento": "302",
        "Usuario Nombre": "Erick Santiago Alvear Sepulveda",
        "Correo": "erickalvearimp@gmail.com",
    },
    {
        "Apartamento": "S101",
        "Usuario Nombre": "Emily",
        "Correo": "emilyvelezarcila@gmail.com",
    }
]

async function main() {
    console.log('Starting migration...')

    // 1. Find the REAL Owner (Admin) - assuming Paula
    // We'll search for a user with role 'ADMIN' or one of the known emails if known.
    // Common pattern: The first user created is often the admin.
    // Or we search for "Paula".
    const admin = await prisma.user.findFirst({
        where: {
            OR: [
                { role: 'ADMIN' },
                { email: { contains: 'paula' } }
            ]
        }
    })

    if (!admin) {
        console.error("Could not find an Admin/Owner user to re-assign properties to!")
        return
    }
    console.log(`Re-assigning ownership to: ${admin.name} (${admin.email})`)

    for (const item of data) {
        const property = await prisma.property.findFirst({
            where: { name: item.Apartamento }
        })

        if (property) {
            // Move Tenant Info
            await prisma.property.update({
                where: { id: property.id },
                data: {
                    tenantName: item["Usuario Nombre"],
                    tenantEmail: item["Correo"],
                    ownerId: admin.id // Set the owner back to the Admin
                }
            })
            console.log(`Migrated ${item.Apartamento}: Tenant=${item["Usuario Nombre"]}, Owner=${admin.name}`)

            // Optional: Clean up the "fake" owner users created previously?
            // Maybe better to leave them in case they are needed later, or delete to avoid clutter.
            // For safety, I'll leave them.
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
