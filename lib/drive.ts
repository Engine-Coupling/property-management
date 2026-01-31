import { google } from "googleapis"
import { Readable } from "stream"

const SCOPES = ["https://www.googleapis.com/auth/drive.file"]

export async function uploadFileToDrive(file: File, folderId?: string) {
    try {
        // Determine credentials from environment
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")

        if (!clientEmail || !privateKey) {
            throw new Error("Missing Google Service Account credentials")
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: SCOPES,
        })

        const drive = google.drive({ version: "v3", auth })

        const buffer = Buffer.from(await file.arrayBuffer())
        const stream = new Readable()
        stream.push(buffer)
        stream.push(null)

        const fileMetadata: any = {
            name: file.name,
            // If folderId is provided, upload there. Otherwise root (or service account's drive).
            parents: folderId ? [folderId] : [],
        }

        const media = {
            mimeType: file.type,
            body: stream,
        }

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: "id, webViewLink, webContentLink",
        })

        return response.data
    } catch (error) {
        console.error("Google Drive Upload Error:", error)
        throw error
    }
}

export async function createDriveFolder(folderName: string, parentId?: string) {
    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
        const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")

        if (!clientEmail || !privateKey) throw new Error("Missing auth")

        const auth = new google.auth.GoogleAuth({
            credentials: { client_email: clientEmail, private_key: privateKey },
            scopes: SCOPES,
        })
        const drive = google.drive({ version: "v3", auth })

        const rootFolder = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID

        const fileMetadata: any = {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: parentId ? [parentId] : (rootFolder ? [rootFolder] : [])
        }

        const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: "id, webViewLink",
        })

        return response.data
    } catch (error) {
        console.error("Create Folder Error:", error)
        throw error
    }
}
// New function: Upload using User's Token (OAuth)
export async function uploadFileWithUserToken(file: File, folderId: string, accessToken: string) {
    try {
        const auth = new google.auth.OAuth2()
        auth.setCredentials({ access_token: accessToken })

        const drive = google.drive({ version: "v3", auth })

        const buffer = Buffer.from(await file.arrayBuffer())
        const stream = new Readable()
        stream.push(buffer)
        stream.push(null)

        const fileMetadata: any = {
            name: file.name,
            parents: [folderId],
        }

        const media = {
            mimeType: file.type,
            body: stream,
        }

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: "id, webViewLink, webContentLink",
        })

        return response.data
    } catch (error) {
        console.error("User Token Upload Error:", error)
        throw error
    }
}

// Reuse createFolder logic but with token if needed?
// Actually we can reuse the same createFolder logic if we pass token too.
export async function createDriveFolderWithToken(folderName: string, accessToken: string, parentId?: string) {
    try {
        const auth = new google.auth.OAuth2()
        auth.setCredentials({ access_token: accessToken })

        const drive = google.drive({ version: "v3", auth })

        const rootFolder = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID

        const fileMetadata: any = {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
            parents: parentId ? [parentId] : (rootFolder ? [rootFolder] : [])
        }

        const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: "id, webViewLink",
        })

        return response.data
    } catch (error) {
        console.error("Create Folder (User) Error:", error)
        throw error
    }
}
