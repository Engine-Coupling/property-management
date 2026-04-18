import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadFileToDrive, createDriveFolder, uploadFileWithUserToken, createDriveFolderWithToken } from "@/lib/drive"

// Increase Vercel serverless function timeout (default is 10s, which is too short
// for sequential Drive folder creation + file uploads)
export const maxDuration = 60

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session || !session.user || (role !== "ADMIN" && role !== "POWER_ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the user's OAuth access token for Drive uploads.
    // Service accounts have no storage quota on regular Drive folders,
    // so we must use the authenticated user's token instead.
    const accessToken = (session as any).accessToken
    if (!accessToken) {
        return NextResponse.json(
            { error: "No Drive access token. Please sign out and sign back in to grant Drive permissions." },
            { status: 401 }
        )
    }

    try {
        const formData = await req.formData()
        const links: Record<string, string> = {}

        // We expect files keyed by propertyId: "file_[propertyId]"
        // And metadata keyed by: "meta_[propertyId]" => JSON { amount, month, propertyName }

        // Let's iterate over keys
        const entries = Array.from(formData.entries())

        // Group by property
        const uploads: Record<string, { file: File, meta: any }> = {}

        for (const [key, value] of entries) {
            if (key.startsWith("file_") && typeof value === "object" && value !== null && "name" in value) {
                const propId = key.replace("file_", "")
                if (!uploads[propId]) uploads[propId] = {} as any
                uploads[propId].file = value as File
            }
            if (key.startsWith("meta_") && typeof value === 'string') {
                const propId = key.replace("meta_", "")
                if (!uploads[propId]) uploads[propId] = {} as any
                uploads[propId].meta = JSON.parse(value)
            }
        }

        // 1. Identify Batch Details
        let batchMeta: any = null
        for (const [key, value] of entries) {
            if (key.startsWith("meta_bank") && typeof value === 'string') {
                batchMeta = JSON.parse(value)
                break
            }
        }

        const now = new Date()
        const month = batchMeta?.month || now.toISOString().slice(0, 7)
        const timestamp = Date.now().toString()
        const parentFolderName = `Dosquebradas Report ${month} - ${timestamp.slice(-6)}`

        // 2. Create Parent Folder using user's token
        const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
        const folder = await createDriveFolderWithToken(parentFolderName, accessToken, rootFolderId)
        const parentFolderId = folder?.id

        if (!parentFolderId) throw new Error("Failed to create parent folder")

        // 3. Process Uploads
        const createSubfolder = async (name: string) => {
            const f = await createDriveFolderWithToken(name, accessToken, parentFolderId)
            return f?.id
        }

        const subfolderIds: Record<string, string> = {}

        for (const propId in uploads) {
            const { file, meta } = uploads[propId]
            if (!file || !meta) continue

            let subKey = "Misc"
            if (meta.propertyName === "BATCH_GAS") subKey = "Gas"
            else if (meta.propertyName === "BATCH_EXTRA") subKey = "Extra"
            else if (meta.propertyName === "BATCH_REPORT") subKey = "Bank"
            else if (meta.propertyName === "BATCH_DEPOSIT") subKey = "Deposit"

            if (!subfolderIds[subKey]) {
                const id = await createSubfolder(subKey)
                if (id) subfolderIds[subKey] = id
            }

            const targetFolderId = subfolderIds[subKey] || parentFolderId

            // Upload using user's token
            const uploadedFile = await uploadFileWithUserToken(file, targetFolderId, accessToken)

            if (uploadedFile && uploadedFile.webViewLink) {
                links[propId] = uploadedFile.webViewLink
            }
        }

        return NextResponse.json({ links })
    } catch (error) {
        console.error("Batch upload error:", error)
        const message = error instanceof Error ? error.message : "Upload failed"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

