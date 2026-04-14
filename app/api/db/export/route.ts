import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (!session || !session.user || (role !== "ADMIN" && role !== "POWER_ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Fetch all tables in parallel
        const [users, properties, expenses, payments, monthlyReports, accounts] =
            await Promise.all([
                prisma.user.findMany({
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                    },
                }),
                prisma.property.findMany({
                    include: { owner: { select: { name: true, email: true } } },
                }),
                prisma.expense.findMany({
                    include: { property: { select: { name: true } } },
                    orderBy: { date: "desc" },
                }),
                prisma.payment.findMany({
                    include: { property: { select: { name: true } } },
                    orderBy: { createdAt: "desc" },
                }),
                prisma.monthlyReport.findMany({
                    include: { property: { select: { name: true } } },
                    orderBy: { reportDate: "desc" },
                }),
                prisma.account.findMany({
                    select: {
                        id: true,
                        userId: true,
                        provider: true,
                        type: true,
                    },
                }),
            ])

        const exportData = {
            exportedAt: new Date().toISOString(),
            tables: {
                users,
                properties,
                expenses,
                payments,
                monthlyReports,
                accounts,
            },
        }

        const timestamp = new Date().toISOString().slice(0, 10)
        const filename = `dosquebradas-db-backup-${timestamp}.json`

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        })
    } catch (error) {
        console.error("DB export error:", error)
        return NextResponse.json(
            { error: "Failed to export database" },
            { status: 500 }
        )
    }
}
