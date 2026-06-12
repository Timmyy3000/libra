import { describe, expect, it } from "vitest";
import { buildAuraLifecycleUpdate } from "../src/aura-lifecycle";
import { auraSchema, generateAuraKickoffSchema, scriptLineSchema } from "../src/schemas";

describe("aura contracts", () => {
  it("parses aura generation kickoff payloads", () => {
    expect(generateAuraKickoffSchema.parse({ bookId: "book_1", auraId: "aura_1", jobId: "job_1", userId: "user_1" })).toEqual({
      bookId: "book_1",
      auraId: "aura_1",
      jobId: "job_1",
      userId: "user_1",
    });
  });

  it("parses persisted aura and script line records", () => {
    expect(auraSchema.parse({ id: "aura_1", bookId: "book_1", title: "Aura", status: "queued" }).status).toBe("queued");
    expect(scriptLineSchema.parse({ id: "line_1", auraId: "aura_1", lineNumber: 1, speakerName: "A", characterId: "char_1", voiceId: "voice_1", text: "Hello", status: "ready" }).lineNumber).toBe(1);
  });
});

describe("buildAuraLifecycleUpdate", () => {
  it("builds started, completed, and failed updates", () => {
    expect(buildAuraLifecycleUpdate({ phase: "started", triggerRunId: "run_1" })).toEqual({ auraStatus: "generating_script", jobStatus: "running", step: "generating_script", progressCurrent: 1, progressTotal: 2, triggerRunId: "run_1" });
    expect(buildAuraLifecycleUpdate({ phase: "completed", triggerRunId: "run_1" })).toEqual({ auraStatus: "script_ready", jobStatus: "completed", step: "script_ready", progressCurrent: 2, progressTotal: 2, triggerRunId: "run_1" });
    expect(buildAuraLifecycleUpdate({ phase: "audio_started", triggerRunId: "run_1" })).toEqual({ auraStatus: "generating_audio", jobStatus: "running", step: "generating_audio", progressCurrent: 1, progressTotal: 2, triggerRunId: "run_1" });
    expect(buildAuraLifecycleUpdate({ phase: "audio_completed", triggerRunId: "run_1" })).toEqual({ auraStatus: "ready", jobStatus: "completed", step: "audio_ready", progressCurrent: 2, progressTotal: 2, triggerRunId: "run_1" });
    expect(buildAuraLifecycleUpdate({ phase: "failed", triggerRunId: "run_1", errorMessage: "boom" })).toMatchObject({ auraStatus: "failed", jobStatus: "failed", errorMessage: "boom" });
  });
});
