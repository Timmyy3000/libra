import type { AuraStatus, WorkflowJobStatus } from "./schemas";

export type AuraLifecyclePhase = "started" | "completed" | "failed";

export type AuraLifecycleUpdate = {
  auraStatus: AuraStatus;
  jobStatus: WorkflowJobStatus;
  step: string;
  progressCurrent: number;
  progressTotal: number;
  triggerRunId?: string;
  errorMessage?: string;
};

export function buildAuraLifecycleUpdate(input: {
  phase: AuraLifecyclePhase;
  triggerRunId?: string;
  errorMessage?: string;
}): AuraLifecycleUpdate {
  if (input.phase === "started") {
    return {
      auraStatus: "generating_script",
      jobStatus: "running",
      step: "generating_script",
      progressCurrent: 1,
      progressTotal: 2,
      ...(input.triggerRunId ? { triggerRunId: input.triggerRunId } : {}),
    };
  }

  if (input.phase === "completed") {
    return {
      auraStatus: "script_ready",
      jobStatus: "completed",
      step: "script_ready",
      progressCurrent: 2,
      progressTotal: 2,
      ...(input.triggerRunId ? { triggerRunId: input.triggerRunId } : {}),
    };
  }

  return {
    auraStatus: "failed",
    jobStatus: "failed",
    step: "script_generation_failed",
    progressCurrent: 2,
    progressTotal: 2,
    ...(input.triggerRunId ? { triggerRunId: input.triggerRunId } : {}),
    ...(input.errorMessage ? { errorMessage: input.errorMessage } : {}),
  };
}
