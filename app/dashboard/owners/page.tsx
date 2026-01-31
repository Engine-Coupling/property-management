import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Users, Shield } from "lucide-react"

export default async function OwnersPage() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user as any).role !== "POWER_ADMIN") {
        redirect("/")
    }

    const users = await prisma.user.findMany({
        where: {
            role: { in: ['ADMIN', 'POWER_ADMIN'] }
        },
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            createdAt: true
        }
    })

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                    <Shield className="w-8 h-8 text-primary" />
                    Accesibilidad
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">Administradores con acceso al sistema.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Rol</th>
                            <th className="px-6 py-3">Credenciales</th>
                            <th className="px-6 py-3">Fecha Registro</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                                        {user.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-zinc-500">{user.name?.[0] || "U"}</span>
                                        )}
                                    </div>
                                    {user.name || "Sin Nombre"}
                                </td>
                                <td className="px-6 py-4 text-zinc-500">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'POWER_ADMIN'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                        : user.role === 'ADMIN'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
                                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                                        }`}>
                                        {user.role === 'POWER_ADMIN' && <Shield className="w-3 h-3 fill-current" />}
                                        {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                                        </svg>
                                        <span className="text-xs">Google Auth</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-zinc-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
