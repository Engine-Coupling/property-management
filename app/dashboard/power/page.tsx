import { getMonthlyReports } from "@/app/actions/save-report"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { YearlyReportTable } from "./_components/yearly-report-table"
import { YearlyExpenseTable } from "./_components/yearly-expense-table"
import prisma from "@/lib/prisma"

export default async function PowerAdminPage() {
    const { success, reports, error } = await getMonthlyReports()

    if (error || !success || !reports) {
        return (
            <div className="p-8 text-center text-red-500">
                <h1 className="text-2xl font-bold">Error Accessing History</h1>
                <p>{error || "Unauthorized"}</p>
            </div>
        )
    }

    const totalPayoutAllTime = reports.reduce((acc: number, r: any) => acc + r.payout, 0)



    // Group by month string (e.g. "January 2025") for Table
    const groupedReports: Record<string, any[]> = {}
    reports.forEach((r: any) => {
        const monthKey = format(new Date(r.endDate), "MMMM yyyy", { locale: es })
        if (!groupedReports[monthKey]) groupedReports[monthKey] = []
        groupedReports[monthKey].push(r)
    })

    const expenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' },
        include: {
            property: {
                select: { name: true }
            }
        }
    })

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Power Admin Dashboard</h1>
                <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-4 py-2 rounded-lg font-mono">
                    Total Payouts: {formatCurrency(totalPayoutAllTime)}
                </div>
            </div>

            {/* Yearly Report Table */}
            <div className="space-y-8">
                <YearlyReportTable reports={reports} />
                <YearlyExpenseTable expenses={expenses} />
            </div>

            <div className="grid gap-6">
                <h2 className="text-xl font-semibold mt-8 mb-4">Detalle Mensual</h2>
                {Object.entries(groupedReports).map(([month, monthReports]) => (
                    <div key={month} className="rounded-xl border bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50">
                        <div className="flex flex-col space-y-1.5 p-6">
                            <h3 className="font-semibold leading-none tracking-tight capitalize text-xl">{month}</h3>
                        </div>
                        <div className="p-6 pt-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50 data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-slate-800">
                                            <th className="h-12 px-4 align-middle font-medium text-slate-500 dark:text-slate-400">Property</th>
                                            <th className="h-12 px-4 align-middle font-medium text-slate-500 dark:text-slate-400">Date Generated</th>
                                            <th className="h-12 px-4 align-middle font-medium text-slate-500 dark:text-slate-400 text-right">Rent</th>
                                            <th className="h-12 px-4 align-middle font-medium text-slate-500 dark:text-slate-400 text-right">HOA</th>
                                            <th className="h-12 px-4 align-middle font-medium text-slate-500 dark:text-slate-400 text-right">Reported Period</th>
                                            <th className="h-12 px-4 align-middle font-medium text-slate-500 dark:text-slate-400 text-right">Payout</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {monthReports.map((report) => (
                                            <tr key={report.id} className="border-b transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                                                <td className="p-4 align-middle font-medium">{report.property.name}</td>
                                                <td className="p-4 align-middle">{format(new Date(report.reportDate), "dd MMM HH:mm", { locale: es })}</td>
                                                <td className="p-4 align-middle text-right">{formatCurrency(report.totalRent)}</td>
                                                <td className="p-4 align-middle text-right">{formatCurrency(report.totalHoa)}</td>
                                                <td className="p-4 align-middle text-right text-zinc-500">
                                                    {format(new Date(report.startDate), "d MMM", { locale: es })} - {format(new Date(report.endDate), "d MMM", { locale: es })}
                                                </td>
                                                <td className="p-4 align-middle text-right font-bold text-green-600">
                                                    {formatCurrency(report.payout)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
