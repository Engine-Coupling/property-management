"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, MapPin, Mail, Loader2 } from "lucide-react"

export default function NewPropertyPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get("name"),
            address: formData.get("address"),
            ownerEmail: formData.get("ownerEmail"),
        }

        try {
            const res = await fetch("/api/properties", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Failed to create property")
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
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Agregar Nueva Propiedad</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Registrar una nueva unidad inmobiliaria y asignar un propietario.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Nombre de la Propiedad</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                        <input
                            required
                            id="name"
                            name="name"
                            placeholder="Ej: Apartamento 301 - Torres del Sol"
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="address" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Dirección</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                        <input
                            required
                            id="address"
                            name="address"
                            placeholder="Dirección de la propiedad"
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="ownerEmail" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Email del Propietario</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                        <input
                            required
                            type="email"
                            id="ownerEmail"
                            name="ownerEmail"
                            placeholder="propietario@ejemplo.com"
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                        />
                    </div>
                    <p className="text-xs text-zinc-500">El propietario debe estar registrado o este email debe ser válido.</p>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Crear Propiedad
                    </button>
                </div>
            </form>
        </div>
    )
}
