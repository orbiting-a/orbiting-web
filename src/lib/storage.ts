import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

let r2Client: S3Client | null = null;
let r2Bucket = "";
let r2PublicUrl = "";

export function initR2() {
  const accountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
  const accessKeyId = process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY;
  r2Bucket = process.env.NEXT_PUBLIC_R2_BUCKET || "orbit-media";
  r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

  if (accountId && accessKeyId && secretAccessKey) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
}

export function isR2Configured() {
  return !!r2Client;
}

export async function uploadToR2(file: File, path: string): Promise<string | null> {
  if (!r2Client) return null;

  const buffer = await file.arrayBuffer();
  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: path,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    })
  );

  return r2PublicUrl ? `${r2PublicUrl}/${path}` : null;
}

export async function getR2Url(path: string): Promise<string | null> {
  if (!r2Client) return null;
  return r2PublicUrl ? `${r2PublicUrl}/${path}` : null;
}
