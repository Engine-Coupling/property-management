"use client"

import { useState, useEffect } from "react"
import { createBatchReports } from "@/app/actions/batch-reports"
import { formatCurrency } from "@/lib/utils"
import { Calendar, DollarSign, Loader2, CheckCircle, Upload, FileText, Info } from "lucide-react"
import { BatchReportView } from "@/components/batch-report-view"

interface Property {
    id: string
    name: string
    monthlyPayment: number
}

export default function BatchReportPage() {
    const [properties, setProperties] = useState<Property[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Global Settings
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [utilityCost] = useState<number>(70000) // Fixed, user cannot change

    // Fees Configuration
    const [includeGas, setIncludeGas] = useState(false)
    const [gasAmount, setGasAmount] = useState<number>(0)
    const [gasFile, setGasFile] = useState<File | null>(null)

    const [includeCleanup, setIncludeCleanup] = useState(false)
    const CLEANUP_AMOUNT = 100000

    const [includeExtra, setIncludeExtra] = useState(false)
    const [extraAmount, setExtraAmount] = useState<number>(0)
    const [extraDesc, setExtraDesc] = useState("")
    const [extraFiles, setExtraFiles] = useState<FileList | null>(null)

    const [bankFile, setBankFile] = useState<File | null>(null)

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [results, setResults] = useState<any[]>([])

    // Special Cases State
    interface SpecialCase {
        propertyId: string
        name: string
        startDate: string
        endDate: string
        rent: number // Calculated
        hoa: number // Calculated
        utility: number // Calculated
        days: number
    }
    const [specialCases, setSpecialCases] = useState<SpecialCase[]>([])

    // New Special Case Form State
    const [scPropertyId, setScPropertyId] = useState("")
    const [scStart, setScStart] = useState("")
    const [scEnd, setScEnd] = useState("")

    // Calculation Helper
    const calculateSpecial = (pId: string, start: string, end: string) => {
        const prop = properties.find(p => p.id === pId)
        if (!prop || !start || !end) return null

        const s = new Date(start)
        const e = new Date(end)
        const diffTime = Math.abs(e.getTime() - s.getTime())
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Inclusive

        // Days in Month (based on report date 'date' state)
        // Actually, pro-ration usually depends on the specific month.
        // Let's use the month of the START date for the denominator base
        const daysInMonth = new Date(s.getFullYear(), s.getMonth() + 1, 0).getDate()

        const monthlyRent = prop.monthlyPayment || 0
        const monthlyUtil = utilityCost // Fixed global for now

        const proratedRent = Math.round((monthlyRent / daysInMonth) * days)
        const proratedUtil = Math.round((monthlyUtil / daysInMonth) * days)
        const proratedHOA = Math.round((proratedRent - proratedUtil) * 0.10)

        return { proratedRent, proratedUtil, proratedHOA, days }
    }

    const handleAddSpecial = () => {
        const calc = calculateSpecial(scPropertyId, scStart, scEnd)
        if (!calc) return

        const prop = properties.find(p => p.id === scPropertyId)

        setSpecialCases([...specialCases, {
            propertyId: scPropertyId,
            name: prop?.name || "Unknown",
            startDate: scStart,
            endDate: scEnd,
            rent: calc.proratedRent,
            hoa: calc.proratedHOA,
            utility: calc.proratedUtil,
            days: calc.days
        }])

        // Reset Form
        setScPropertyId("")
        setScStart("")
        setScEnd("")
    }

    const removeSpecial = (idx: number) => {
        const newCases = [...specialCases]
        newCases.splice(idx, 1)
        setSpecialCases(newCases)
    }

    useEffect(() => {
        fetch('/api/properties')
            .then(res => res.json())
            .then(data => {
                setProperties(data)
                setSelectedIds(data.map((p: any) => p.id))

                // Set default period (first to last of current month)
                const now = new Date()
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                setStartDate(firstDay.toISOString().split('T')[0])
                setEndDate(lastDay.toISOString().split('T')[0])
            })
    }, [])

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(properties.map(p => p.id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    const handleSubmit = async () => {
        if (selectedIds.length === 0 && specialCases.length === 0) return
        setLoading(true)

        try {
            let gasLink: string | null = null
            let bankLink: string | null = null
            let extraLinks: string[] = []

            // 1. Upload Files if needed
            if ((includeGas && gasFile) || (includeExtra && extraFiles && extraFiles.length > 0) || bankFile) {
                setUploading(true)
                const formData = new FormData()
                const month = date.slice(0, 7)

                if (includeGas && gasFile) {
                    formData.append("file_gas", gasFile)
                    formData.append("meta_gas", JSON.stringify({
                        propertyName: "BATCH_GAS",
                        amount: gasAmount,
                        month
                    }))
                }

                if (bankFile) {
                    formData.append("file_bank", bankFile)
                    formData.append("meta_bank", JSON.stringify({
                        propertyName: "BATCH_REPORT",
                        periodStart: startDate,
                        periodEnd: endDate,
                        month
                    }))
                }

                if (includeExtra && extraFiles) {
                    Array.from(extraFiles).forEach((file, i) => {
                        formData.append(`file_extra_${i}`, file)
                        formData.append(`meta_extra_${i}`, JSON.stringify({
                            propertyName: "BATCH_EXTRA",
                            amount: extraAmount,
                            month
                        }))
                    })
                }

                const uploadRes = await fetch('/api/upload/batch', {
                    method: 'POST',
                    body: formData
                })

                if (!uploadRes.ok) throw new Error("Batch upload failed")
                const uploadData = await uploadRes.json()

                if (uploadData.links) {
                    if (uploadData.links['gas']) gasLink = uploadData.links['gas']
                    if (uploadData.links['bank']) bankLink = uploadData.links['bank']
                    // Collect extra links
                    extraLinks = Object.keys(uploadData.links)
                        .filter(k => k.startsWith('extra_'))
                        .map(k => uploadData.links[k])
                }
                setUploading(false)
            }

            // 2. Submit reports
            const res = await createBatchReports({
                propertyIds: selectedIds,
                utilityCost,
                date,
                period: { start: startDate, end: endDate },
                batchId: Date.now().toString(),
                bankLink,
                fees: {
                    gas: includeGas ? { amount: gasAmount, receiptLink: gasLink } : null,
                    cleanup: includeCleanup, // fixed 100k
                    extra: includeExtra ? { amount: extraAmount, description: extraDesc, receiptLinks: extraLinks } : null
                },
                specialCases: specialCases.map(sc => ({
                    propertyId: sc.propertyId,
                    rent: sc.rent,
                    hoa: sc.hoa,
                    startDate: sc.startDate,
                    endDate: sc.endDate
                }))
            })

            setSubmitted(true)
            setResults(res.results)
        } catch (error) {
            console.error(error)
            alert("Failed to process batch. Please try again.")
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    // Calculations
    // 1. Sum up all individual property Contributions (Rent - HOA)
    const totalPropertyNet = selectedIds.reduce((acc, id) => {
        const prop = properties.find(p => p.id === id)
        if (!prop) return acc
        const rent = prop.monthlyPayment || 0
        const hoa = (rent - utilityCost) * 0.10
        const propNet = rent - Math.max(0, hoa)
        return acc + propNet
    }, 0) + specialCases.reduce((acc, sc) => {
        // Net = Rent - HOA (Owner keeps prorated utility, but utility is implicitly kept by owner in the equation)
        // Wait, standard equation: Owner Payout = Rent - HOA - Global.
        // Utility deduction is internal to how HOA is calculated.

        // For special cases: Rent is the GROSS prorated rent.
        // HOA is the calculated HOA.
        // So Owner gets Rent - HOA.
        return acc + (sc.rent - sc.hoa)
    }, 0)

    const totalHOA = selectedIds.reduce((acc, id) => {
        const prop = properties.find(p => p.id === id)
        if (!prop) return acc
        const rent = prop.monthlyPayment || 0
        const hoa = (rent - utilityCost) * 0.10
        return acc + Math.max(0, hoa)
    }, 0) + specialCases.reduce((acc, sc) => acc + sc.hoa, 0)

    // 2. Subtract Global Fees ONCE
    const gas = includeGas ? gasAmount : 0
    const cleanup = includeCleanup ? CLEANUP_AMOUNT : 0
    const extra = includeExtra ? extraAmount : 0

    const finalOwnerPayout = totalPropertyNet - gas - cleanup - extra

    if (submitted) {
        return (
            <BatchReportView
                results={results}
                properties={properties}
                specialCases={specialCases}
                fees={{
                    gas: includeGas ? { amount: gasAmount, file: gasFile } : undefined,
                    cleanup: includeCleanup,
                    extra: includeExtra ? { amount: extraAmount, description: extraDesc, files: extraFiles } : undefined
                }}
                bankFile={bankFile}
                dates={{
                    reportDate: date,
                    start: startDate,
                    end: endDate
                }}
                totals={{
                    propertyNet: totalPropertyNet,
                    hoa: totalHOA,
                    deductions: gas + cleanup + extra,
                    payout: finalOwnerPayout
                }}
                utilityCost={utilityCost}
            />
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Reporte Mensual Masivo</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Generar registros mensuales de Renta, Servicios y Administración (HOA) para múltiples propiedades.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Col: Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6">
                        <h3 className="font-semibold text-lg dark:text-white">Configuración Global</h3>

                        {/* Basic Settings */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-500 uppercase">Fecha de Reporte</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-500 uppercase">Costo de Servicios (Fijo)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                                    <input
                                        type="number"
                                        value={utilityCost}
                                        disabled
                                        className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500 uppercase">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-500 uppercase">Fecha Fin</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                <label className="text-sm font-medium dark:text-white flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Consignación Bancaria
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        onChange={e => setBankFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="bank-upload"
                                    />
                                    <label htmlFor="bank-upload" className="w-full px-4 py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-500 text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        {bankFile ? (
                                            <span className="text-primary font-medium">{bankFile.name}</span>
                                        ) : (
                                            "Clic para subir comprobante de pago"
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <hr className="border-zinc-100 dark:border-zinc-800" />

                        {/* Additional Fees */}
                        <div className="space-y-6">
                            {/* Gas Fee */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeGas}
                                            onChange={e => setIncludeGas(e.target.checked)}
                                            className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium dark:text-white">Costo de Gas</span>
                                    </label>
                                </div>
                                {includeGas && (
                                    <div className="pl-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        <input
                                            type="number"
                                            placeholder="Monto"
                                            value={gasAmount}
                                            onChange={e => setGasAmount(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                onChange={e => setGasFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="gas-upload"
                                            />
                                            <label htmlFor="gas-upload" className="flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline">
                                                <Upload className="w-3 h-3" />
                                                {gasFile ? gasFile.name : "Subir Recibo"}
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cleanup Fee */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeCleanup}
                                        onChange={e => setIncludeCleanup(e.target.checked)}
                                        className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium dark:text-white">Servicio de Aseo</span>
                                </label>
                                {includeCleanup && (
                                    <div className="pl-6 text-sm text-zinc-500 animate-in slide-in-from-top-2 duration-200">
                                        Costo Fijo: <span className="font-medium text-zinc-900 dark:text-white">{formatCurrency(CLEANUP_AMOUNT)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Extra Fee */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeExtra}
                                        onChange={e => setIncludeExtra(e.target.checked)}
                                        className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium dark:text-white">Costo Extra</span>
                                </label>
                                {includeExtra && (
                                    <div className="pl-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        <input
                                            type="number"
                                            placeholder="Monto"
                                            value={extraAmount}
                                            onChange={e => setExtraAmount(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Descripción"
                                            value={extraDesc}
                                            onChange={e => setExtraDesc(e.target.value)}
                                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white"
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                multiple
                                                onChange={e => setExtraFiles(e.target.files)}
                                                className="hidden"
                                                id="extra-upload"
                                            />
                                            <label htmlFor="extra-upload" className="flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline">
                                                <Upload className="w-3 h-3" />
                                                {extraFiles ? `${extraFiles.length} archivos seleccionados` : "Subir Recibos (Múltiple)"}
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Total Administración:</span>
                                <span className="font-medium text-orange-500">{formatCurrency(totalHOA)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Neto de Propiedades (Renta - HOA):</span>
                                <span className="font-medium dark:text-white">{formatCurrency(totalPropertyNet)}</span>
                            </div>
                            {(includeGas || includeCleanup || includeExtra) && (
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Menos Costos Globales:</span>
                                    <span>-{formatCurrency(gas + cleanup + extra)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                <span className="text-zinc-900 dark:text-white font-semibold">Pago Total al Propietario:</span>
                                <span className="font-bold text-blue-500 text-lg">{formatCurrency(finalOwnerPayout)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || (selectedIds.length === 0 && specialCases.length === 0)}
                            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {uploading ? "Subiendo Archivos..." : "Generando Reportes..."}
                                </>
                            ) : "Aprobar y Generar"}
                        </button>
                    </div>
                </div>

                {/* Right Col: Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === properties.length && properties.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium dark:text-zinc-300">Seleccionar Todas</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Info className="w-3 h-3" />
                                <span>Neto por Propiedad = Renta - Administración</span>
                            </div>
                        </div>

                        {/* Special Cases Section */}
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-b border-zinc-200 dark:border-zinc-800">
                            <h4 className="text-sm font-bold text-amber-700 dark:text-amber-500 mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                Casos Especiales / Prorrateados
                            </h4>

                            {/* List of Added Specials */}
                            <div className="space-y-2 mb-4">
                                {specialCases.map((sc, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-zinc-800 p-2 rounded border border-amber-200 dark:border-amber-800">
                                        <div className="text-xs">
                                            <span className="font-bold">{sc.name}</span>
                                            <span className="mx-2 text-zinc-400">|</span>
                                            {sc.startDate} a {sc.endDate} ({sc.days} días)
                                            <span className="mx-2 text-zinc-400">|</span>
                                            Renta: {formatCurrency(sc.rent)} • HOA: {formatCurrency(sc.hoa)}
                                        </div>
                                        <button onClick={() => removeSpecial(idx)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                                    </div>
                                ))}
                            </div>

                            {/* Add New Special */}
                            <div className="grid grid-cols-4 gap-2 items-end">
                                <div className="col-span-1">
                                    <label className="text-xs font-medium text-zinc-500">Propiedad</label>
                                    <select
                                        value={scPropertyId}
                                        onChange={e => setScPropertyId(e.target.value)}
                                        className="w-full text-xs p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {properties
                                            .filter(p => !selectedIds.includes(p.id) && !specialCases.some(sc => sc.propertyId === p.id))
                                            .map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-500">Inicio</label>
                                    <input type="date" value={scStart} onChange={e => setScStart(e.target.value)} className="w-full text-xs p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-500">Fin</label>
                                    <input type="date" value={scEnd} onChange={e => setScEnd(e.target.value)} className="w-full text-xs p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800" />
                                </div>
                                <button
                                    onClick={handleAddSpecial}
                                    disabled={!scPropertyId || !scStart || !scEnd}
                                    className="bg-amber-500 text-white text-xs px-3 py-2 rounded hover:bg-amber-600 disabled:opacity-50"
                                >
                                    Agregar Especial
                                </button>
                            </div>
                            {/* Preview Calc */}
                            {scPropertyId && scStart && scEnd && (
                                <div className="mt-2 text-xs text-zinc-500">
                                    Vista Previa: Renta {formatCurrency(calculateSpecial(scPropertyId, scStart, scEnd)?.proratedRent || 0)} •
                                    HOA {formatCurrency(calculateSpecial(scPropertyId, scStart, scEnd)?.proratedHOA || 0)}
                                </div>
                            )}
                        </div>

                        <div className="overflow-y-auto max-h-[500px]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50">
                                    <tr>
                                        <th className="px-6 py-3 w-10"></th>
                                        <th className="px-6 py-3">Propiedad</th>
                                        <th className="px-6 py-3 text-right">Renta</th>
                                        <th className="px-6 py-3 text-right">Administración (10%)</th>
                                        <th className="px-6 py-3 text-right">Neto Prop</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {properties.map(p => {
                                        const rent = p.monthlyPayment || 0
                                        const hoa = (rent - utilityCost) * 0.10
                                        // Net = Rent - HOA
                                        const propNet = rent - Math.max(0, hoa)
                                        const isSelected = selectedIds.includes(p.id)

                                        return (
                                            <tr key={p.id} className={`transition-colors ${isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelect(p.id)}
                                                        className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 font-medium dark:text-white">
                                                    {p.name}
                                                </td>
                                                <td className="px-6 py-4 text-right text-zinc-500 dark:text-zinc-400">
                                                    {formatCurrency(rent)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-zinc-500">
                                                    {formatCurrency(Math.max(0, hoa))}
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-green-400">
                                                    {formatCurrency(propNet)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
