"use client"

import { useMemo, useState } from "react"
import { format, getMonth, getYear, getDaysInMonth, isWithinInterval, startOfMonth, endOfMonth, isSameMonth, getDate, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"

interface Report {
    id: string
    propertyId: string
    startDate: string | Date
    endDate: string | Date
    payout: number
    property: {
        name: string
    }
}

interface YearlyReportTableProps {
    reports: Report[]
}

export function YearlyReportTable({ reports }: YearlyReportTableProps) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    // 1. Get Unique Properties
    const properties = useMemo(() => {
        const props = new Set(reports.map(r => r.property.name))
        return Array.from(props).sort()
    }, [reports])

    // 2. Filter reports by selected year (if valid for this view)
    // Actually we want to see reports that fall within the year.
    const currentYearReports = useMemo(() => {
        return reports.filter(r => {
            const start = new Date(r.startDate)
            const end = new Date(r.endDate)
            return getYear(start) === selectedYear || getYear(end) === selectedYear
        })
    }, [reports, selectedYear])

    // 3. Months Array
    const months = Array.from({ length: 12 }, (_, i) => i)

    // Helper to calculate bar position within a month cell
    const getReportStyleInMonth = (report: Report, monthIndex: number) => {
        const reportStart = new Date(report.startDate)
        const reportEnd = new Date(report.endDate)
        const monthStart = startOfMonth(new Date(selectedYear, monthIndex))
        const monthEnd = endOfMonth(new Date(selectedYear, monthIndex))
        const daysInMonth = getDaysInMonth(new Date(selectedYear, monthIndex))

        // Check if report overlaps this month
        if (reportEnd < monthStart || reportStart > monthEnd) return null

        // Calculate overlap start and end within this month
        const overlapStart = reportStart < monthStart ? monthStart : reportStart
        const overlapEnd = reportEnd > monthEnd ? monthEnd : reportEnd

        // Calculate position percentages
        const startDay = getDate(overlapStart)
        const endDay = getDate(overlapEnd)

        // +1 to include the last day in width calculation if needed, or difference in days
        // differenceInDays returns full 24h periods. Adding 1 makes it inclusive of start date.
        const durationDays = differenceInDays(overlapEnd, overlapStart) + 1

        // Left offset: (Day of month - 1) / Days in month
        const left = ((getDate(overlapStart) - 1) / daysInMonth) * 100
        const width = (durationDays / daysInMonth) * 100

        return {
            left: `${Math.max(0, left)}%`,
            width: `${Math.min(100, width)}%`
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold dark:text-white">Reporte Anual {selectedYear}</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedYear(y => y - 1)}
                        className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => setSelectedYear(y => y + 1)}
                        className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm">
                <div className="min-w-[1000px]">
                    {/* Header */}
                    <div className="grid grid-cols-[200px_repeat(12,_1fr)] border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="p-3 font-semibold text-sm text-zinc-500">Propiedad</div>
                        {months.map(m => (
                            <div key={m} className="p-3 font-semibold text-xs text-center border-l border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase">
                                {format(new Date(selectedYear, m), "MMM", { locale: es })}
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {properties.map((property, idx) => (
                        <div
                            key={property}
                            className={`grid grid-cols-[200px_repeat(12,_1fr)] border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}
                        >
                            <div className="p-3 font-medium text-sm truncate flex items-center border-r border-zinc-100 dark:border-zinc-800">
                                {property}
                            </div>

                            {months.map(monthIndex => {
                                // Find reports for this property that overlap this month
                                const cellReports = currentYearReports.filter(r =>
                                    r.property.name === property &&
                                    getReportStyleInMonth(r, monthIndex) !== null
                                )

                                return (
                                    <div key={monthIndex} className="relative h-12 border-l border-zinc-100 dark:border-zinc-800">
                                        {cellReports.map(report => {
                                            const style = getReportStyleInMonth(report, monthIndex)
                                            if (!style) return null

                                            return (
                                                <div
                                                    key={report.id}
                                                    className="absolute top-1 bottom-1 z-10 hover:z-20 hover:scale-[1.02] transition-all group cursor-pointer"
                                                    style={{
                                                        left: style.left,
                                                        width: style.width
                                                    }}
                                                >
                                                    {/* Visual Bar Container (Overflow Hidden for rounded corners & texture) */}
                                                    <div className="absolute inset-0 rounded-md overflow-hidden bg-blue-500 dark:bg-blue-600 border border-blue-600 dark:border-blue-400 shadow-sm">
                                                        {/* Striped Texture Overlay */}
                                                        <div
                                                            className="absolute inset-0 opacity-30 mix-blend-overlay"
                                                            style={{
                                                                backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 6px)"
                                                            }}
                                                        />

                                                        {/* Content: Period and Amount */}
                                                        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full text-[10px] leading-tight font-bold text-white whitespace-nowrap overflow-hidden px-0.5 pointer-events-none">
                                                            <span className="drop-shadow-md">{format(new Date(report.startDate), "d MMM", { locale: es })} - {format(new Date(report.endDate), "d MMM", { locale: es })}</span>
                                                            <span className="drop-shadow-md">{formatCurrency(report.payout)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Tooltip (Outside the overflow-hidden container) */}
                                                    <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max min-w-[140px] bg-zinc-900/95 backdrop-blur-sm text-white text-xs p-3 rounded-lg shadow-xl border border-zinc-700 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                                                        <p className="font-bold mb-2 text-sm border-b border-zinc-700/50 pb-1 text-zinc-100">{property}</p>
                                                        <div className="space-y-1.5 text-zinc-300">
                                                            <div className="grid grid-cols-[35px_1fr] gap-2 items-center">
                                                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Del</span>
                                                                <span className="text-white font-medium bg-zinc-800/50 px-1.5 py-0.5 rounded text-[11px]">{format(new Date(report.startDate), "dd MMMM yyyy", { locale: es })}</span>
                                                            </div>
                                                            <div className="grid grid-cols-[35px_1fr] gap-2 items-center">
                                                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Al</span>
                                                                <span className="text-white font-medium bg-zinc-800/50 px-1.5 py-0.5 rounded text-[11px]">{format(new Date(report.endDate), "dd MMMM yyyy", { locale: es })}</span>
                                                            </div>
                                                            <div className="pt-2 mt-1 border-t border-zinc-700/50 flex justify-between items-center">
                                                                <span className="text-zinc-400 font-medium">Total Pago:</span>
                                                                <span className="text-emerald-400 font-bold text-sm bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">{formatCurrency(report.payout)}</span>
                                                            </div>
                                                        </div>
                                                        {/* Arrow */}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-zinc-900/95" />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    ))}

                    {properties.length === 0 && (
                        <div className="p-8 text-center text-zinc-500 italic">
                            No hay reportes para este año.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 mt-2">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, #2563eb 0, #2563eb 4px, transparent 4px, transparent 8px)" }} />
                    </div>
                    <span>Periodo Pagado</span>
                </div>
            </div>
        </div>
    )
}
