const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
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

    console.log('Start seeding users...');

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
        console.log(`Upserted user: ${upsertedUser.email} as ${upsertedUser.role}`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
