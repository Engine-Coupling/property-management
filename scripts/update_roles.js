const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    // 1. Delete Carlos completely from the database
    // Must delete related accounts/sessions first due to foreign key constraints
    const emails = ['carlosmario646@hotmail.com', 'carlosmario646@gmail.com']

    for (const email of emails) {
        const user = await prisma.user.findUnique({ where: { email } })
        if (user) {
            // Delete related records first
            await prisma.account.deleteMany({ where: { userId: user.id } })
            await prisma.session.deleteMany({ where: { userId: user.id } })
            await prisma.user.delete({ where: { email } })
            console.log(`✅ Deleted user: ${email}`)
        } else {
            console.log(`⚠️  User ${email} not found in database`)
        }
    }

    // 2. Promote Alexander to ADMIN (if he has signed in)
    const alex = await prisma.user.findUnique({ where: { email: 'Alexarte0607@gmail.com' } })
    if (alex) {
        await prisma.user.update({
            where: { email: 'Alexarte0607@gmail.com' },
            data: { role: 'ADMIN' }
        })
        console.log('✅ Alexander (Alexarte0607@gmail.com) promoted to ADMIN')
    } else {
        console.log('⚠️  Alexander not found. He needs to sign in with Google first, then re-run this script.')
    }
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })
