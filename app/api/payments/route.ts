import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { propertyId, amount, period } = body

        if (!propertyId || amount === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const payment = await prisma.payment.create({
            data: {
                propertyId,
                amount: parseFloat(amount),
                period: period ? new Date(period) : new Date(), // Defaults to now
                status: "PENDING",
            },
        })

        return NextResponse.json(payment)
    } catch (error) {
        console.error("Error creating payment:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
