"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

interface FeeConfig {
    gas: { amount: number, receiptLink: string | null } | null
    cleanup: boolean
    extra: { amount: number, description: string, receiptLinks: string[] } | null
}

interface SpecialCase {
    propertyId: string
    rent: number
    hoa: number
    startDate: string
    endDate: string
}

export async function createBatchReports(data: {
    propertyIds: string[],
    specialCases: SpecialCase[],
    utilityCost: number,
    date: string,
    period: { start: string, end: string },
    batchId: string,
    bankLink: string | null,
    fees: FeeConfig
}) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (!session || !session.user || (role !== "ADMIN" && role !== "POWER_ADMIN")) {
        throw new Error("Unauthorized")
    }

    const { propertyIds, utilityCost, date, fees, period, batchId, bankLink } = data

    // Helper to fix timezone issues by setting time to Noon UTC
    const toSafeDate = (dateStr: string) => {
        if (!dateStr) return new Date()

        // Check for YYYY-MM-DD pattern (common in <input type="date"> and ISO start)
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (match) {
            // Reconstruct as Noon UTC
            return new Date(`${match[0]}T12:00:00Z`)
        }

        // Fallback for other formats: Parse and force 12:00 UTC
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
            d.setUTCHours(12, 0, 0, 0)
            return d
        }

        return new Date(dateStr) // Final fallback
    }

    const reportDate = toSafeDate(date)
    const CLEANUP_AMOUNT = 100000

    // Fetch properties
    const properties = await prisma.property.findMany({
        where: { id: { in: propertyIds } }
    })

    const results = []

    // 1. Process Per-Property Records (Rent, HOA only)
    for (const property of properties) {
        const rent = property.monthlyPayment || 0
        // HOA Base = Rent - Utility (70k), used ONLY for calculation
        const hoaFee = (rent - utilityCost) * 0.10

        try {
            // Rent Payment
            await prisma.payment.create({
                data: {
                    propertyId: property.id,
                    amount: rent,
                    status: 'PAID',
                    period: reportDate
                }
            })

            // NOTE: Utility Expense is NOT created. Owner keeps that money.
            // Only HOA Fee is deducted via Expense.

            // HOA Fee Expense
            if (hoaFee > 0) {
                await prisma.expense.create({
                    data: {
                        propertyId: property.id,
                        description: "HOA Fee (10%)",
                        amount: hoaFee,
                        date: reportDate,
                        category: "HOA"
                    }
                })
            }

            results.push({ propertyId: property.id, property: property.name, status: 'success' })

        } catch (error) {
            console.error(`Error processing property ${property.name}:`, error)
            results.push({ propertyId: property.id, property: property.name, status: 'error' })
        }
    }

    // 1.5 Process Special Cases
    const { specialCases } = data
    if (specialCases && specialCases.length > 0) {
        const specialProperties = await prisma.property.findMany({
            where: { id: { in: specialCases.map(sc => sc.propertyId) } }
        })

        for (const sc of specialCases) {
            const property = specialProperties.find(p => p.id === sc.propertyId)
            if (!property) continue

            try {
                // Formatting dates for description
                const startStr = new Date(sc.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const endStr = new Date(sc.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const periodDesc = `${startStr} - ${endStr}`

                // Payment
                await prisma.payment.create({
                    data: {
                        propertyId: sc.propertyId,
                        amount: sc.rent,
                        status: 'PAID',
                        period: reportDate,
                        // We might want to store the description somewhere if Payment model supported it,
                        // but currently Payment is just amount/status/period.
                        // We rely on the date period to implicitly mean "Month", but for special cases 
                        // the amount is just different.
                    }
                })

                // HOA Expense
                if (sc.hoa > 0) {
                    await prisma.expense.create({
                        data: {
                            propertyId: sc.propertyId,
                            description: `HOA Fee (${periodDesc})`,
                            amount: sc.hoa,
                            date: reportDate,
                            category: "HOA"
                        }
                    })
                }

                results.push({ propertyId: property.id, property: property.name, status: 'success' })
            } catch (error) {
                console.error(`Error processing special case ${property.name}:`, error)
                results.push({ propertyId: property.id, property: property.name, status: 'error' })
            }
        }
    }

    // 2. Process Global Fees (ONCE)
    // We attach them to the first property in the list to satisfy DB constraints
    // but they represent a batch deduction.
    const primaryPropertyId = propertyIds[0]

    let globalDeductions = 0

    if (primaryPropertyId) {
        try {
            // Create Batch Report Record (Zero Amount, just for Link & Period)
            if (bankLink) {
                await prisma.expense.create({
                    data: {
                        propertyId: primaryPropertyId,
                        description: `Batch Report: ${period.start} to ${period.end}`,
                        amount: 0, // Informational record
                        date: reportDate,
                        category: "OTHER",
                        receiptDriveLink: bankLink
                    }
                })
            }
            // Gas Fee
            if (fees.gas && fees.gas.amount > 0) {
                globalDeductions += fees.gas.amount
                await prisma.expense.create({
                    data: {
                        propertyId: primaryPropertyId,
                        description: "Global Gas Fee",
                        amount: fees.gas.amount,
                        date: reportDate,
                        category: "MAINTENANCE",
                        receiptDriveLink: fees.gas.receiptLink
                    }
                })
            }

            // Cleanup Fee
            if (fees.cleanup) {
                globalDeductions += CLEANUP_AMOUNT
                await prisma.expense.create({
                    data: {
                        propertyId: primaryPropertyId,
                        description: "Global Cleanup Service",
                        amount: CLEANUP_AMOUNT,
                        date: reportDate,
                        category: "MAINTENANCE"
                    }
                })
            }

            // Extra Fee
            if (fees.extra && fees.extra.amount > 0) {
                globalDeductions += fees.extra.amount
                const links = fees.extra.receiptLinks.join(", ")
                await prisma.expense.create({
                    data: {
                        propertyId: primaryPropertyId,
                        description: fees.extra.description ? `Global: ${fees.extra.description}` : "Global Extra Fee",
                        amount: fees.extra.amount,
                        date: reportDate,
                        category: "OTHER",
                        receiptDriveLink: links || null
                    }
                })
            }
        } catch (error) {
            console.error("Error creating global fees:", error)
            // We don't fail the whole batch for this, but ideally should alert
        }
    }

    // 3. Persist Monthly Reports
    // We aggregate data from the processed lists to create snapshots
    try {
        const reportOps = []

        // Helper to find processing result or calculate defaults if needed
        // Since we iterated above, we can reconstruct the logic or use a map.
        // Using a map is cleaner.

        // Let's create reports for the Regular Properties first
        for (const property of properties) {
            const rent = property.monthlyPayment || 0
            const hoaFee = (rent - utilityCost) * 0.10
            const isPrimary = property.id === primaryPropertyId

            // Deductions for this property
            let deductions = hoaFee
            if (isPrimary) {
                deductions += globalDeductions
            }

            const payout = rent - deductions

            reportOps.push(prisma.monthlyReport.create({
                data: {
                    propertyId: property.id,
                    startDate: toSafeDate(period.start),
                    endDate: toSafeDate(period.end),
                    reportDate: reportDate,
                    totalRent: rent,
                    totalHoa: hoaFee,
                    totalDeductions: isPrimary ? globalDeductions : 0, // Store specific extra deductions separately? 
                    // Valid schema: totalDeductions. We can sum hoa + global.
                    // Let's store totalDeductions as the sum relative to the specific property bucket.
                    // Actually, separating HOA might be useful. The schema has totalHoa and totalDeductions.
                    // I will store totalDeductions as *Other* deductions (Global), and totalHoa as HOA.
                    // So Payout = Rent - HOA - Deductions.

                    payout: payout
                }
            }))
        }

        // Special Cases Reports
        const specialProperties = await prisma.property.findMany({
            where: { id: { in: specialCases.map(sc => sc.propertyId) } }
        })

        for (const sc of specialCases) {
            const property = specialProperties.find(p => p.id === sc.propertyId)
            if (!property) continue
            // Check if we already created a report for this property (unlikely in batch, but possible if duplicates?)
            // Assuming unique propertyIds in batch.

            // Note: Special cases might *also* be the primary property? 
            // The Logic separates propertyIds list (Regular) and specialCases list.
            // If a property is in specialCases, it is NOT in propertyIds (usually).

            // Ideally global fees attach to the *true* primary ID found in propertyIds[0].
            // If primaryPropertyId is null (only special cases), we might have an issue attaching global fees.
            // Assuming propertyIds.length > 0.

            reportOps.push(prisma.monthlyReport.create({
                data: {
                    propertyId: sc.propertyId,
                    startDate: toSafeDate(sc.startDate),
                    endDate: toSafeDate(sc.endDate),
                    reportDate: reportDate,
                    totalRent: sc.rent,
                    totalHoa: sc.hoa,
                    totalDeductions: 0, // Global fees only attach to primary of regular list currently
                    payout: sc.rent - sc.hoa
                }
            }))
        }

        await prisma.$transaction(reportOps)

    } catch (error) {
        console.error("Error creating monthly reports:", error)
        // Non-blocking for now
    }

    revalidatePath('/dashboard/fees')
    revalidatePath('/dashboard/power')
    return { success: true, results }
}
