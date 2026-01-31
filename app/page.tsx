import { LoginForm } from "@/components/auth/login-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <LoginForm />
    </main>
  )
}
