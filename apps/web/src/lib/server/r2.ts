import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { bookUploadInputSchema, type BookUploadInput, type SourceFileType } from "@libra/shared";

const sourceFileTypeByContentType: Record<BookUploadInput["contentType"], SourceFileType> = {
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
  "text/plain": "txt",
};

export type PreparedBookUpload = {
  bookId: string;
  objectKey: string;
  sourceFileType: SourceFileType;
  uploadUrl: string;
  publicUrl: string | null;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required R2 configuration: ${name}`);
  }

  return value;
}

function createR2Client() {
  const accountId = getRequiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function prepareBookUpload(input: BookUploadInput): Promise<PreparedBookUpload> {
  const parsed = bookUploadInputSchema.parse(input);
  const bucket = getRequiredEnv("R2_BUCKET");
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? null;
  const bookId = randomUUID();
  const objectKey = `books/${bookId}/source/${parsed.fileName}`;
  const sourceFileType = sourceFileTypeByContentType[parsed.contentType];

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: parsed.contentType,
  });

  const uploadUrl = await getSignedUrl(createR2Client(), command, { expiresIn: 900 });

  return {
    bookId,
    objectKey,
    sourceFileType,
    uploadUrl,
    publicUrl: publicBaseUrl ? `${publicBaseUrl}/${objectKey}` : null,
  };
}
