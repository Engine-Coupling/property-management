"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateProperty(id: string, formData: FormData) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user as any).role !== "POWER_ADMIN") {
        return { error: "Unauthorized. Only Power Admins can edit properties." }
    }

    const name = formData.get("name") as string
    const address = formData.get("address") as string
    const monthlyPayment = parseFloat(formData.get("monthlyPayment") as string) || 0

    // Wifi
    const wifiSsid = formData.get("wifiSsid") as string
    const wifiSsid5G = formData.get("wifiSsid5G") as string
    const wifiPass = formData.get("wifiPass") as string

    // Access
    const doorPin = formData.get("doorPin") as string
    const managementPass = formData.get("managementPass") as string

    // Tenant / Utility
    const utilityAccount = formData.get("utilityAccount") as string
    const cedula = formData.get("cedula") as string
    const tenantName = formData.get("tenantName") as string
    const tenantEmail = formData.get("tenantEmail") as string

    // Dates
    const startDateRaw = formData.get("startDate") as string
    const endDateRaw = formData.get("endDate") as string

    const startDate = startDateRaw ? new Date(startDateRaw) : null
    const endDate = endDateRaw ? new Date(endDateRaw) : null

    try {
        await prisma.property.update({
            where: { id },
            data: {
                name,
                address,
                monthlyPayment,
                wifiSsid,
                wifiSsid5G,
                wifiPass,
                doorPin,
                managementPass,
                utilityAccount,
                cedula,
                tenantName,
                tenantEmail,
                startDate,
                endDate,
            }
        })

        revalidatePath(`/dashboard/properties/${id}`)
        revalidatePath("/dashboard/properties")

        return { success: true }
    } catch (error) {
        console.error("Error updating property:", error)
        return { error: "Failed to update property" }
    }
}
