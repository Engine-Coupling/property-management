"use client"

import { useState } from "react"
import { Download, Loader2, CheckCircle } from "lucide-react"

export function DbDownloadButton() {
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        setDone(false)

        try {
            const res = await fetch("/api/db/export")

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || "Export failed")
            }

            // Extract filename from Content-Disposition header
            const disposition = res.headers.get("Content-Disposition")
            const match = disposition?.match(/filename="(.+)"/)
            const filename = match?.[1] || "db-backup.json"

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)

            setDone(true)
            setTimeout(() => setDone(false), 3000)
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : "Failed to export database"}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exportando...
                </>
            ) : done ? (
                <>
                    <CheckCircle className="w-4 h-4" />
                    Descargado
                </>
            ) : (
                <>
                    <Download className="w-4 h-4" />
                    Descargar Base de Datos
                </>
            )}
        </button>
    )
}
