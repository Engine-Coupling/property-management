import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { uploadFileToDrive, createDriveFolder, uploadFileWithUserToken, createDriveFolderWithToken } from "@/lib/drive"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role
    if (!session || !session.user || (role !== "ADMIN" && role !== "POWER_ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Cast to any to access accessToken
    const accessToken = (session as any).accessToken

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
            if (key.startsWith("file_") && value instanceof File) {
                const propId = key.replace("file_", "")
                if (!uploads[propId]) uploads[propId] = {} as any
                uploads[propId].file = value
            }
            if (key.startsWith("meta_") && typeof value === 'string') {
                const propId = key.replace("meta_", "")
                if (!uploads[propId]) uploads[propId] = {} as any
                uploads[propId].meta = JSON.parse(value)
            }
        }

        // 1. Identify Batch Details
        // We look for BATCH_REPORT meta to get period/month details for the main folder name
        let batchMeta: any = null
        for (const [key, value] of entries) {
            if (key.startsWith("meta_bank") && typeof value === 'string') {
                batchMeta = JSON.parse(value)
                break
            }
        }

        // Fallback if no bank meta (unlikely if loop runs, but safety check)
        // If batchMeta is missing, just use current date
        const now = new Date()
        const month = batchMeta?.month || now.toISOString().slice(0, 7)
        const timestamp = Date.now().toString()
        // Folder Name: "Dosquebradas Report [YYYY-MM] - [ID]"
        // This is cleaner than including the long ID, but unique enough
        const parentFolderName = `Dosquebradas Report ${month} - ${timestamp.slice(-6)}`

        // 2. Create Parent Folder
        let parentFolderId: string | undefined
        if (accessToken) {
            const folder = await createDriveFolderWithToken(parentFolderName, accessToken)
            parentFolderId = folder?.id || undefined
        } else {
            const folder = await createDriveFolder(parentFolderName)
            parentFolderId = folder?.id || undefined
        }

        if (!parentFolderId) throw new Error("Failed to create parent folder")

        // 3. Process Uploads
        // We will organize by type: "Gas", "Extra", "Bank"
        // Since we are iterating all keys, let's just upload directly to Parent Folder for now, 
        // OR create subfolders if we want to be very organized. 
        // User asked for "Improve structure", so subfolders "Receipts" or type-based is good.
        // Let's create specific subfolders: "Gas", "Extra", "Bank"

        // Helper to create subfolder
        const createSubfolder = async (name: string) => {
            if (accessToken) {
                const f = await createDriveFolderWithToken(name, accessToken, parentFolderId)
                return f?.id
            } else {
                const f = await createDriveFolder(name, parentFolderId)
                return f?.id
            }
        }

        // We can lazy create these if we see files
        const subfolderIds: Record<string, string> = {}

        for (const propId in uploads) {
            const { file, meta } = uploads[propId]
            if (!file || !meta) continue

            // Determine Target Subfolder Key
            let subKey = "Misc"
            if (meta.propertyName === "BATCH_GAS") subKey = "Gas"
            else if (meta.propertyName === "BATCH_EXTRA") subKey = "Extra"
            else if (meta.propertyName === "BATCH_REPORT") subKey = "Bank" // Bank file

            // Create Subfolder if not exists
            if (!subfolderIds[subKey]) {
                const id = await createSubfolder(subKey)
                if (id) subfolderIds[subKey] = id
            }

            const targetFolderId = subfolderIds[subKey] || parentFolderId

            // Upload
            let uploadedFile;
            if (accessToken) {
                uploadedFile = await uploadFileWithUserToken(file, targetFolderId, accessToken)
            } else {
                uploadedFile = await uploadFileToDrive(file, targetFolderId)
            }

            if (uploadedFile && uploadedFile.webViewLink) {
                links[propId] = uploadedFile.webViewLink
            }
        }

        return NextResponse.json({ links })
    } catch (error) {
        console.error("Batch upload error:", error)
        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}
