import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { env } from "$env/dynamic/private"

/**
 * S3-compatible client configured for Cloudflare R2
 * Used for uploading and managing images in R2 storage
 */
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? "",
  },
})

/**
 * Uploads a file to S3-compatible storage (Cloudflare R2)
 * @param file - File object containing the file to upload
 * @param fileName - Custom filename to use in S3 (with extension)
 * @returns The public URL of the uploaded file using custom domain
 */
export async function uploadToS3(file: File, fileName: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  const uploadParams = {
    Bucket: env.AWS_S3_BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
  }

  await s3Client.send(new PutObjectCommand(uploadParams))

  // Use custom domain if provided, otherwise fall back to S3 URL
  const domain = env.AWS_DOMAIN || `${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`
  return `https://${domain}/${fileName}`
}

/**
 * Deletes a file from S3-compatible storage (Cloudflare R2)
 * @param fileKey - The S3 key (filename) of the file to delete
 */
export async function deleteFromS3(fileKey: string): Promise<void> {
  const deleteParams = {
    Bucket: env.AWS_S3_BUCKET,
    Key: fileKey,
  }

  await s3Client.send(new DeleteObjectCommand(deleteParams))
}

/**
 * Generates a unique filename with timestamp prefix
 * @param originalName - Original filename with extension
 * @returns Unique filename in format: timestamp-uuid-originalname.ext
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const uuid = crypto.randomUUID()
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, "_")
  return `${timestamp}-${uuid}-${sanitized}`
}
