import type { BookStatus, Character, SourceFileType, Voice, WorkflowJobStatus } from "./schemas";

export type BookStateInput = {
  _id: string;
  _creationTime: number;
  title: string;
  author: string;
  status: BookStatus;
  sourceFileType: SourceFileType;
  characterCount: number;
};

export type WorkflowJobStateInput = {
  _id: string;
  _creationTime: number;
  entityId: string;
  jobType: "discover_characters" | "generate_script" | "generate_audio" | "compile_aura";
  status: WorkflowJobStatus;
  step: string;
  progressCurrent: number;
  progressTotal: number;
};

export type CharacterStateInput = {
  _id: string;
  bookId: string;
  name: string;
  description: string;
  aliases: string[];
  sampleLineCount: number;
  assignedVoiceId?: string;
};

export type PlaybackStage = "discovering_cast" | "ready_for_casting" | "ready_for_playback" | "blocked";

export type PlaybackReadiness = "not_ready" | "ready";

export type BookStateSummary = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  sourceFileType: SourceFileType;
  characterCount: number;
  characters: Array<Pick<Character, "id" | "name" | "description" | "aliases" | "sampleLineCount" | "assignedVoiceId">>;
  playbackStage: PlaybackStage;
  playbackReadiness: PlaybackReadiness;
  currentJob?: {
    id: string;
    jobType: WorkflowJobStateInput["jobType"];
    status: WorkflowJobStatus;
    step: string;
    progressCurrent: number;
    progressTotal: number;
  };
};

export type BookDetail = BookStateSummary & {
  voices: Voice[];
};

function inferPlaybackStage(bookStatus: BookStatus, currentJob?: WorkflowJobStateInput): PlaybackStage {
  if (bookStatus === "failed" || currentJob?.status === "failed") {
    return "blocked";
  }

  if (
    currentJob &&
    (currentJob.jobType === "generate_audio" || currentJob.jobType === "compile_aura") &&
    currentJob.status === "completed"
  ) {
    return "ready_for_playback";
  }

  if (bookStatus === "characters_ready") {
    return "ready_for_casting";
  }

  return "discovering_cast";
}

function inferPlaybackReadiness(playbackStage: PlaybackStage): PlaybackReadiness {
  return playbackStage === "ready_for_playback" ? "ready" : "not_ready";
}

export function buildBookStateSummaries(input: {
  books: BookStateInput[];
  jobs: WorkflowJobStateInput[];
  characters: CharacterStateInput[];
}): BookStateSummary[] {
  const latestJobsByEntityId = new Map<string, WorkflowJobStateInput>();
  const charactersByBookId = new Map<string, BookStateSummary["characters"]>();

  for (const job of input.jobs) {
    const current = latestJobsByEntityId.get(job.entityId);
    if (!current || current._creationTime < job._creationTime) {
      latestJobsByEntityId.set(job.entityId, job);
    }
  }

  for (const character of input.characters) {
    const existing = charactersByBookId.get(character.bookId) ?? [];
    existing.push({
      id: character._id,
      name: character.name,
      description: character.description,
      aliases: character.aliases,
      sampleLineCount: character.sampleLineCount,
      ...(character.assignedVoiceId ? { assignedVoiceId: character.assignedVoiceId } : {}),
    });
    charactersByBookId.set(character.bookId, existing);
  }

  return input.books.map((book) => {
    const currentJob = latestJobsByEntityId.get(book._id);
    const playbackStage = inferPlaybackStage(book.status, currentJob);

    return {
      id: book._id,
      title: book.title,
      author: book.author,
      status: book.status,
      sourceFileType: book.sourceFileType,
      characterCount: book.characterCount,
      characters: charactersByBookId.get(book._id) ?? [],
      playbackStage,
      playbackReadiness: inferPlaybackReadiness(playbackStage),
      ...(currentJob
        ? {
            currentJob: {
              id: currentJob._id,
              jobType: currentJob.jobType,
              status: currentJob.status,
              step: currentJob.step,
              progressCurrent: currentJob.progressCurrent,
              progressTotal: currentJob.progressTotal,
            },
          }
        : {}),
    } satisfies BookStateSummary;
  });
}
