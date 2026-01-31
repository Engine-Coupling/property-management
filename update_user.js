const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.update({
        where: { email: 'pjramg@gmail.com' },
        data: { role: 'ADMIN' },
    })
    console.log('Updated user:', user)
}

main()
    .catch(e => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
