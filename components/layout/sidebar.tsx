"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Building2, Receipt, Users, LogOut, Settings } from "lucide-react"

export function Sidebar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const role = session?.user?.role
    const isAdmin = role === "ADMIN" || role === "POWER_ADMIN"
    const isPowerAdmin = role === "POWER_ADMIN"

    const links = [
        {
            name: "Tablero",
            href: isAdmin ? "/dashboard/admin" : "/dashboard/owner",
            icon: LayoutDashboard,
            show: true,
        },
        {
            name: "Historial",
            href: "/dashboard/power",
            icon: Receipt,
            show: isPowerAdmin,
        },
        {
            name: "Reporte Masivo",
            href: "/dashboard/admin/batch",
            icon: Receipt, // Using Receipt icon as it fits reporting/financials
            show: isAdmin,
        },
        {
            name: "Propiedades",
            href: "/dashboard/properties",
            icon: Building2,
            show: isAdmin,
        },
        {
            name: "Accesibilidad",
            href: "/dashboard/owners",
            icon: Users,
            show: isAdmin,
        },
    ]

    return (
        <div className="flex flex-col h-full bg-zinc-900 text-white w-64 border-r border-zinc-800">
            <div className="p-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Building2 className="text-primary" />
                    <span>PropManage</span>
                </h2>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.filter(l => l.show).map((link) => {
                    const Icon = link.icon
                    const isActive = pathname.startsWith(link.href)

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            {link.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">
                        {session?.user?.name?.[0] || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session?.user?.name || "User"}</p>
                        <p className="text-xs text-zinc-500 truncate capitalize">{role?.toLowerCase()}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-4 py-2 w-full text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    )
}
