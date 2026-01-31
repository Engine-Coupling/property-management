import { redirect } from "next/navigation"

export default function FeesPage() {
    redirect("/dashboard/admin")
    return null
}
