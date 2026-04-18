"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import { Scale, Building2, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

// The administrator's fixed monthly rent for "Santa Lucia del Bosque"
const ADMIN_MONTHLY_RENT = 4_000_000

// Reconciliation starts from this month (inclusive)
const START_YEAR = 2026
const START_MONTH = 4 // 0-indexed: 4 = May

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

interface MonthBucket {
    year: number
    month: number // 0-indexed
    label: string
    adminDebt: number
    hoaCredits: {
        reportId: string
        propertyName: string
        hoa: number
        reportLabel: string
    }[]
    totalHoaCredit: number
    netBalance: number
}

interface ReconciliationTableProps {
    reports: Report[]
}

export function ReconciliationTable({ reports }: ReconciliationTableProps) {
    const months: MonthBucket[] = useMemo(() => {
        // Determine range: from START to today or latest report
        const now = new Date()
        let endYear = now.getFullYear()
        let endMonth = now.getMonth()

        for (const r of reports) {
            const d = new Date(r.reportDate)
            if (d.getFullYear() > endYear || (d.getFullYear() === endYear && d.getMonth() > endMonth)) {
                endYear = d.getFullYear()
                endMonth = d.getMonth()
            }
        }

        // Build calendar month buckets
        const buckets: MonthBucket[] = []
        let y = START_YEAR
        let m = START_MONTH

        while (y < endYear || (y === endYear && m <= endMonth)) {
            // Assign reports to this month based on reportDate (when it was generated)
            const hoaCredits: MonthBucket["hoaCredits"] = []

            for (const r of reports) {
                const rd = new Date(r.reportDate)
                if (rd.getFullYear() === y && rd.getMonth() === m) {
                    const rStart = new Date(r.startDate)
                    const rEnd = new Date(r.endDate)
                    const reportLabel = `${format(rStart, "dd MMM", { locale: es })} – ${format(rEnd, "dd MMM yyyy", { locale: es })}`

                    hoaCredits.push({
                        reportId: r.id,
                        propertyName: r.propertyName,
                        hoa: r.totalHoa,
                        reportLabel,
                    })
                }
            }

            const totalHoaCredit = hoaCredits.reduce((sum, c) => sum + c.hoa, 0)

            buckets.push({
                year: y,
                month: m,
                label: format(new Date(y, m), "MMMM yyyy", { locale: es }),
                adminDebt: ADMIN_MONTHLY_RENT,
                hoaCredits,
                totalHoaCredit,
                netBalance: ADMIN_MONTHLY_RENT - totalHoaCredit,
            })

            m++
            if (m > 11) { m = 0; y++ }
        }

        return buckets
    }, [reports])

    // Running balance (oldest → newest)
    const monthsWithRunning = useMemo(() => {
        let running = 0
        return months.map((b) => {
            running += b.netBalance
            return { ...b, runningBalance: running }
        })
    }, [months])

    // Display newest first
    const displayed = useMemo(() => [...monthsWithRunning].reverse(), [monthsWithRunning])

    const grandTotalDebt = months.reduce((s, b) => s + b.adminDebt, 0)
    const grandTotalCredit = months.reduce((s, b) => s + b.totalHoaCredit, 0)
    const grandNet = grandTotalDebt - grandTotalCredit

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Total Arriendo Acumulado</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(grandTotalDebt)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                        {formatCurrency(ADMIN_MONTHLY_RENT)}/mes × {months.length} meses
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ArrowDownRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Total Administración Abonada</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(grandTotalCredit)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">Honorarios de administración de propiedades</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Saldo Actual</span>
                    </div>
                    <p className={`text-2xl font-bold ${grandNet > 0 ? "text-red-600 dark:text-red-400" : grandNet < 0 ? "text-green-600 dark:text-green-400" : "text-zinc-600"}`}>
                        {grandNet > 0 ? "Debe: " : grandNet < 0 ? "A favor: " : ""}
                        {formatCurrency(Math.abs(grandNet))}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">Arriendo − Administración</p>
                </div>
            </div>

            {/* Month Detail Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <h3 className="font-semibold text-lg dark:text-white flex items-center gap-2">
                        <Scale className="w-5 h-5 text-zinc-400" />
                        Detalle por Mes
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                        Los honorarios de administración se abonan completamente al mes en que se genera el reporte.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-xs uppercase border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-3">Mes</th>
                                <th className="px-6 py-3 text-right">Arriendo (Debe)</th>
                                <th className="px-6 py-3 text-right">Administración (Abono)</th>
                                <th className="px-6 py-3 text-right">Pago Restante</th>
                                <th className="px-6 py-3 text-right">Saldo Acumulado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {displayed.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No hay datos desde mayo 2026 aún.
                                    </td>
                                </tr>
                            ) : (
                                displayed.map((bucket) => (
                                    <tr
                                        key={`${bucket.year}-${bucket.month}`}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-zinc-900 dark:text-white capitalize">
                                                {bucket.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-red-600 dark:text-red-400">
                                            {formatCurrency(bucket.adminDebt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-mono text-green-600 dark:text-green-400">
                                                -{formatCurrency(bucket.totalHoaCredit)}
                                            </div>
                                            {bucket.hoaCredits.length > 0 && (
                                                <details className="mt-1">
                                                    <summary className="text-xs text-zinc-400 cursor-pointer hover:text-zinc-600">
                                                        {bucket.hoaCredits.length} propiedad(es) — ver detalle
                                                    </summary>
                                                    <div className="mt-2 space-y-1 text-xs">
                                                        {bucket.hoaCredits.map((c, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex justify-between items-start gap-2 text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 rounded px-2 py-1"
                                                            >
                                                                <div className="min-w-0">
                                                                    <div className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                                                        {c.propertyName}
                                                                    </div>
                                                                    <div className="text-zinc-400">
                                                                        Periodo: {c.reportLabel}
                                                                    </div>
                                                                </div>
                                                                <span className="font-mono text-green-600 dark:text-green-400 whitespace-nowrap">
                                                                    {formatCurrency(c.hoa)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span
                                                className={`font-mono font-semibold ${
                                                    bucket.netBalance > 0
                                                        ? "text-red-600 dark:text-red-400"
                                                        : bucket.netBalance < 0
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-zinc-500"
                                                }`}
                                            >
                                                {formatCurrency(bucket.netBalance)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span
                                                className={`font-mono font-bold text-base ${
                                                    bucket.runningBalance > 0
                                                        ? "text-red-600 dark:text-red-400"
                                                        : bucket.runningBalance < 0
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-zinc-500"
                                                }`}
                                            >
                                                {formatCurrency(bucket.runningBalance)}
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
                                Canon mensual: <strong className="text-zinc-700 dark:text-zinc-300">{formatCurrency(ADMIN_MONTHLY_RENT)}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded bg-red-200 dark:bg-red-800" />
                            <span>Debe</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded bg-green-200 dark:bg-green-800" />
                            <span>A favor</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
