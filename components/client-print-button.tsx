"use client"

import { Printer } from "lucide-react"

export function ClientPrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
        >
            <Printer className="w-4 h-4" />
            Imprimir / Descargar PDF
        </button>
    )
}
