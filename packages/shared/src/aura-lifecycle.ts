import type { AuraStatus, WorkflowJobStatus } from "./schemas";

export type AuraLifecyclePhase = "started" | "completed" | "audio_started" | "audio_completed" | "failed";

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

  if (input.phase === "audio_started") {
    return {
      auraStatus: "generating_audio",
      jobStatus: "running",
      step: "generating_audio",
      progressCurrent: 1,
      progressTotal: 2,
      ...(input.triggerRunId ? { triggerRunId: input.triggerRunId } : {}),
    };
  }

  if (input.phase === "audio_completed") {
    return {
      auraStatus: "ready",
      jobStatus: "completed",
      step: "audio_ready",
      progressCurrent: 2,
      progressTotal: 2,
      ...(input.triggerRunId ? { triggerRunId: input.triggerRunId } : {}),
    };
  }

  return {
    auraStatus: "failed",
    jobStatus: "failed",
    step: "aura_generation_failed",
    progressCurrent: 2,
    progressTotal: 2,
    ...(input.triggerRunId ? { triggerRunId: input.triggerRunId } : {}),
    ...(input.errorMessage ? { errorMessage: input.errorMessage } : {}),
  };
}
