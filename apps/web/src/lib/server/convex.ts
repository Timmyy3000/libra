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

function getConvexClient() {
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!deploymentUrl) return null;
  return new ConvexHttpClient(deploymentUrl, {
    skipConvexDeploymentUrlCheck: true,
    logger: false,
  });
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

  const client = getConvexClient();
  if (!client) {
    return {
      mode: "deferred",
      reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to persist book/job state.",
      kickoff,
    };
  }

  const mutationClient = client as unknown as {
    mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  };

  const bookId = await mutationClient.mutation("books:create", {
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

  const jobId = await mutationClient.mutation("jobs:create", {
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
