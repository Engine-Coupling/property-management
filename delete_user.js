const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = 'julianandres.cardona@gmail.com'
    const deleted = await prisma.user.delete({
        where: { email },
    })
    console.log('Deleted zombie user:', deleted.email)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
