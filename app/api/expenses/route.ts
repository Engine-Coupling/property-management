import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET /api/expenses?propertyId=...
export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get("propertyId")

    if (!propertyId) {
        return NextResponse.json({ error: "Property ID required" }, { status: 400 })
    }

    // Check access
    const property = await prisma.property.findUnique({
        where: { id: propertyId as string },
    })

    if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Admins can see all. Owners can only see their own.
    if ((session.user as any).role !== "ADMIN" && property.ownerId !== (session.user as any).id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const expenses = await prisma.expense.findMany({
        where: { propertyId: propertyId as string },
        orderBy: { date: 'desc' },
    })

    return NextResponse.json(expenses)
}

// POST /api/expenses
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden. Only Admins can add expenses." }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { propertyId, description, amount, date, receiptDriveLink, category } = body

        if (!propertyId || !description || amount === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const expense = await prisma.expense.create({
            data: {
                propertyId,
                description,
                amount: parseFloat(amount),
                date: date ? new Date(date) : new Date(),
                receiptDriveLink,
                category: category || "MAINTENANCE",
            },
        })

        return NextResponse.json(expense)
    } catch (error) {
        console.error("Error creating expense:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
