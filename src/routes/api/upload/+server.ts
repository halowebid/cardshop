import { json } from "@sveltejs/kit"
import { deleteFromS3, generateUniqueFileName, uploadToS3 } from "$lib/server/s3"

import type { RequestHandler } from "./$types"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

/**
 * POST /api/upload
 * Uploads an image file to S3
 * Validates file size (max 5MB) and type (images only)
 * Returns the uploaded file URL and unique ID
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return json({ error: "File size exceeds 5MB limit" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return json({ error: "Invalid file type. Only images are allowed" }, { status: 400 })
    }

    const fileName = generateUniqueFileName(file.name)
    const fileUrl = await uploadToS3(file, fileName)

    return json({
      url: fileUrl,
      fileId: fileName,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return json({ error: "Failed to upload file" }, { status: 500 })
  }
}

/**
 * DELETE /api/upload
 * Deletes an image file from S3
 * Expects fileId in request body
 */
export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return json({ error: "No fileId provided" }, { status: 400 })
    }

    await deleteFromS3(fileId)

    return json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return json({ error: "Failed to delete file" }, { status: 500 })
  }
}
