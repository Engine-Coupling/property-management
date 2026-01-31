"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DollarSign, FileText, Link as LinkIcon, Calendar, Loader2 } from "lucide-react"

export default function ExpensesPage() {
    const router = useRouter()
    const params = useParams()
    const propertyId = params.id as string

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const fileInput = formData.get("receiptFile") as File
        let driveLink: string | null = null // Initialize driveLink as null or empty string

        // If file provided, upload it first
        if (fileInput && fileInput.size > 0) {
            try {
                const uploadFormData = new FormData()
                uploadFormData.append("file", fileInput)

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: uploadFormData,
                })

                if (!uploadRes.ok) throw new Error("File upload failed")

                const uploadData = await uploadRes.json()
                driveLink = uploadData.link
            } catch (uploadError) {
                console.error("Upload error:", uploadError)
                setError("Failed to upload receipt image")
                setLoading(false)
                return
            }
        }

        const data = {
            propertyId,
            description: formData.get("description"),
            amount: formData.get("amount"),
            category: formData.get("category"),
            date: formData.get("date"),
            receiptDriveLink: driveLink, // Use the potentially updated driveLink
        }

        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                throw new Error("Failed to add expense")
            }

            router.push("/dashboard/admin")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Reportar Cuota de Mantenimiento</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Agregar un nuevo registro de gasto para esta propiedad.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Descripción</label>
                    <div className="relative">
                        <FileText className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                        <input
                            required
                            id="description"
                            name="description"
                            placeholder="Ej: Reparación de plomería"
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Categoría</label>
                    <div className="relative">
                        <select
                            id="category"
                            name="category"
                            className="w-full pl-4 pr-10 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white appearance-none"
                            defaultValue="MAINTENANCE"
                        >
                            <option value="MAINTENANCE">Mantenimiento</option>
                            <option value="UTILITY">Servicios Públicos</option>
                            <option value="HOA">Administración</option>
                            <option value="OTHER">Otro</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="amount" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Monto (COP)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                        <input
                            required
                            type="number"
                            step="0.01"
                            id="amount"
                            name="amount"
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="date" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Fecha</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                        <input
                            type="date"
                            id="date"
                            name="date"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="receiptFile" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Recibo (Subir Imagen/PDF)</label>
                    <div className="relative">
                        <input
                            type="file"
                            id="receiptFile"
                            name="receiptFile"
                            accept="image/*,application/pdf"
                            className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                        />
                    </div>
                    <p className="text-xs text-zinc-500 text-center">O</p>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                        <input
                            type="url"
                            id="receiptDriveLink"
                            name="receiptDriveLink"
                            placeholder="Pegar enlace de Google Drive manualmente..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Enviar Reporte de Cuota
                    </button>
                </div>
            </form>
        </div>
    )
}
