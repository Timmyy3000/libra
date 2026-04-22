import { ConvexHttpClient } from "convex/browser";
import {
  buildBookStateSummaries,
  type BookStateInput,
  type BookStateSummary,
  type BookUploadInput,
  type DiscoverCharactersKickoff,
  type SourceFileType,
  type WorkflowJobStateInput,
} from "@libra/shared";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

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
      books: BookStateSummary[];
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

  const bookId = await client.mutation(api.books.create, {
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

  const jobId = await client.mutation(api.jobs.create, {
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
  const client = getConvexClient();
  if (!client) {
    return {
      mode: "deferred",
      reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to read persisted books.",
      books: [],
    };
  }

  const books = await client.query(api.books.listByUser, { userId });

  const jobs = books.length
    ? await client.query(api.jobs.listByEntityIds, {
        entityIds: books.map((book) => book._id as Id<"books">),
      })
    : [];

  return {
    mode: "convex",
    books: buildBookStateSummaries({
      books: books as BookStateInput[],
      jobs: jobs.map((job) => ({
        _id: String(job._id),
        _creationTime: job._creationTime,
        entityId: String(job.entityId),
        jobType: job.jobType,
        status: job.status,
        step: job.step,
        progressCurrent: job.progressCurrent,
        progressTotal: job.progressTotal,
      })) as WorkflowJobStateInput[],
    }),
  };
}
