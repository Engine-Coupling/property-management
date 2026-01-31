import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const role = (session.user as any).role

    try {
        let properties
        if (role === "ADMIN") {
            properties = await prisma.property.findMany({
                include: {
                    owner: { select: { name: true, email: true } }
                }
            })
        } else {
            properties = await prisma.property.findMany({
                where: { ownerId: (session.user as any).id },
                include: {
                    owner: { select: { name: true, email: true } }
                }
            })
        }
        return NextResponse.json(properties)
    } catch (error) {
        console.error("Error fetching properties:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
        // Only admins can create properties
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { name, address, ownerEmail } = body

        if (!name || !address || !ownerEmail) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        // Find the owner user by email
        const owner = await prisma.user.findUnique({
            where: { email: ownerEmail },
        })

        if (!owner) {
            // Option: Create the user if they don't exist? Or return error?
            // Returning error is safer, or create invite. For now, assume user exists or created.
            return NextResponse.json({ error: "Owner user not found. Please register the user first." }, { status: 404 })
        }

        const newProperty = await prisma.property.create({
            data: {
                name,
                address,
                ownerId: owner.id,
            },
        })

        return NextResponse.json(newProperty)
    } catch (error) {
        console.error("Error creating property:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
