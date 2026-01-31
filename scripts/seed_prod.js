const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting production seed...');

    // 1. Seed Users
    const users = [
        {
            email: 'pjramg@gmail.com',
            name: 'Paula Ramos',
            role: 'POWER_ADMIN',
        },
        {
            email: 'julianandres.cardona@gmail.com',
            name: 'Julian Cardona',
            role: 'POWER_ADMIN',
        },
        {
            email: 'carlosmario646@hotmail.com',
            name: 'Carlos Mario',
            role: 'ADMIN',
        },
    ];

    for (const user of users) {
        const upsertedUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
                name: user.name,
                role: user.role,
            },
            create: {
                email: user.email,
                name: user.name,
                role: user.role,
                image: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
            },
        });
        console.log(`👤 Upserted user: ${upsertedUser.email} (${upsertedUser.role})`);
    }

    // 2. Fetch the Owner (Carlos Mario) to assign properties
    const owner = await prisma.user.findUnique({
        where: { email: 'carlosmario646@hotmail.com' }
    });

    if (owner) {
        // 3. Seed Properties
        const properties = [
            { name: "S101", address: "Apartment S101" },
            { name: "101", address: "Apartment 101" },
            { name: "102", address: "Apartment 102" },
            { name: "201", address: "Apartment 201" },
            { name: "202", address: "Apartment 202" },
            { name: "301", address: "Apartment 301" },
            { name: "302", address: "Apartment 302" }
        ];

        for (const prop of properties) {
            const upsertedProp = await prisma.property.create({
                data: {
                    name: prop.name,
                    address: prop.address,
                    ownerId: owner.id,
                }
            });
            console.log(`🏠 Created property: ${upsertedProp.name}`);
        }
    } else {
        console.warn('⚠️ Admin user not found, skipping property creation.');
    }

    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
