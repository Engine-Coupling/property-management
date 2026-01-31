"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

interface SaveReportInput {
    propertyId: string
    startDate: string
    endDate: string
    totalRent: number
    totalHoa: number
    totalDeductions: number
    payout: number
}

export async function saveMonthlyReport(data: SaveReportInput) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (!session || (role !== "ADMIN" && role !== "POWER_ADMIN")) {
        return { error: "Unauthorized" }
    }

    try {
        const report = await prisma.monthlyReport.create({
            data: {
                propertyId: data.propertyId,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                reportDate: new Date(),
                totalRent: data.totalRent,
                totalHoa: data.totalHoa,
                totalDeductions: data.totalDeductions,
                payout: data.payout
            }
        })

        revalidatePath("/dashboard/power")
        return { success: true, report }
    } catch (error) {
        console.error("Error saving report:", error)
        return { error: "Failed to save report" }
    }
}

export async function getMonthlyReports() {
    const session = await getServerSession(authOptions)
    // cast to any to avoid type check issues if types aren't fully updated yet
    const userRole = (session?.user as any)?.role

    if (!session || (userRole !== 'POWER_ADMIN' && userRole !== 'ADMIN')) {
        return { error: "Unauthorized" }
    }

    try {
        const reports = await prisma.monthlyReport.findMany({
            include: {
                property: {
                    select: {
                        name: true,
                        address: true
                    }
                }
            },
            orderBy: {
                reportDate: 'desc'
            }
        })
        return { success: true, reports }
    } catch (error) {
        console.error("Error fetching reports:", error)
        return { error: `Failed to fetch reports: ${error instanceof Error ? error.message : String(error)}` }
    }
}
