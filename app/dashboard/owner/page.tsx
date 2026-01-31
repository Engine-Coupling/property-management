import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Building2, DollarSign } from "lucide-react"
import Link from "next/link"

export default async function OwnerDashboard() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/")
    }

    // If Admin tries to access, maybe let them? Or redirect to Admin dash?
    // Usually clean to keep them separate.
    if (session.user.role === "ADMIN") {
        redirect("/dashboard/admin")
    }

    const properties = await prisma.property.findMany({
        where: {
            ownerId: session.user.id,
        },
        include: {
            _count: {
                select: { expenses: true },
            },
        },
    })

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">My Properties</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Manage your real estate investments</p>
            </div>

            {properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
                    <Building2 className="w-12 h-12 text-zinc-400 mb-4" />
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No properties assigned</h3>
                    <p className="text-zinc-500 dark:text-zinc-400">Please contact the administrator to assign your properties.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property: any) => (
                        <Link
                            key={property.id}
                            href={`/dashboard/properties/${property.id}`}
                            className="block group"
                        >
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 transition-all p-6 space-y-4 shadow-sm hover:shadow-md">
                                <div className="flex items-start justify-between">
                                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-primary/10 transition-colors">
                                        <Building2 className="w-6 h-6 text-zinc-700 dark:text-zinc-300 group-hover:text-primary" />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                        Active
                                    </span>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-white truncate">{property.name}</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{property.address}</p>
                                </div>

                                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                                    <div className="flex items-center gap-1">
                                        <span>{property._count.expenses} records</span>
                                    </div>
                                    <span className="text-primary font-medium group-hover:translate-x-1 transition-transform">
                                        View Details &rarr;
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
