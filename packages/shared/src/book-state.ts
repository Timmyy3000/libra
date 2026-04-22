import type { BookStatus, Character, SourceFileType, WorkflowJobStatus } from "./schemas";

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
};

export type BookStateSummary = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  sourceFileType: SourceFileType;
  characterCount: number;
  characters: Array<Pick<Character, "id" | "name" | "description" | "aliases" | "sampleLineCount">>;
  currentJob?: {
    id: string;
    jobType: WorkflowJobStateInput["jobType"];
    status: WorkflowJobStatus;
    step: string;
    progressCurrent: number;
    progressTotal: number;
  };
};

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
    });
    charactersByBookId.set(character.bookId, existing);
  }

  return input.books.map((book) => {
    const currentJob = latestJobsByEntityId.get(book._id);

    return {
      id: book._id,
      title: book.title,
      author: book.author,
      status: book.status,
      sourceFileType: book.sourceFileType,
      characterCount: book.characterCount,
      characters: charactersByBookId.get(book._id) ?? [],
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
