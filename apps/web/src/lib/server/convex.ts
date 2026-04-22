import { ConvexHttpClient } from "convex/browser";
import type { BookUploadInput, DiscoverCharactersKickoff, SourceFileType } from "@libra/shared";

export type PersistPreparedUploadInput = {
  bookId: string;
  objectKey: string;
  sourceFileType: SourceFileType;
  uploadInput: BookUploadInput;
  title: string;
  author?: string;
  userId?: string;
};

export type PersistPreparedUploadResult =
  | { mode: "convex"; bookId: string; jobId: string }
  | { mode: "deferred"; reason: string; kickoff: DiscoverCharactersKickoff };

export type ListBooksResult =
  | {
      mode: "convex";
      books: Array<{
        _id: string;
        title: string;
        author: string;
        status: string;
        sourceFileType: string;
        characterCount: number;
      }>;
    }
  | { mode: "deferred"; reason: string; books: [] };

function getConvexClient() {
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!deploymentUrl) return null;
  return new ConvexHttpClient(deploymentUrl, {
    skipConvexDeploymentUrlCheck: true,
    logger: false,
  });
}

function getMutationClient() {
  const client = getConvexClient();
  if (!client) return null;

  return client as unknown as {
    mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
    query: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  };
}

export async function persistPreparedUpload(
  input: PersistPreparedUploadInput,
): Promise<PersistPreparedUploadResult> {
  const userId = input.userId ?? "demo-user";
  const kickoff = {
    bookId: input.bookId,
    userId,
    sourceFileKey: input.objectKey,
  } satisfies DiscoverCharactersKickoff;

  const client = getMutationClient();
  if (!client) {
    return {
      mode: "deferred",
      reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to persist book/job state.",
      kickoff,
    };
  }

  const bookId = await client.mutation("books:create", {
    userId,
    title: input.title,
    author: input.author ?? "Unknown",
    sourceFileType: input.sourceFileType,
    sourceFileKey: input.objectKey,
    sourceFileBucket: process.env.R2_BUCKET ?? "",
    sourceFileContentType: input.uploadInput.contentType,
    sourceFileSizeBytes: input.uploadInput.sizeBytes,
    status: "uploaded",
    characterCount: 0,
  });

  const jobId = await client.mutation("jobs:create", {
    entityType: "book",
    entityId: bookId,
    jobType: "discover_characters",
    status: "queued",
    progressCurrent: 0,
    progressTotal: 3,
    step: "queued_for_discovery",
  });

  return {
    mode: "convex",
    bookId: String(bookId),
    jobId: String(jobId),
  };
}

export async function listBooksByUser(userId: string): Promise<ListBooksResult> {
  const client = getMutationClient();
  if (!client) {
    return {
      mode: "deferred",
      reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to read persisted books.",
      books: [],
    };
  }

  const books = (await client.query("books:listByUser", { userId })) as Array<{
    _id: string;
    title: string;
    author: string;
    status: string;
    sourceFileType: string;
    characterCount: number;
  }>;

  return {
    mode: "convex",
    books,
  };
}
