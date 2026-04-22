import { describe, expect, it } from "vitest";
import { buildDiscoveryLifecycleUpdate } from "../src/discovery-lifecycle";

describe("buildDiscoveryLifecycleUpdate", () => {
  it("builds a started update when a discovery run begins", () => {
    const update = buildDiscoveryLifecycleUpdate({
      phase: "started",
      triggerRunId: "run_123",
    });

    expect(update).toEqual({
      bookStatus: "discovering_characters",
      jobStatus: "running",
      step: "extracting_text",
      progressCurrent: 1,
      progressTotal: 3,
      triggerRunId: "run_123",
    });
  });

  it("builds a completed update when discovery finishes", () => {
    const update = buildDiscoveryLifecycleUpdate({
      phase: "completed",
      triggerRunId: "run_123",
      characterCount: 14,
    });

    expect(update).toEqual({
      bookStatus: "characters_ready",
      characterCount: 14,
      jobStatus: "completed",
      step: "characters_ready",
      progressCurrent: 3,
      progressTotal: 3,
      triggerRunId: "run_123",
    });
  });

  it("builds a failed update with an error message", () => {
    const update = buildDiscoveryLifecycleUpdate({
      phase: "failed",
      triggerRunId: "run_123",
      errorMessage: "Parser blew up",
    });

    expect(update).toEqual({
      bookStatus: "failed",
      jobStatus: "failed",
      step: "discovery_failed",
      progressCurrent: 1,
      progressTotal: 3,
      triggerRunId: "run_123",
      errorMessage: "Parser blew up",
    });
  });
});
