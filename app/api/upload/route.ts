import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadFileWithUserToken } from "@/lib/drive"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = (session as any).accessToken
    if (!accessToken) {
        return NextResponse.json(
            { error: "No Drive access token. Please sign out and sign back in to grant Drive permissions." },
            { status: 401 }
        )
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
        if (!rootFolderId) throw new Error("Missing root folder ID")

        const driveFile = await uploadFileWithUserToken(file, rootFolderId, accessToken)

        return NextResponse.json({
            link: driveFile.webViewLink,
            id: driveFile.id
        })
    } catch (error) {
        console.error("Upload error:", error)
        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}
