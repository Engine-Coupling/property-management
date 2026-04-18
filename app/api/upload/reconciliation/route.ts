import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadFileWithUserToken, createDriveFolderWithToken } from "@/lib/drive"

export const maxDuration = 60

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role

    if (!session || !session.user || (role !== "ADMIN" && role !== "POWER_ADMIN")) {
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
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Create or reuse a "Reconciliación" folder in the root Drive folder
        const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
        const now = new Date()
        const folderName = `Reconciliación ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        const folder = await createDriveFolderWithToken(folderName, accessToken, rootFolderId)
        const folderId = folder?.id

        if (!folderId) throw new Error("Failed to create Drive folder")

        const uploadedFile = await uploadFileWithUserToken(file, folderId, accessToken)

        if (uploadedFile && uploadedFile.webViewLink) {
            return NextResponse.json({ link: uploadedFile.webViewLink })
        }

        throw new Error("Upload succeeded but no link returned")
    } catch (error) {
        console.error("Reconciliation upload error:", error)
        const message = error instanceof Error ? error.message : "Upload failed"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
