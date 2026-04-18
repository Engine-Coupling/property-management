const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const email = 'carlosmario646@hotmail.com'

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        console.log(`⚠️  User ${email} not found in database`)
        return
    }

    // Delete related records first (foreign key constraints)
    const deletedAccounts = await prisma.account.deleteMany({ where: { userId: user.id } })
    console.log(`  Deleted ${deletedAccounts.count} account(s)`)

    const deletedSessions = await prisma.session.deleteMany({ where: { userId: user.id } })
    console.log(`  Deleted ${deletedSessions.count} session(s)`)

    await prisma.user.delete({ where: { email } })
    console.log(`✅ Deleted user: ${email}`)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
