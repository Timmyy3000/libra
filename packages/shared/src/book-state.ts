import type { BookStatus, SourceFileType, WorkflowJobStatus } from "./schemas";

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

export type BookStateSummary = {
  id: string;
  title: string;
  author: string;
  status: BookStatus;
  sourceFileType: SourceFileType;
  characterCount: number;
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
}): BookStateSummary[] {
  const latestJobsByEntityId = new Map<string, WorkflowJobStateInput>();

  for (const job of input.jobs) {
    const current = latestJobsByEntityId.get(job.entityId);
    if (!current || current._creationTime < job._creationTime) {
      latestJobsByEntityId.set(job.entityId, job);
    }
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
