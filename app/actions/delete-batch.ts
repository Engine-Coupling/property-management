"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function deleteBatch(isoDate: string) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (!session || !session.user || (role !== "ADMIN" && role !== "POWER_ADMIN")) {
        return { error: "Unauthorized" }
    }

    try {
        const targetDate = new Date(isoDate)

        // Find all MonthlyReports generated at this exact date
        const reports = await prisma.monthlyReport.findMany({
            where: { reportDate: targetDate }
        })

        if (reports.length === 0) {
            return { error: "No se encontraron reportes para esta fecha." }
        }

        // We delete Expenses, Payments and MonthlyReports tied exactly to this date
        // Since `createBatchReports` creates them synchronously using `reportDate` natively.
        await prisma.$transaction([
            prisma.expense.deleteMany({
                where: { date: targetDate }
            }),
            prisma.payment.deleteMany({
                where: { period: targetDate }
            }),
            prisma.monthlyReport.deleteMany({
                where: { reportDate: targetDate }
            })
        ])

        revalidatePath('/dashboard/power')
        revalidatePath('/dashboard/fees')
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting batch:", error)
        return { error: error.message || "Ocurrió un error al intentar eliminar el bloque." }
    }
}
