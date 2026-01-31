"use client"

import { useMemo, useState } from "react"
import { format, getYear, startOfMonth, isSameMonth } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"

interface Expense {
    id: string
    propertyId: string
    description: string
    amount: number
    date: string | Date
    category: string
    property: {
        name: string
    }
}

interface YearlyExpenseTableProps {
    expenses: Expense[]
}

export function YearlyExpenseTable({ expenses }: YearlyExpenseTableProps) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    // 2. Filter expenses by selected year
    const currentYearExpenses = useMemo(() => {
        return expenses.filter(e => {
            return getYear(new Date(e.date)) === selectedYear
        })
    }, [expenses, selectedYear])

    // 3. Months Array
    const months = Array.from({ length: 12 }, (_, i) => i)

    // Helper to identify expense type
    const getExpenseType = (expense: Expense) => {
        const d = expense.description.toLowerCase()
        if (d.includes("gas")) return "GAS"
        if (d.includes("cleanup") || d.includes("aseo")) return "CLEANUP"
        if (d.includes("extra") || d.includes("global") || expense.category === "OTHER") return "EXTRA"
        return "OTHER"
    }

    const getExpenseColor = (type: string) => {
        switch (type) {
            case "GAS": return "bg-red-500"
            case "CLEANUP": return "bg-green-500"
            case "EXTRA": return "bg-yellow-400"
            default: return "bg-zinc-400"
        }
    }

    const getExpenseLabel = (type: string) => {
        switch (type) {
            case "GAS": return "Gas"
            case "CLEANUP": return "Aseo"
            case "EXTRA": return "Extra"
            default: return "Otro"
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold dark:text-white">Deducciones Globales {selectedYear}</h3>
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
                        <div className="p-3 font-semibold text-sm text-zinc-500">Concepto</div>
                        {months.map(m => (
                            <div key={m} className="p-3 font-semibold text-xs text-center border-l border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase">
                                {format(new Date(selectedYear, m), "MMM", { locale: es })}
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    {["GAS", "CLEANUP", "EXTRA"].map((type, idx) => {
                        const label = getExpenseLabel(type)
                        const color = getExpenseColor(type)

                        return (
                            <div
                                key={type}
                                className={`grid grid-cols-[200px_repeat(12,_1fr)] border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}
                            >
                                <div className="p-3 font-medium text-sm truncate flex items-center border-r border-zinc-100 dark:border-zinc-800">
                                    <div className={`w-2 h-2 rounded-full ${color} mr-2`} />
                                    {label}
                                </div>

                                {months.map(monthIndex => {
                                    const monthDate = startOfMonth(new Date(selectedYear, monthIndex))

                                    // Find expenses of this TYPE in this Month
                                    const cellExpenses = currentYearExpenses.filter(e =>
                                        getExpenseType(e) === type &&
                                        isSameMonth(new Date(e.date), monthDate) &&
                                        e.amount > 0
                                    )

                                    return (
                                        <div key={monthIndex} className="relative min-h-[3rem] border-l border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-center gap-1 p-1">
                                            {cellExpenses.map(expense => (
                                                <div key={expense.id} className="relative group">
                                                    {/* Dot */}
                                                    <div className={`w-3 h-3 rounded-full ${color} shadow-sm border border-black/10 cursor-pointer hover:scale-125 transition-transform`} />
                                                    {/* Tooltip */}
                                                    <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max min-w-[120px] bg-zinc-900 text-white text-xs p-2 rounded shadow-xl border border-zinc-700 z-50 pointer-events-none">
                                                        <div className="space-y-1">
                                                            <p className="font-medium text-white">{expense.description}</p>
                                                            <p className="text-zinc-300 text-[10px]">{format(new Date(expense.date), "dd MMM yyyy", { locale: es })}</p>
                                                            <p className="pt-1 border-t border-zinc-700 text-green-400 font-bold">
                                                                {formatCurrency(expense.amount)}
                                                            </p>
                                                        </div>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}

                    {currentYearExpenses.length === 0 && (
                        <div className="p-8 text-center text-zinc-500 italic">
                            No hay deducciones registradas para este año.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-zinc-500 mt-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 border border-black/10" />
                    <span>Gas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 border border-black/10" />
                    <span>Aseo</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 border border-black/10" />
                    <span>Extra</span>
                </div>
            </div>
        </div>
    )
}
