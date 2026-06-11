import { ConvexHttpClient } from "convex/browser";
import {
  buildBookStateSummaries,
  type BookDetail,
  type BookStateInput,
  type BookStateSummary,
  type BookUploadInput,
  type CharacterStateInput,
  type DiscoverCharactersKickoff,
  type SourceFileType,
  type Voice,
  type WorkflowJobStateInput,
} from "@libra/shared";
import { createDiscoverCharactersPayload, discoverCharactersWorkflowId } from "@libra/trigger";
import { configure, tasks } from "@trigger.dev/sdk/v3";

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

export type GetBookResult =
  | { mode: "convex"; book: BookDetail | null }
  | { mode: "deferred"; reason: string; book: null };

export type UpdateCharacterInput = {
  name: string;
  description: string;
  aliases: string[];
};

export type CharacterMutationResult = { mode: "convex"; characterId: string } | { mode: "deferred"; reason: string };

const FN = {
  booksCreate: "books:create",
  booksListByUser: "books:listByUser",
  jobsCreate: "jobs:create",
  discoveryMarkTriggered: "discovery:markTriggered",
  booksGetById: "books:getById",
  jobsListByEntityIds: "jobs:listByEntityIds",
  charactersListByBookIds: "characters:listByBookIds",
  charactersListByBookId: "characters:listByBookId",
  charactersUpdate: "characters:update",
  charactersRemove: "characters:remove",
  charactersAssignVoice: "characters:assignVoice",
  voicesListByUser: "voices:listByUser",
  voicesCreate: "voices:create",
} as const;

type ConvexClient = NonNullable<ReturnType<typeof getConvexClient>>;
type ConvexMutationReference = Parameters<ConvexClient["mutation"]>[0];
type ConvexQueryReference = Parameters<ConvexClient["query"]>[0];
type ConvexRecord = Record<string, unknown>;

function mutationRef(name: (typeof FN)[keyof typeof FN]): ConvexMutationReference {
  return name as unknown as ConvexMutationReference;
}

function queryRef(name: (typeof FN)[keyof typeof FN]): ConvexQueryReference {
  return name as unknown as ConvexQueryReference;
}

function stringField(record: ConvexRecord, field: string): string {
  return String(record[field]);
}

function numberField(record: ConvexRecord, field: string): number {
  const value = record[field];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function stringArrayField(record: ConvexRecord, field: string): string[] {
  const value = record[field];
  return Array.isArray(value) ? value.map(String) : [];
}

function optionalStringField(record: ConvexRecord, field: string): string | undefined {
  const value = record[field];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function mapJob(job: ConvexRecord): WorkflowJobStateInput {
  return {
    _id: stringField(job, "_id"),
    _creationTime: numberField(job, "_creationTime"),
    entityId: stringField(job, "entityId"),
    jobType: stringField(job, "jobType") as WorkflowJobStateInput["jobType"],
    status: stringField(job, "status") as WorkflowJobStateInput["status"],
    step: stringField(job, "step"),
    progressCurrent: numberField(job, "progressCurrent"),
    progressTotal: numberField(job, "progressTotal"),
  };
}

function mapCharacter(character: ConvexRecord): CharacterStateInput {
  const assignedVoiceId = optionalStringField(character, "assignedVoiceId");

  return {
    _id: stringField(character, "_id"),
    bookId: stringField(character, "bookId"),
    name: stringField(character, "name"),
    description: stringField(character, "description"),
    aliases: stringArrayField(character, "aliases"),
    sampleLineCount: numberField(character, "sampleLineCount"),
    ...(assignedVoiceId ? { assignedVoiceId } : {}),
  };
}

function mapVoice(voice: ConvexRecord): Voice {
  const previewUrl = optionalStringField(voice, "previewUrl");

  return {
    id: stringField(voice, "_id"),
    userId: stringField(voice, "userId"),
    label: stringField(voice, "label"),
    provider: stringField(voice, "provider") as Voice["provider"],
    providerVoiceId: stringField(voice, "providerVoiceId"),
    ...(previewUrl ? { previewUrl } : {}),
  };
}

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

  const bookId = await client.mutation(mutationRef(FN.booksCreate), {
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

  const jobId = await client.mutation(mutationRef(FN.jobsCreate), {
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
    await client.mutation(mutationRef(FN.discoveryMarkTriggered), {
      bookId,
      jobId,
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

  const books = (await client.query(queryRef(FN.booksListByUser), { userId })) as ConvexRecord[];

  const jobs = books.length
    ? ((await client.query(queryRef(FN.jobsListByEntityIds), {
        entityIds: books.map((book) => stringField(book, "_id")),
      })) as ConvexRecord[])
    : [];

  const characters = books.length
    ? ((await client.query(queryRef(FN.charactersListByBookIds), {
        bookIds: books.map((book) => stringField(book, "_id")),
      })) as ConvexRecord[])
    : [];

  return {
    mode: "convex",
    books: buildBookStateSummaries({
      books: books as BookStateInput[],
      jobs: jobs.map(mapJob),
      characters: characters.map(mapCharacter),
    }),
  };
}

export async function getBookById(userId: string, bookId: string): Promise<GetBookResult> {
  const client = getConvexClient();
  if (!client) {
    return {
      mode: "deferred",
      reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to read persisted books.",
      book: null,
    };
  }

  const book = (await client.query(queryRef(FN.booksGetById), { userId, bookId })) as ConvexRecord | null;
  if (!book) {
    return { mode: "convex", book: null };
  }

  const [jobs, characters, voices] = await Promise.all([
    client.query(queryRef(FN.jobsListByEntityIds), { entityIds: [bookId] }) as Promise<ConvexRecord[]>,
    client.query(queryRef(FN.charactersListByBookId), { bookId }) as Promise<ConvexRecord[]>,
    client.query(queryRef(FN.voicesListByUser), { userId }) as Promise<ConvexRecord[]>,
  ]);

  const [summary] = buildBookStateSummaries({
    books: [book as BookStateInput],
    jobs: jobs.map(mapJob),
    characters: characters.map(mapCharacter),
  });

  return { mode: "convex", book: summary ? { ...summary, voices: voices.map(mapVoice) } : null };
}

export async function updateCharacterById(
  characterId: string,
  input: UpdateCharacterInput,
): Promise<CharacterMutationResult> {
  const client = getConvexClient();
  if (!client) {
    return { mode: "deferred", reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to update characters." };
  }

  const updatedId = await client.mutation(mutationRef(FN.charactersUpdate), { characterId, ...input });
  return { mode: "convex", characterId: String(updatedId) };
}

export async function deleteCharacterById(characterId: string): Promise<CharacterMutationResult> {
  const client = getConvexClient();
  if (!client) {
    return { mode: "deferred", reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to delete characters." };
  }

  const deletedId = await client.mutation(mutationRef(FN.charactersRemove), { characterId });
  return { mode: "convex", characterId: String(deletedId) };
}

export async function listVoicesByUser(
  userId: string,
): Promise<{ mode: "convex"; voices: Voice[] } | { mode: "deferred"; reason: string; voices: [] }> {
  const client = getConvexClient();
  if (!client) {
    return { mode: "deferred", reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to read voices.", voices: [] };
  }

  const voices = (await client.query(queryRef(FN.voicesListByUser), { userId })) as ConvexRecord[];
  return { mode: "convex", voices: voices.map(mapVoice) };
}

export async function createVoiceForUser(input: {
  userId: string;
  label: string;
  provider: Voice["provider"];
  providerVoiceId: string;
  previewUrl?: string;
}): Promise<{ mode: "convex"; voiceId: string } | { mode: "deferred"; reason: string }> {
  const client = getConvexClient();
  if (!client) {
    return { mode: "deferred", reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to create voices." };
  }

  const voiceId = await client.mutation(mutationRef(FN.voicesCreate), input);
  return { mode: "convex", voiceId: String(voiceId) };
}

export async function assignVoiceToCharacter(
  characterId: string,
  assignedVoiceId?: string,
): Promise<CharacterMutationResult> {
  const client = getConvexClient();
  if (!client) {
    return { mode: "deferred", reason: "Set NEXT_PUBLIC_CONVEX_URL and deploy Convex functions to assign voices." };
  }

  const updatedId = await client.mutation(mutationRef(FN.charactersAssignVoice), {
    characterId,
    ...(assignedVoiceId ? { assignedVoiceId } : {}),
  });
  return { mode: "convex", characterId: String(updatedId) };
}
