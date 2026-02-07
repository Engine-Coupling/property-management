import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Wifi, Key, MapPin, DollarSign, Calendar, FileText, Plus, CreditCard } from "lucide-react"
import Link from "next/link"

export default async function PropertyDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session) redirect("/")

    const property = await prisma.property.findUnique({
        where: { id: params.id },
        include: {
            owner: true,
            expenses: {
                orderBy: { date: 'desc' },
            },
            payments: {
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (!property) notFound()

    // RBAC Check
    const isAdmin = session.user.role === "ADMIN"
    const isPowerAdmin = session.user.role === "POWER_ADMIN"
    const isOwner = property.ownerId === session.user.id

    if (!isAdmin && !isPowerAdmin && !isOwner) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600">Acceso Denegado</h2>
                <p>No tienes permiso para ver esta propiedad.</p>
                <Link href="/dashboard" className="text-primary hover:underline mt-4 block">Volver al Tablero</Link>
            </div>
        )
    }

    // Calculate stats
    const totalExpenses = property.expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0)
    const pendingPayments = property.payments.filter((p: any) => p.status === "PENDING")

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{property.name}</h1>
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{property.address}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isPowerAdmin && (
                        <Link
                            href={`/dashboard/properties/${property.id}/edit`}
                            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Editar Propiedad
                        </Link>
                    )}
                    {isPowerAdmin && (
                        <>
                            <Link
                                href={`/dashboard/properties/${property.id}/expenses`}
                                className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Cuota
                            </Link>
                            <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                                <CreditCard className="w-4 h-4" />
                                Generar Pago
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            {/* Property Details Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-zinc-200 dark:divide-zinc-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Apartamento</span>
                            <span className="font-medium text-lg text-zinc-900 dark:text-white">{property.name}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Pin Puerta</span>
                            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-900 dark:text-zinc-100">{property.doorPin || "-"}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">CHEC (Utility Account)</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{property.utilityAccount || "-"}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Inquilino (Tenant)</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{property.tenantName || "-"}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Red 2.4G</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{property.wifiSsid || "-"}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Contraseña WiFi</span>
                            <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">{property.wifiPass || "-"}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Red 5G</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{property.wifiSsid5G || "-"}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Correo</span>
                            <span className="text-sm text-zinc-900 dark:text-zinc-100">{property.tenantEmail || "-"}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">CC (Cédula)</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{property.cedula || "-"}</span>
                        </div>
                        <div>
                            {/* Financial Quick View */}
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Canon Actual</span>
                            <span className="font-medium text-emerald-600">${property.monthlyPayment?.toLocaleString()}</span>

                            <span className="text-xs font-bold text-zinc-500 uppercase block mt-2 mb-1">Depósito</span>
                            <span className="font-medium text-blue-600">${property.deposit?.toLocaleString() || "0"}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Fecha Inicio</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{property.startDate ? new Date(property.startDate).toLocaleDateString() : "-"}</span>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">Fecha Terminación</span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{property.endDate ? new Date(property.endDate).toLocaleDateString() : "-"}</span>
                        </div>
                    </div>
                </div>
            </div>


            {/* Expenses List */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Historial de Gastos</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Fecha</th>
                                <th className="px-6 py-3 font-medium">Descripción</th>
                                <th className="px-6 py-3 font-medium">Monto</th>
                                <th className="px-6 py-3 font-medium">Recibo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {property.expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No hay gastos registrados.</td>
                                </tr>
                            ) : (
                                property.expenses.map((expense: any) => (
                                    <tr key={expense.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                                <Calendar className="w-4 h-4 text-zinc-400" />
                                                {new Date(expense.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">{expense.description}</td>
                                        <td className="px-6 py-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">${expense.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            {expense.receiptDriveLink ? (
                                                <a href={expense.receiptDriveLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                    <FileText className="w-4 h-4" />
                                                    Ver
                                                </a>
                                            ) : (
                                                <span className="text-zinc-400">-</span>
                                            )}
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
