import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucket = process.env.R2_BUCKET_NAME
const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "")

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && bucket
)

const s3 = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  : null

export async function uploadMascotToR2(params: {
  buffer: Buffer
  key: string
  contentType: string
}): Promise<string | null> {
  if (!s3 || !bucket) return null

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  )

  return publicBase ? `${publicBase}/${params.key}` : null
}
