import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

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

export async function readTextSourceFromR2(objectKey: string): Promise<string> {
  if (!objectKey.toLowerCase().endsWith(".txt")) {
    throw new Error("Only TXT source discovery is implemented right now. EPUB/PDF extraction is still pending.");
  }

  const bucket = getRequiredEnv("R2_BUCKET");
  const response = await createR2Client().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );

  if (!response.Body) {
    throw new Error(`R2 object ${objectKey} had no readable body.`);
  }

  return await response.Body.transformToString();
}
