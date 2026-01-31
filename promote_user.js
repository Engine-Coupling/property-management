const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const targetEmail = 'julianandres.cardona@gmail.com'
    const modelEmail = 'pjramg@gmail.com'

    // 1. Check model user role
    const modelUser = await prisma.user.findUnique({ where: { email: modelEmail } })
    if (!modelUser) {
        console.log(`Model user ${modelEmail} not found.`)
        return
    }
    console.log(`Model User Role (${modelEmail}):`, modelUser.role)

    // 2. Update target user
    const updatedUser = await prisma.user.update({
        where: { email: targetEmail },
        data: { role: modelUser.role }
    })

    console.log(`Updated ${targetEmail} to role:`, updatedUser.role)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
