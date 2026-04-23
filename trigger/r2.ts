import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PDFParse } from "pdf-parse";

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

function normalizeExtractedText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function toBuffer(body: Buffer | Uint8Array | ArrayBuffer): Buffer {
  if (body instanceof Buffer) {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  return Buffer.from(new Uint8Array(body));
}

export async function extractTextFromSourceBytes(
  objectKey: string,
  body: Buffer | Uint8Array | ArrayBuffer | string,
): Promise<string> {
  const normalizedKey = objectKey.toLowerCase();

  if (normalizedKey.endsWith(".txt")) {
    const text = typeof body === "string" ? body : toBuffer(body).toString("utf8");
    return normalizeExtractedText(text);
  }

  if (normalizedKey.endsWith(".pdf")) {
    const parser = new PDFParse({ data: toBuffer(typeof body === "string" ? Buffer.from(body, "utf8") : body) });

    try {
      const result = await parser.getText();
      return normalizeExtractedText(result.text);
    } finally {
      await parser.destroy();
    }
  }

  throw new Error(
    "Only TXT and PDF source discovery are implemented right now. EPUB extraction is still pending.",
  );
}

export async function readTextSourceFromR2(objectKey: string): Promise<string> {
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

  const bytes = Buffer.from(await response.Body.transformToByteArray());
  return await extractTextFromSourceBytes(objectKey, bytes);
}
