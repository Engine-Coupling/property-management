"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createReconciliationPayment(data: {
    amount: number
    date: string
    note?: string
    receiptLink?: string
}) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (!session || (role !== "ADMIN" && role !== "POWER_ADMIN")) {
        return { error: "Unauthorized" }
    }

    try {
        const payment = await prisma.reconciliationPayment.create({
            data: {
                amount: data.amount,
                date: data.date ? new Date(data.date) : new Date(),
                note: data.note || null,
                receiptLink: data.receiptLink || null,
            },
        })

        revalidatePath("/dashboard/reconciliation")
        return { success: true, payment }
    } catch (error) {
        console.error("Error creating reconciliation payment:", error)
        return { error: "Failed to create payment" }
    }
}

export async function getReconciliationPayments() {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (!session || (role !== "ADMIN" && role !== "POWER_ADMIN")) {
        return { error: "Unauthorized", payments: [] }
    }

    try {
        const payments = await prisma.reconciliationPayment.findMany({
            orderBy: { date: "desc" },
        })
        return { success: true, payments }
    } catch (error) {
        console.error("Error fetching reconciliation payments:", error)
        return { error: "Failed to fetch payments", payments: [] }
    }
}
