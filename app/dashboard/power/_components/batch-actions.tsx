"use client"

import { useState } from "react"
import { Eye, Trash2, FileText, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { deleteBatch } from "@/app/actions/delete-batch"

export function BatchActions({ dateIso }: { dateIso: string }) {
    const router = useRouter()
    const [deleting, setDeleting] = useState(false)

    const handleDelete = async () => {
        if (!window.confirm("ATENCIÓN: Borrar este registro eliminará permanentemente TODOS los gastos, reportes y rentas generados simultáneamente en este Lote (Batch). ¿Estás seguro que deseas revertir este bloque completo?")) {
            return
        }

        setDeleting(true)
        try {
            const res = await deleteBatch(dateIso)
            if (res?.error) {
                alert(`Error al eliminar: ${res.error}`)
            } else {
                alert("Bloque Histórico eliminado con éxito.")
                router.refresh()
            }
        } catch (error) {
            console.error("Delete error", error)
            alert("Error de conexión al eliminar.")
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <button
                onClick={() => router.push(`/dashboard/power/reports/${encodeURIComponent(dateIso)}`)}
                title="Ver Detalle y Re-Imprimir"
                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition"
            >
                <FileText className="w-4 h-4" />
            </button>
            <button
                onClick={handleDelete}
                disabled={deleting}
                title="Eliminar Reporte Masivo (Batch)"
                className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition disabled:opacity-50"
            >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
        </div>
    )
}
