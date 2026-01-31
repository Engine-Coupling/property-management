"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Lock, Mail, Loader2, Building2 } from "lucide-react"

export function LoginForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        try {
            await signIn("google", { callbackUrl: "/dashboard" })
        } catch (error) {
            console.error("Login error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md space-y-8 p-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                    <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Bienvenido</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Inicia sesión para gestionar tus propiedades
                </p>
            </div>

            <div className="space-y-4 pt-4">
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="relative w-full inline-flex items-center justify-center px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                    )}
                    Continuar con Google
                </button>
            </div>
        </div>
    )
}
