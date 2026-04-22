import { ConvexHttpClient } from "convex/browser";
import {
  buildBookStateSummaries,
  type BookStateInput,
  type BookStateSummary,
  type BookUploadInput,
  type CharacterStateInput,
  type DiscoverCharactersKickoff,
  type SourceFileType,
  type WorkflowJobStateInput,
} from "@libra/shared";
import { createDiscoverCharactersPayload, discoverCharactersWorkflowId } from "@libra/trigger";
import { configure, tasks } from "@trigger.dev/sdk/v3";
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
  | { mode: "convex"; bookId: string; jobId: string; discovery: DiscoveryKickoffResult }
  | { mode: "deferred"; reason: string; kickoff: DiscoverCharactersKickoff };

export type DiscoveryKickoffResult =
  | { mode: "trigger"; runId: string }
  | { mode: "deferred"; reason: string };

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

function getTriggerConfig() {
  const accessToken = process.env.TRIGGER_SECRET_KEY;
  if (!accessToken) return null;

  return {
    accessToken,
    baseURL: process.env.TRIGGER_API_URL,
  } as const;
}

async function kickoffDiscoveryWorkflow(kickoff: DiscoverCharactersKickoff): Promise<DiscoveryKickoffResult> {
  const triggerConfig = getTriggerConfig();
  if (!triggerConfig) {
    return {
      mode: "deferred",
      reason: "Set TRIGGER_SECRET_KEY to kick off the real discovery workflow.",
    };
  }

  configure({
    accessToken: triggerConfig.accessToken,
    ...(triggerConfig.baseURL ? { baseURL: triggerConfig.baseURL } : {}),
  });

  const handle = await tasks.trigger(discoverCharactersWorkflowId, createDiscoverCharactersPayload(kickoff), {
    idempotencyKey: `discover-characters:${kickoff.jobId}`,
    tags: [`book:${kickoff.bookId}`, `job:${kickoff.jobId}`],
  });

  return {
    mode: "trigger",
    runId: handle.id,
  };
}

export async function persistPreparedUpload(
  input: PersistPreparedUploadInput,
): Promise<PersistPreparedUploadResult> {
  const userId = input.userId ?? "demo-user";

  const client = getConvexClient();
  if (!client) {
    return {
      mode: "deferred",
      reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to persist book/job state.",
      kickoff: {
        bookId: input.bookId,
        jobId: "pending-job-id",
        userId,
        sourceFileKey: input.objectKey,
      },
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

  const kickoff = {
    bookId: String(bookId),
    jobId: String(jobId),
    userId,
    sourceFileKey: input.objectKey,
  } satisfies DiscoverCharactersKickoff;

  const discovery = await kickoffDiscoveryWorkflow(kickoff);

  if (discovery.mode === "trigger") {
    await client.mutation(api.discovery.markTriggered, {
      bookId: bookId as Id<"books">,
      jobId: jobId as Id<"jobs">,
      triggerRunId: discovery.runId,
    });
  }

  return {
    mode: "convex",
    bookId: String(bookId),
    jobId: String(jobId),
    discovery,
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

  const characters = books.length
    ? await client.query(api.characters.listByBookIds, {
        bookIds: books.map((book) => book._id as Id<"books">),
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
      characters: characters.map((character) => ({
        _id: String(character._id),
        bookId: String(character.bookId),
        name: character.name,
        description: character.description,
        aliases: character.aliases,
        sampleLineCount: character.sampleLineCount,
      })) as CharacterStateInput[],
    }),
  };
}
