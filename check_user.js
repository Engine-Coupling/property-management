const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = 'julianandres.cardona@gmail.com'
    const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true }
    })

    if (!user) {
        console.log(`User ${email} NOT FOUND in database.`)
    } else {
        console.log(`User found:`, user)
        console.log(`Linked Accounts:`, user.accounts)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
