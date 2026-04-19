import prisma from "@/lib/prisma"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, Printer, AlertTriangle, ExternalLink } from "lucide-react"

export default async function HistoricBatchPage(props: { params: Promise<{ date: string }> }) {
    const params = await props.params;
    const rawDate = decodeURIComponent(params.date)
    const targetDate = new Date(rawDate)

    const reports = await prisma.monthlyReport.findMany({
        where: { reportDate: targetDate },
        include: { property: true }
    })

    const expenses = await prisma.expense.findMany({
        where: { date: targetDate }
    })

    if (!reports || reports.length === 0) {
        return (
            <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-12 h-12 text-zinc-400 mb-4" />
                <h1 className="text-2xl font-bold">Bloque No Encontrado</h1>
                <p className="text-zinc-500 mb-6">El reporte que intentas abrir ha sido eliminado o la fecha proveída es inválida.</p>
                <Link href="/dashboard/power" className="bg-primary text-white py-2 px-6 rounded-lg font-medium">Volver a Historial</Link>
            </div>
        )
    }

    const { startDate, endDate } = reports[0]

    // Separate Expenses
    const gasFee = expenses.find(e => e.description.includes("Gas"))
    const cleanupFee = expenses.find(e => e.description.includes("Cleanup"))
    const extraFee = expenses.find(e => e.description.includes("Extra"))
    const depositFee = expenses.find(e => e.description.includes("Depósito"))
    const batchRepInfo = expenses.find(e => e.description.includes("Batch Report"))

    const totalPropertyRent = reports.reduce((s, r) => s + r.totalRent, 0)
    const totalPropertyHoa = reports.reduce((s, r) => s + r.totalHoa, 0)
    const totalPayout = reports.reduce((s, r) => s + r.payout, 0)

    // Reverse engineering properties net
    const globalDeductionsSum = (gasFee?.amount || 0) + (cleanupFee?.amount || 0) + (extraFee?.amount || 0)
    const totalPropertyNet = totalPropertyRent - totalPropertyHoa

    return (
        <div className="bg-white min-h-screen text-slate-900 pb-20">
            {/* Header controls. Visible in UI, hidden on print */}
            <div className="max-w-4xl mx-auto p-4 mb-4 flex justify-between items-center print:hidden border-b border-zinc-200">
                <Link href="/dashboard/power" className="flex items-center gap-2 text-primary font-medium hover:underline">
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Historial
                </Link>
                <button
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
                >
                    <script dangerouslySetInnerHTML={{ __html: `
                        if (document.currentScript) document.currentScript.parentElement.onclick = function() { window.print() }
                    `}} />
                    <Printer className="w-4 h-4" />
                    Imprimir / Descargar PDF
                </button>
            </div>

            {/* Printable Ticket Area */}
            <div className="max-w-4xl mx-auto p-8 print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-zinc-900 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-tight">Reporte Mensual <span className="text-zinc-400 text-lg ml-2">(ARCHIVADO)</span></h1>
                        <p className="text-zinc-500 mt-1">Reconstrucción Histórica del Lote Generado</p>
                    </div>
                    <div className="text-right space-y-1 text-sm">
                        <p><span className="font-semibold">Emitido en Sistema:</span> {format(targetDate, "dd MMM yyyy, HH:mm", { locale: es })}</p>
                        <p><span className="font-semibold">Periodo:</span> {format(startDate, "dd MMM", { locale: es })} a {format(endDate, "dd MMM", { locale: es })}</p>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-8 my-8">
                    <div>
                        <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4 border-b border-zinc-200 pb-2">Resumen de Propiedades</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Renta Bruta Capturada:</span>
                                <span className="font-mono">{formatCurrency(totalPropertyRent)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-600">
                                <span>Total Honorarios Administrativos (HOA):</span>
                                <span className="font-mono text-red-600">-{formatCurrency(totalPropertyHoa)}</span>
                            </div>
                            <div className="flex justify-between border-t border-zinc-200 pt-2 font-semibold">
                                <span>Neto Aportado por Propiedades:</span>
                                <span className="font-mono">{formatCurrency(totalPropertyNet)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4 border-b border-zinc-200 pb-2">Gastos Globales Emitidos Simultáneamente</h3>
                        <div className="space-y-3 text-sm">
                            {gasFee ? (
                                <div className="flex justify-between items-center group">
                                    <span>Costo de Gas:</span>
                                    <div className="flex items-center gap-2">
                                        {gasFee.receiptDriveLink && <a href={gasFee.receiptDriveLink} target="_blank" className="text-blue-500 print:hidden" rel="noreferrer"><ExternalLink className="w-3 h-3" /></a>}
                                        <span className="font-mono text-red-600">-{formatCurrency(gasFee.amount)}</span>
                                    </div>
                                </div>
                            ) : null}
                            {cleanupFee ? (
                                <div className="flex justify-between">
                                    <span>Servicio de Aseo Fijo:</span>
                                    <span className="font-mono text-red-600">-{formatCurrency(cleanupFee.amount)}</span>
                                </div>
                            ) : null}
                            {extraFee ? (
                                <div className="flex justify-between items-center">
                                    <span>Gastos Extra ({extraFee.description}):</span>
                                    <div className="flex items-center gap-2">
                                        {extraFee.receiptDriveLink && <a href={extraFee.receiptDriveLink.split(",")[0]} target="_blank" className="text-blue-500 print:hidden" rel="noreferrer"><ExternalLink className="w-3 h-3" /></a>}
                                        <span className="font-mono text-red-600">-{formatCurrency(extraFee.amount)}</span>
                                    </div>
                                </div>
                            ) : null}
                            {depositFee ? (
                                <div className="flex justify-between items-center text-green-700 font-medium">
                                    <span>Depósito Entrante ({depositFee.description}):</span>
                                    <div className="flex items-center gap-2">
                                        {depositFee.receiptDriveLink && <a href={depositFee.receiptDriveLink} target="_blank" className="text-green-500 print:hidden" rel="noreferrer"><ExternalLink className="w-3 h-3" /></a>}
                                        <span className="font-mono">+{formatCurrency(depositFee.amount)}</span>
                                    </div>
                                </div>
                            ) : null}
                            
                            {globalDeductionsSum === 0 && !depositFee && (
                                <p className="text-zinc-400 italic text-center py-2">Ningún gasto global deducido en este ciclo.</p>
                            )}

                            <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold text-lg">
                                <span>Distribuido al Propietario (Liquidado):</span>
                                <span className="font-mono text-blue-600 border-b-2 border-double border-blue-600">{formatCurrency(totalPayout)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Batch Support Receipt */}
                {batchRepInfo?.receiptDriveLink && (
                    <div className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center print:hidden">
                        <div className="flex flex-col">
                            <span className="font-bold text-amber-800 text-sm">Gasto Registrado con Comprobante Bancario de Lote</span>
                            <span className="text-xs text-amber-600 mt-1">Este bloque de pagos incluyó una consignación bancaria oficial al realizarse la declaración.</span>
                        </div>
                        <a href={batchRepInfo.receiptDriveLink} target="_blank" className="text-amber-700 bg-amber-200/50 hover:bg-amber-200 px-4 py-2 rounded-lg font-medium text-sm transition" rel="noreferrer">
                            Abrir Consignación
                        </a>
                    </div>
                )}

                {/* Properties Break Down */}
                <div>
                    <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4 border-b border-zinc-200 pb-2">Informes Individuales Atados (Desglose de Base de Datos)</h3>
                    <table className="w-full text-sm text-center">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 print:bg-transparent border-b border-zinc-300">
                            <tr>
                                <th className="px-4 py-3 text-left">Propiedad</th>
                                <th className="px-4 py-3 text-right">Renta Total Reportada</th>
                                <th className="px-4 py-3 text-right">HOA Extraída</th>
                                <th className="px-4 py-3 text-right">Carga Global Deducida Aquí</th>
                                <th className="px-4 py-3 text-right">Monto Aprobado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {reports.map(r => (
                                <tr key={r.id}>
                                    <td className="px-4 py-3 text-left font-medium">{r.property.name}</td>
                                    <td className="px-4 py-3 text-right text-zinc-600">{formatCurrency(r.totalRent)}</td>
                                    <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(r.totalHoa)}</td>
                                    <td className="px-4 py-3 text-right text-red-400">
                                        {r.totalDeductions > 0 ? `-${formatCurrency(r.totalDeductions)}` : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-blue-600">{formatCurrency(r.payout)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    )
}
