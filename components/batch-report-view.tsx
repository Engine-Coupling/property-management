import { formatCurrency } from "@/lib/utils"
import { CheckCircle, FileText, Download, Printer } from "lucide-react"

interface BatchReportViewProps {
    results: any[]
    properties: any[]
    fees: {
        gas?: { amount: number, file?: File | null, meta?: any }
        cleanup?: boolean
        extra?: { amount: number, description: string, files?: FileList | null }
    }
    bankFile?: File | null
    specialCases?: Array<{
        propertyId: string
        name: string
        startDate: string
        endDate: string
        rent: number
        hoa: number
        utility: number
        days: number
    }>
    dates: {
        reportDate: string
        start: string
        end: string
    }
    totals: {
        propertyNet: number
        hoa: number
        deductions: number
        payout: number
    }
    utilityCost: number
}

export function BatchReportView({ results, properties, fees, dates, totals, utilityCost, bankFile, specialCases = [] }: BatchReportViewProps) {
    // Merge standard active properties AND special properties for the list
    const activeProperties = properties.filter(p => results.some(r => r.propertyId === p.id && r.status === 'success'))

    // We want a unified list for the table.
    // Standard properties are those in 'activeProperties' that are NOT in specialCases (though logic prevents overlap)
    // Actually, createBatchReports returns results for BOTH.
    // So 'activeProperties' contains both standard and special.
    // We need to distinguish them during render.

    // Calculate accurate Total Utility Deductions
    const totalUtilityDeductions = activeProperties.reduce((sum, p) => {
        const special = specialCases?.find(sc => sc.propertyId === p.id)
        return sum + (special ? special.utility : utilityCost)
    }, 0)

    const handlePrint = () => {
        window.print()
    }

    // Helper to render file preview
    const renderFilePreview = (file: File | null | undefined, label: string) => {
        if (!file) return null
        // Create object URL for immediate preview without uploading/fetching
        const url = URL.createObjectURL(file)

        return (
            <div className="flex flex-col items-center space-y-2 break-inside-avoid">
                <span className="text-sm font-medium text-zinc-500 uppercase">{label}</span>
                <div className="border border-zinc-200 rounded-lg p-2 bg-white">
                    {file.type.startsWith('image/') ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={url}
                            alt={label}
                            className="max-h-[300px] object-contain rounded"
                            onLoad={() => URL.revokeObjectURL(url)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 w-32 bg-zinc-50">
                            <FileText className="w-8 h-8 text-zinc-400" />
                            <span className="text-xs text-zinc-500 mt-2 text-center break-all px-2">{file.name}</span>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto bg-white min-h-screen text-zinc-900 print:text-black">
            {/* Validation / Success Details */}
            <div className="print:hidden space-y-6 mb-8 text-center p-8 bg-zinc-50 rounded-xl border border-zinc-200">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                    <h1 className="text-2xl font-bold">Reporte Generado Exitosamente</h1>
                    <p className="text-zinc-500">Listo para imprimir o guardar como PDF.</p>
                </div>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir / Guardar PDF
                    </button>
                    <button
                        onClick={() => window.location.href = "/dashboard/fees"}
                        className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-6 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                        Listo
                    </button>
                </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 space-y-8 print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-zinc-900 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-tight">Reporte Mensual</h1>
                        <p className="text-zinc-500 mt-1">Estado de Cuenta Mensual de Gestión Inmobiliaria</p>
                    </div>
                    <div className="text-right space-y-1 text-sm">
                        <p><span className="font-semibold">Fecha:</span> {dates.reportDate}</p>
                        <p><span className="font-semibold">Periodo:</span> {dates.start} a {dates.end}</p>
                        <p className="hidden"><span className="font-semibold">ID Lote:</span> {new Date().getTime().toString().slice(-6)}</p>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4 border-b border-zinc-200 pb-2">Resumen Financiero</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span>Renta Bruta Total:</span>
                                <span className="font-mono">{formatCurrency(totals.propertyNet + totals.hoa)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-600">
                                <span>Deducciones de Servicios Públicos ({activeProperties.length}):</span>
                                <span className="font-mono text-red-600">-{formatCurrency(totalUtilityDeductions)}</span>
                            </div>
                            <div className="flex justify-between text-zinc-600">
                                <span>Administración (10%):</span>
                                <span className="font-mono text-red-600">-{formatCurrency(totals.hoa)}</span>
                            </div>
                            <div className="flex justify-between border-t border-zinc-200 pt-2 font-semibold">
                                <span>Neto de Propiedades:</span>
                                <span className="font-mono">{formatCurrency(totals.propertyNet)}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4 border-b border-zinc-200 pb-2">Tarifas y Deducciones</h3>
                        <div className="space-y-3 text-sm">
                            {fees.gas?.amount ? (
                                <div className="flex justify-between">
                                    <span>Costo de Gas:</span>
                                    <span className="font-mono text-red-600">-{formatCurrency(fees.gas.amount)}</span>
                                </div>
                            ) : null}
                            {fees.cleanup ? (
                                <div className="flex justify-between">
                                    <span>Servicio de Aseo:</span>
                                    <span className="font-mono text-red-600">-{formatCurrency(100000)}</span>
                                </div>
                            ) : null}
                            {fees.extra?.amount ? (
                                <div className="flex justify-between">
                                    <span>Extra ({fees.extra.description}):</span>
                                    <span className="font-mono text-red-600">-{formatCurrency(fees.extra.amount)}</span>
                                </div>
                            ) : null}
                            <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold text-lg">
                                <span>Pago Total al Propietario:</span>
                                <span className="font-mono text-blue-600 border-b-2 border-double border-blue-600">{formatCurrency(totals.payout)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Property Detail Table */}
                <div>
                    <h3 className="text-sm font-bold uppercase text-zinc-500 mb-4 border-b border-zinc-200 pb-2">Desglose de Propiedades</h3>
                    <table className="w-full text-sm text-center">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-100 print:bg-transparent border-b border-zinc-300">
                            <tr>
                                <th className="px-4 py-2 text-left">Propiedad</th>
                                <th className="px-4 py-2 text-right">Renta</th>
                                <th className="px-4 py-2 text-right">Administración (10%)</th>
                                <th className="px-4 py-2 text-right">Neto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                            {activeProperties.map(p => {
                                // Check if Special
                                const special = specialCases?.find(sc => sc.propertyId === p.id)

                                let rent, hoa, util, net;
                                let note = null;

                                if (special) {
                                    rent = special.rent
                                    hoa = special.hoa
                                    util = special.utility
                                    net = rent - hoa
                                    note = `(${special.startDate} - ${special.endDate})`
                                } else {
                                    rent = p.monthlyPayment || 0
                                    hoa = Math.max(0, (rent - utilityCost) * 0.10)
                                    util = utilityCost
                                    net = rent - hoa
                                }

                                return (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3 text-left">
                                            <div className="font-medium">{p.name}</div>
                                            {note && <div className="text-xs text-zinc-500 italic">{note}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-right text-zinc-600">{formatCurrency(rent)}</td>
                                        <td className="px-4 py-3 text-right text-red-600">-{formatCurrency(hoa)}</td>
                                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(net)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Receipts Section - Page Break Before if needed */}
                <div className="pt-8 break-before-page">
                    <h3 className="text-sm font-bold uppercase text-zinc-500 mb-6 border-b border-zinc-200 pb-2">Recibos Adjuntos</h3>
                    <div className="grid grid-cols-2 gap-8">
                        {fees.gas?.file && renderFilePreview(fees.gas.file, "Recibo de Gas")}

                        {fees.extra?.files && Array.from(fees.extra.files).map((file, i) => (
                            <div key={i}>
                                {renderFilePreview(file, `Recibo Extra ${i + 1}`)}
                            </div>
                        ))}

                        {/* Bank File */}
                        {bankFile && renderFilePreview(bankFile, "Consignación Bancaria")}
                    </div>
                </div>
            </div>
        </div>
    )
}
