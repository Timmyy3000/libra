import type { BookStatus, WorkflowJobStatus } from "./schemas";

type DiscoveryLifecyclePhase = "started" | "completed" | "failed";

type DiscoveryLifecycleBase = {
  triggerRunId: string;
};

type DiscoveryLifecycleInput =
  | ({ phase: "started" } & DiscoveryLifecycleBase)
  | ({ phase: "completed"; characterCount: number } & DiscoveryLifecycleBase)
  | ({ phase: "failed"; errorMessage: string } & DiscoveryLifecycleBase);

export type DiscoveryLifecycleUpdate = {
  bookStatus: BookStatus;
  jobStatus: WorkflowJobStatus;
  step: string;
  progressCurrent: number;
  progressTotal: number;
  triggerRunId: string;
  characterCount?: number;
  errorMessage?: string;
};

const DISCOVERY_PROGRESS_TOTAL = 3;

export function buildDiscoveryLifecycleUpdate(
  input: DiscoveryLifecycleInput,
): DiscoveryLifecycleUpdate {
  switch (input.phase) {
    case "started":
      return {
        bookStatus: "discovering_characters",
        jobStatus: "running",
        step: "extracting_text",
        progressCurrent: 1,
        progressTotal: DISCOVERY_PROGRESS_TOTAL,
        triggerRunId: input.triggerRunId,
      };

    case "completed":
      return {
        bookStatus: "characters_ready",
        characterCount: input.characterCount,
        jobStatus: "completed",
        step: "characters_ready",
        progressCurrent: DISCOVERY_PROGRESS_TOTAL,
        progressTotal: DISCOVERY_PROGRESS_TOTAL,
        triggerRunId: input.triggerRunId,
      };

    case "failed":
      return {
        bookStatus: "failed",
        jobStatus: "failed",
        step: "discovery_failed",
        progressCurrent: 1,
        progressTotal: DISCOVERY_PROGRESS_TOTAL,
        triggerRunId: input.triggerRunId,
        errorMessage: input.errorMessage,
      };
  }
}
