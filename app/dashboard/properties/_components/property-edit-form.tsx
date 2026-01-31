"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { updateProperty } from "@/app/actions/properties"

interface PropertyEditFormProps {
    property: any
}

export function PropertyEditForm({ property }: PropertyEditFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        setError("")

        const res = await updateProperty(property.id, formData)

        if (res.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.push(`/dashboard/properties/${property.id}`)
            router.refresh() // Ensure new data is visible
        }
    }

    // Helper for date inputs
    const formatDateForInput = (date: Date | null) => {
        if (!date) return ""
        return new Date(date).toISOString().split('T')[0]
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={`/dashboard/properties/${property.id}`}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-zinc-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Editar Propiedad</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Actualizar información de {property.name}</p>
                </div>
            </div>

            <form action={handleSubmit} className="space-y-8">
                {error && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                {/* BASIC INFO */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                    <h2 className="text-lg font-semibold border-b border-zinc-100 dark:border-zinc-800 pb-2">Información Básica</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre</label>
                            <input
                                name="name"
                                defaultValue={property.name}
                                required
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Dirección</label>
                            <input
                                name="address"
                                defaultValue={property.address}
                                required
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Canon Mensual ($)</label>
                            <input
                                name="monthlyPayment"
                                type="number"
                                defaultValue={property.monthlyPayment}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">CHEC (Cuenta Servicios)</label>
                            <input
                                name="utilityAccount"
                                defaultValue={property.utilityAccount || ""}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* ACCESS & WIFI */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                    <h2 className="text-lg font-semibold border-b border-zinc-100 dark:border-zinc-800 pb-2">Acceso y Conectividad</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pin Puerta</label>
                            <input
                                name="doorPin"
                                defaultValue={property.doorPin || ""}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Clave Administración</label>
                            <input
                                name="managementPass"
                                defaultValue={property.managementPass || ""}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">WiFi SSID (2.4G)</label>
                            <input
                                name="wifiSsid"
                                defaultValue={property.wifiSsid || ""}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">WiFi SSID (5G)</label>
                            <input
                                name="wifiSsid5G"
                                defaultValue={property.wifiSsid5G || ""}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">WiFi Contraseña</label>
                            <input
                                name="wifiPass"
                                defaultValue={property.wifiPass || ""}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* TENANT INFO */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                    <h2 className="text-lg font-semibold border-b border-zinc-100 dark:border-zinc-800 pb-2">Información del Inquilino</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre Inquilino</label>
                            <input
                                name="tenantName"
                                defaultValue={property.tenantName || ""}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Inquilino</label>
                            <input
                                name="tenantEmail"
                                type="email"
                                defaultValue={property.tenantEmail || ""}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cédula (CC)</label>
                            <input
                                name="cedula"
                                defaultValue={property.cedula || ""}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fecha Inicio</label>
                                <input
                                    name="startDate"
                                    type="date"
                                    defaultValue={formatDateForInput(property.startDate)}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fecha Fin</label>
                                <input
                                    name="endDate"
                                    type="date"
                                    defaultValue={formatDateForInput(property.endDate)}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg focus:ring-2 focus:ring-primary outline-none dark:border-zinc-700 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 p-4 sticky bottom-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800">
                    <Link
                        href={`/dashboard/properties/${property.id}`}
                        className="px-6 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    )
}
