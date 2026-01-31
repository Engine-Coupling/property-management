import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Building2, Plus, DollarSign, Users } from "lucide-react"
import Link from "next/link"

/*
  Admin Dashboard:
  - Overview of all properties
  - Quick action to Add Property
  - Card view for each property with "Manage" link
*/

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
        redirect("/dashboard/owner")
    }

    const properties = await prisma.property.findMany({
        include: {
            owner: true,
            _count: {
                select: { expenses: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Tablero</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Resumen de propiedades</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/admin/batch"
                        className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium border border-zinc-200 dark:border-zinc-700"
                    >
                        Reportar Cuotas
                    </Link>
                    <Link
                        href="/dashboard/properties/new"
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Propiedad
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property: any) => (
                    <div key={property.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 transition-colors p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                <Building2 className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                Activo
                            </span>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg text-zinc-900 dark:text-white truncate">{property.name}</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{property.address}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-zinc-100 dark:border-zinc-800">
                            <div className="space-y-1">
                                <p className="text-xs text-zinc-400 uppercase font-bold">Propietario</p>
                                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                    <Users className="w-3 h-3" />
                                    <span className="truncate max-w-[100px]">{property.owner?.name || property.owner?.email || "Sin asignar"}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-zinc-400 uppercase font-bold">Gastos</p>
                                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                                    <DollarSign className="w-3 h-3" />
                                    <span>{property._count.expenses} registros</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href={`/dashboard/properties/${property.id}`}
                                className="flex-1 text-center px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors border border-zinc-200 dark:border-zinc-700"
                                prefetch={false}
                            >
                                Gestionar
                            </Link>
                        </div>
                    </div>
                ))}

                {/* Empty State Action */}
                {properties.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
                        <Building2 className="w-12 h-12 text-zinc-400 mb-4" />
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No se encontraron propiedades</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Comienza creando tu primera propiedad.</p>
                        <Link
                            href="/dashboard/properties/new"
                            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Agregar Propiedad
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
