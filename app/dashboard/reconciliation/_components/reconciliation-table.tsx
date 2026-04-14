"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import { Scale, Building2, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

// The administrator's fixed rent for "Santa Lucia del Bosque"
const ADMIN_RENT = 4_000_000

interface Report {
    id: string
    propertyId: string
    propertyName: string
    startDate: string
    endDate: string
    reportDate: string
    totalRent: number
    totalHoa: number
    totalDeductions: number
    payout: number
}

interface PeriodGroup {
    key: string
    label: string
    startDate: Date
    endDate: Date
    properties: {
        name: string
        hoa: number
    }[]
    totalHoa: number
    adminDebt: number
    netBalance: number
}

interface ReconciliationTableProps {
    reports: Report[]
}

export function ReconciliationTable({ reports }: ReconciliationTableProps) {
    // Group reports by period (startDate + endDate combo)
    const periods: PeriodGroup[] = useMemo(() => {
        const groupMap = new Map<string, Report[]>()

        for (const r of reports) {
            // Use start+end as the period key
            const key = `${r.startDate.slice(0, 10)}_${r.endDate.slice(0, 10)}`
            if (!groupMap.has(key)) groupMap.set(key, [])
            groupMap.get(key)!.push(r)
        }

        const result: PeriodGroup[] = []

        for (const [key, periodReports] of groupMap.entries()) {
            const startDate = new Date(periodReports[0].startDate)
            const endDate = new Date(periodReports[0].endDate)
            const label = format(startDate, "MMMM yyyy", { locale: es })

            const properties = periodReports.map((r) => ({
                name: r.propertyName,
                hoa: r.totalHoa,
            }))

            const totalHoa = properties.reduce((sum, p) => sum + p.hoa, 0)
            const adminDebt = ADMIN_RENT
            const netBalance = adminDebt - totalHoa

            result.push({
                key,
                label,
                startDate,
                endDate,
                properties,
                totalHoa,
                adminDebt,
                netBalance,
            })
        }

        // Sort by date descending
        result.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
        return result
    }, [reports])

    // Running balance (oldest first, then reverse for display)
    const periodsWithRunning = useMemo(() => {
        const sorted = [...periods].sort(
            (a, b) => a.startDate.getTime() - b.startDate.getTime()
        )
        let running = 0
        const withRunning = sorted.map((p) => {
            running += p.netBalance
            return { ...p, runningBalance: running }
        })
        // Reverse back to newest first
        withRunning.reverse()
        return withRunning
    }, [periods])

    const grandTotalHoa = periods.reduce((sum, p) => sum + p.totalHoa, 0)
    const grandTotalDebt = periods.reduce((sum, p) => sum + p.adminDebt, 0)
    const grandNetBalance = grandTotalDebt - grandTotalHoa

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">
                            Total Arriendo Acumulado
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(grandTotalDebt)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                        Santa Lucia del Bosque • {periods.length} periodo(s)
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ArrowDownRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">
                            Total Administración Ganada
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(grandTotalHoa)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                        HOA 10% de 7 propiedades
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">
                            Balance Neto
                        </span>
                    </div>
                    <p
                        className={`text-2xl font-bold ${
                            grandNetBalance > 0
                                ? "text-red-600 dark:text-red-400"
                                : grandNetBalance < 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-zinc-600 dark:text-zinc-400"
                        }`}
                    >
                        {grandNetBalance > 0 ? "Debe: " : grandNetBalance < 0 ? "A favor: " : ""}
                        {formatCurrency(Math.abs(grandNetBalance))}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                        Arriendo − Administración
                    </p>
                </div>
            </div>

            {/* Period Detail Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <h3 className="font-semibold text-lg dark:text-white flex items-center gap-2">
                        <Scale className="w-5 h-5 text-zinc-400" />
                        Detalle por Periodo
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-xs uppercase border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-3">Periodo</th>
                                <th className="px-6 py-3 text-right">
                                    Arriendo (Debe)
                                </th>
                                <th className="px-6 py-3 text-right">
                                    Administración (Abono)
                                </th>
                                <th className="px-6 py-3 text-right">
                                    Neto Periodo
                                </th>
                                <th className="px-6 py-3 text-right">
                                    Saldo Acumulado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {periodsWithRunning.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-6 py-12 text-center text-zinc-500"
                                    >
                                        No hay reportes generados aún.
                                    </td>
                                </tr>
                            ) : (
                                periodsWithRunning.map((period) => (
                                    <tr
                                        key={period.key}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-zinc-900 dark:text-white capitalize">
                                                {period.label}
                                            </div>
                                            <div className="text-xs text-zinc-400">
                                                {format(period.startDate, "dd MMM", { locale: es })} –{" "}
                                                {format(period.endDate, "dd MMM yyyy", { locale: es })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-red-600 dark:text-red-400">
                                            {formatCurrency(period.adminDebt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-mono text-green-600 dark:text-green-400">
                                                -{formatCurrency(period.totalHoa)}
                                            </div>
                                            {/* Expandable property list */}
                                            <details className="mt-1">
                                                <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600">
                                                    {period.properties.length} propiedades
                                                </summary>
                                                <div className="mt-1 space-y-0.5">
                                                    {period.properties.map((p, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex justify-between text-xs text-zinc-500"
                                                        >
                                                            <span className="truncate max-w-[120px]">
                                                                {p.name}
                                                            </span>
                                                            <span className="font-mono">
                                                                {formatCurrency(p.hoa)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span
                                                className={`font-mono font-semibold ${
                                                    period.netBalance > 0
                                                        ? "text-red-600 dark:text-red-400"
                                                        : period.netBalance < 0
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-zinc-500"
                                                }`}
                                            >
                                                {formatCurrency(period.netBalance)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span
                                                className={`font-mono font-bold text-base ${
                                                    period.runningBalance > 0
                                                        ? "text-red-600 dark:text-red-400"
                                                        : period.runningBalance < 0
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-zinc-500"
                                                }`}
                                            >
                                                {formatCurrency(period.runningBalance)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Legend */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                    <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            <span>
                                Propiedad: <strong className="text-zinc-700 dark:text-zinc-300">Santa Lucia del Bosque</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Minus className="w-3 h-3" />
                            <span>
                                Canon mensual:{" "}
                                <strong className="text-zinc-700 dark:text-zinc-300">
                                    {formatCurrency(ADMIN_RENT)}
                                </strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded bg-red-200 dark:bg-red-800" />
                            <span>Debe (positivo)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded bg-green-200 dark:bg-green-800" />
                            <span>A favor (negativo)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
