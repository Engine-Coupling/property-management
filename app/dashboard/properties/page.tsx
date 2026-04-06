import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Building2, Plus, Search, Phone, KeyRound, User } from "lucide-react"
import Link from "next/link"

export default async function PropertiesPage() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "POWER_ADMIN")) {
        redirect("/dashboard/owner")
    }

    const properties = await prisma.property.findMany({
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Propiedades</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Gestionar y rastrear todas las propiedades.</p>
                </div>

                {session.user.role === "POWER_ADMIN" && (
                    <Link
                        href="/dashboard/properties/new"
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Propiedad
                    </Link>
                )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium uppercase border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4">Propiedad</th>
                                <th className="px-6 py-4">Dirección</th>
                                <th className="px-6 py-4">Inquilino</th>
                                <th className="px-6 py-4">Pin Puerta</th>
                                <th className="px-6 py-4">Teléfono Inquilino</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {properties.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                                        No se encontraron propiedades.
                                    </td>
                                </tr>
                            ) : (
                                properties.map((property: any) => (
                                    <tr key={property.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                                    <Building2 className="w-4 h-4 text-zinc-500" />
                                                </div>
                                                {property.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                            {property.address}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                                                <User className="w-4 h-4 text-zinc-400" />
                                                <span className="truncate max-w-[150px]" title={property.tenantName || "Sin inquilino"}>
                                                    {property.tenantName || "Sin inquilino"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                <KeyRound className="w-4 h-4 text-zinc-400" />
                                                <span className="font-mono">{property.doorPin || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-zinc-400" />
                                                {property.tenantPhone || "—"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/dashboard/properties/${property.id}`}
                                                className="text-primary hover:underline font-medium"
                                            >
                                                Gestionar
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    )
}
