import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ReconciliationTable } from "./_components/reconciliation-table"

export default async function ReconciliationPage() {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (!session || (role !== "ADMIN" && role !== "POWER_ADMIN")) {
        redirect("/dashboard/owner")
    }

    // Fetch all monthly reports with property info
    const reports = await prisma.monthlyReport.findMany({
        include: {
            property: {
                select: { name: true },
            },
        },
        orderBy: { startDate: "desc" },
    })

    // Fetch reconciliation payments
    const payments = await prisma.reconciliationPayment.findMany({
        orderBy: { date: "desc" },
    })

    // Fetch global admin-paid costs (gas, cleanup, extra)
    // These are expenses whose description starts with "Global"
    const globalCosts = await prisma.expense.findMany({
        where: {
            description: {
                startsWith: "Global",
            },
        },
        orderBy: { date: "desc" },
    })

    // Serialize dates for client component
    const serializedReports = reports.map((r) => ({
        id: r.id,
        propertyId: r.propertyId,
        propertyName: r.property.name,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        reportDate: r.reportDate.toISOString(),
        totalRent: r.totalRent,
        totalHoa: r.totalHoa,
        totalDeductions: r.totalDeductions,
        payout: r.payout,
    }))

    const serializedPayments = payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        date: p.date.toISOString(),
        note: p.note,
        receiptLink: p.receiptLink,
        createdAt: p.createdAt.toISOString(),
    }))

    const serializedCosts = globalCosts.map((c) => ({
        id: c.id,
        description: c.description,
        amount: c.amount,
        date: c.date.toISOString(),
        category: c.category,
    }))

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Cruce de Cuentas
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Reconciliación entre honorarios de administración y arriendo de Santa Lucia del Bosque.
                </p>
            </div>
            <ReconciliationTable
                reports={serializedReports}
                payments={serializedPayments}
                globalCosts={serializedCosts}
            />
        </div>
    )
}
