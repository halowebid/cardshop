import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { env } from "$env/dynamic/private"

/**
 * S3 client instance configured with environment credentials
 * Used for uploading and managing images in AWS S3
 */
const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? "",
  },
})

/**
 * Uploads a file to AWS S3 bucket
 * @param file - File object containing the file to upload
 * @param fileName - Custom filename to use in S3 (with extension)
 * @returns The public URL of the uploaded file
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

  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${fileName}`
}

/**
 * Deletes a file from AWS S3 bucket
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
