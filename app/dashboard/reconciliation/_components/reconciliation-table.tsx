"use client"

import { useState, useMemo, useTransition } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import { Scale, Building2, ArrowDownRight, ArrowUpRight, Minus, Plus, Loader2, Upload, Paperclip, X } from "lucide-react"
import { createReconciliationPayment } from "@/app/actions/reconciliation"

// The administrator's fixed monthly rent for "Santa Lucia del Bosque"
const ADMIN_MONTHLY_RENT = 4_000_000

// Reconciliation configuration
// The start year/month will be dynamically calculated from the earliest record.

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

interface ReconciliationPayment {
    id: string
    amount: number
    date: string
    note?: string | null
    receiptLink?: string | null
    createdAt: string
}

interface GlobalCost {
    id: string
    description: string
    amount: number
    date: string
    category: string
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
    costCredits: GlobalCost[]
    payments: ReconciliationPayment[]
    totalHoaCredit: number
    totalCostCredit: number
    totalPayments: number
    netBalance: number
}

interface ReconciliationTableProps {
    reports: Report[]
    payments: ReconciliationPayment[]
    globalCosts: GlobalCost[]
}

export function ReconciliationTable({ reports, payments, globalCosts }: ReconciliationTableProps) {
    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState<number | "">("")
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
    const [paymentNote, setPaymentNote] = useState("")
    const [paymentFile, setPaymentFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)

    const months: MonthBucket[] = useMemo(() => {
        // Determine range: from START to today or latest report/payment
        const now = new Date()
        let startYear = now.getFullYear()
        let startMonth = now.getMonth()
        let endYear = now.getFullYear()
        let endMonth = now.getMonth()

        const updateRange = (d: Date) => {
            if (d.getFullYear() < startYear || (d.getFullYear() === startYear && d.getMonth() < startMonth)) {
                startYear = d.getFullYear()
                startMonth = d.getMonth()
            }
            if (d.getFullYear() > endYear || (d.getFullYear() === endYear && d.getMonth() > endMonth)) {
                endYear = d.getFullYear()
                endMonth = d.getMonth()
            }
        }

        reports.forEach(r => updateRange(new Date(r.reportDate)))
        payments.forEach(p => updateRange(new Date(p.date)))
        globalCosts.forEach(c => updateRange(new Date(c.date)))

        // Feature request: No incluir Febrero ni Marzo (ni anteriores) para los cruces de cuentas.
        // Forzamos que el mes de inicio mínimo sea Abril 2026 (Mes index 3).
        if (startYear < 2026 || (startYear === 2026 && startMonth < 3)) {
            startYear = 2026
            startMonth = 3
        }

        // Build calendar month buckets
        const buckets: MonthBucket[] = []
        let y = startYear
        let m = startMonth

        while (y < endYear || (y === endYear && m <= endMonth)) {
            const hoaCredits: MonthBucket["hoaCredits"] = []
            const costCredits: GlobalCost[] = []
            const bucketPayments: ReconciliationPayment[] = []

            for (const r of reports) {
                const rd = new Date(r.reportDate)
                if (rd.getFullYear() === y && rd.getMonth() === m) {
                    // Feature request: Solo adicionar HOA a favor de apartamentos 101, 201, 301.
                    if (!r.propertyName.includes("101") && !r.propertyName.includes("201") && !r.propertyName.includes("301")) {
                        continue;
                    }

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

            for (const c of globalCosts) {
                const cd = new Date(c.date)
                if (cd.getFullYear() === y && cd.getMonth() === m) {
                    // Feature request: Costos adicionales y gas a partir de mayo 2026 (mes 4)
                    if (y < 2026 || (y === 2026 && m < 4)) {
                        continue;
                    }
                    costCredits.push(c)
                }
            }

            for (const p of payments) {
                const pd = new Date(p.date)
                if (pd.getFullYear() === y && pd.getMonth() === m) {
                    bucketPayments.push(p)
                }
            }

            const totalHoaCredit = hoaCredits.reduce((sum, c) => sum + c.hoa, 0)
            const totalCostCredit = costCredits.reduce((sum, c) => sum + c.amount, 0)
            const totalPayments = bucketPayments.reduce((sum, p) => sum + p.amount, 0)

            buckets.push({
                year: y,
                month: m,
                label: format(new Date(y, m), "MMMM yyyy", { locale: es }),
                adminDebt: ADMIN_MONTHLY_RENT,
                hoaCredits,
                costCredits,
                payments: bucketPayments,
                totalHoaCredit,
                totalCostCredit,
                totalPayments,
                netBalance: ADMIN_MONTHLY_RENT - totalHoaCredit - totalCostCredit - totalPayments,
            })

            m++
            if (m > 11) { m = 0; y++ }
        }

        return buckets
    }, [reports, payments, globalCosts])

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
    const grandTotalHoaCredit = months.reduce((s, b) => s + b.totalHoaCredit, 0)
    const grandTotalCostCredit = months.reduce((s, b) => s + b.totalCostCredit, 0)
    const grandTotalPayments = months.reduce((s, b) => s + b.totalPayments, 0)
    
    // Total Credits = HOA + Global Costs (Gas, Cleanup, Extra) + Settlement Payments
    const grandTotalCredit = grandTotalHoaCredit + grandTotalCostCredit + grandTotalPayments
    const grandNet = grandTotalDebt - grandTotalCredit

    const handlePaymentSubmit = async () => {
        if (!paymentAmount || paymentAmount <= 0) return

        setUploading(true)
        let link = ""

        try {
            if (paymentFile) {
                const formData = new FormData()
                formData.append("file", paymentFile)

                const uploadRes = await fetch("/api/upload/reconciliation", {
                    method: "POST",
                    body: formData,
                })

                if (!uploadRes.ok) throw new Error("Upload failed")
                const data = await uploadRes.json()
                if (data.link) link = data.link
            }

            const res = await createReconciliationPayment({
                amount: Number(paymentAmount),
                date: paymentDate,
                note: paymentNote,
                receiptLink: link,
            })
            
            if (res.error) {
                alert(res.error)
            } else {
                setShowPaymentForm(false)
                setPaymentAmount("")
                setPaymentNote("")
                setPaymentFile(null)
            }
        } catch (error) {
            console.error("Payment error", error)
            alert("Error al registrar el pago")
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header / Reconciliar action */}
            <div className="flex justify-end">
                <button 
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-sm"
                >
                    {showPaymentForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    Reconciliar / Abonar Pago
                </button>
            </div>

            {/* Payment Form Modal/Inline */}
            {showPaymentForm && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-lg font-semibold dark:text-white mb-4">Registrar Abono</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase">Monto</label>
                            <input 
                                type="number" 
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value ? Number(e.target.value) : "")}
                                placeholder="Ej: 500000"
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase">Fecha</label>
                            <input 
                                type="date" 
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase">Nota (opcional)</label>
                            <input 
                                type="text" 
                                value={paymentNote}
                                onChange={e => setPaymentNote(e.target.value)}
                                placeholder="Detalles del pago"
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2 h-[38px]">
                            <div className="flex-1 relative">
                                <input
                                    type="file"
                                    onChange={e => setPaymentFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="reconciliation-upload"
                                />
                                <label 
                                    htmlFor="reconciliation-upload" 
                                    className="flex items-center justify-center w-full h-full border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                                >
                                    <Paperclip className="w-4 h-4 mr-2" />
                                    <span className="truncate max-w-[100px]">{paymentFile ? paymentFile.name : "Recibo"}</span>
                                </label>
                            </div>
                            <button
                                onClick={handlePaymentSubmit}
                                disabled={uploading || !paymentAmount}
                                className="bg-primary text-primary-foreground px-4 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center min-w-[100px]"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                            <ArrowUpRight className="w-5 h-5" />
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

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <ArrowDownRight className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Total Abonos Acumulados</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(grandTotalCredit)}
                    </p>
                    <div className="text-xs text-zinc-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span>HOA: {formatCurrency(grandTotalHoaCredit)}</span>
                        <span>Gastos Globales: {formatCurrency(grandTotalCostCredit)}</span>
                        <span>Pagos Directos: {formatCurrency(grandTotalPayments)}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Scale className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Saldo Actual</span>
                    </div>
                    <p className={`text-2xl font-bold ${grandNet > 0 ? "text-red-600 dark:text-red-400" : grandNet < 0 ? "text-green-600 dark:text-green-400" : "text-zinc-600 dark:text-zinc-300"}`}>
                        {grandNet > 0 ? "Debe: " : grandNet < 0 ? "A favor: " : ""}
                        {formatCurrency(Math.abs(grandNet))}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">Arriendo − Abonos Totales</p>
                </div>
            </div>

            {/* Month Detail Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <h3 className="font-semibold text-lg dark:text-white flex items-center gap-2">
                        <Scale className="w-5 h-5 text-zinc-400" />
                        Detalle por Mes
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                        Los honorarios de administración y pagos se abonan al mes en que se registran.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 text-xs uppercase border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4">Mes</th>
                                <th className="px-6 py-4 text-right">Arriendo (Debe)</th>
                                <th className="px-6 py-4 text-right">Abonos (Haber)</th>
                                <th className="px-6 py-4 text-right">Balance Mes</th>
                                <th className="px-6 py-4 text-right">Saldo Acumulado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {displayed.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No hay datos disponibles.
                                    </td>
                                </tr>
                            ) : (
                                displayed.map((bucket) => {
                                    const totalBucketCredits = bucket.totalHoaCredit + bucket.totalCostCredit + bucket.totalPayments
                                    const hasDetails = bucket.hoaCredits.length > 0 || bucket.costCredits.length > 0 || bucket.payments.length > 0
                                    
                                    return (
                                        <tr
                                            key={`${bucket.year}-${bucket.month}`}
                                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="font-medium text-zinc-900 dark:text-white capitalize">
                                                    {bucket.label}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono text-red-600 dark:text-red-400">
                                                {formatCurrency(bucket.adminDebt)}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="font-mono font-medium text-green-600 dark:text-green-400">
                                                    -{formatCurrency(totalBucketCredits)}
                                                </div>
                                                {hasDetails && (
                                                    <details className="mt-2">
                                                        <summary className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300">
                                                            Ver Detalle
                                                        </summary>
                                                        <div className="mt-3 space-y-3 text-xs">
                                                            {/* HOA */}
                                                            {bucket.hoaCredits.length > 0 && (
                                                                <div className="space-y-1.5">
                                                                    <div className="text-[10px] uppercase font-bold text-zinc-400">Honorarios de Adm (HOA)</div>
                                                                    {bucket.hoaCredits.map((c, i) => (
                                                                        <div key={`hoa-${i}`} className="flex justify-between items-center gap-4 text-zinc-600 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-800/50 rounded px-2.5 py-1.5">
                                                                            <span className="truncate max-w-[150px]" title={c.reportLabel}>{c.propertyName}</span>
                                                                            <span className="font-mono text-green-600 dark:text-green-400 whitespace-nowrap">{formatCurrency(c.hoa)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            
                                                            {/* Global Costs */}
                                                            {bucket.costCredits.length > 0 && (
                                                                <div className="space-y-1.5">
                                                                    <div className="text-[10px] uppercase font-bold text-zinc-400">Gastos Globales Pagados por Admin</div>
                                                                    {bucket.costCredits.map((c, i) => (
                                                                        <div key={`cost-${i}`} className="flex justify-between items-center gap-4 text-zinc-600 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-800/50 rounded px-2.5 py-1.5">
                                                                            <span className="truncate max-w-[150px]">{c.description}</span>
                                                                            <span className="font-mono text-green-600 dark:text-green-400 whitespace-nowrap">{formatCurrency(c.amount)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Direct Payments */}
                                                            {bucket.payments.length > 0 && (
                                                                <div className="space-y-1.5">
                                                                    <div className="text-[10px] uppercase font-bold text-zinc-400">Abonos Directos</div>
                                                                    {bucket.payments.map((p, i) => (
                                                                        <div key={`pay-${i}`} className="flex justify-between items-center gap-4 text-zinc-600 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-800/50 rounded px-2.5 py-1.5">
                                                                            <div className="flex items-center gap-2 truncate">
                                                                                <span className="truncate">{p.note || "Abono a capital"}</span>
                                                                                {p.receiptLink && (
                                                                                    <a href={p.receiptLink} target="_blank" rel="noreferrer" title="Ver comprobante" className="text-primary hover:underline">
                                                                                        <Paperclip className="w-3 h-3 inline" />
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                            <span className="font-mono text-green-600 dark:text-green-400 whitespace-nowrap">{formatCurrency(p.amount)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </details>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
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
                                            <td className="px-6 py-5 text-right bg-zinc-50/50 dark:bg-zinc-800/30">
                                                <span
                                                    className={`font-mono font-bold text-sm ${
                                                        bucket.runningBalance > 0
                                                            ? "text-red-600 dark:text-red-400"
                                                            : bucket.runningBalance < 0
                                                            ? "text-green-600 dark:text-green-400"
                                                            : "text-zinc-600 dark:text-zinc-300"
                                                    }`}
                                                >
                                                    {formatCurrency(bucket.runningBalance)}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Legend */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                    <div className="flex flex-wrap items-center gap-6 text-[11px] uppercase tracking-wider font-medium text-zinc-500">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>
                                Propiedad: <strong className="text-zinc-800 dark:text-zinc-200">Santa Lucia del Bosque</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Minus className="w-3.5 h-3.5" />
                            <span>
                                Canon: <strong className="text-zinc-800 dark:text-zinc-200">{formatCurrency(ADMIN_MONTHLY_RENT)}/mes</strong>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
