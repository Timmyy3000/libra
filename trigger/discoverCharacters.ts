import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../convex/_generated/dataModel";
import { api } from "../convex/_generated/api";
import {
  buildDiscoveryLifecycleUpdate,
  discoverCharactersKickoffSchema,
  type DiscoverCharactersKickoff,
} from "@libra/shared";
import { task } from "@trigger.dev/sdk/v3";

export const discoverCharactersWorkflowId = "discover-characters";

export type DiscoverCharactersWorkflowPayload = DiscoverCharactersKickoff;

export function createDiscoverCharactersPayload(
  input: DiscoverCharactersWorkflowPayload,
): DiscoverCharactersWorkflowPayload {
  return discoverCharactersKickoffSchema.parse(input);
}

function getConvexClient() {
  const deploymentUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!deploymentUrl) {
    throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL for Trigger discovery task.");
  }

  return new ConvexHttpClient(deploymentUrl, {
    skipConvexDeploymentUrlCheck: true,
    logger: false,
  });
}

export const discoverCharactersTask = task({
  id: discoverCharactersWorkflowId,
  run: async (rawPayload: DiscoverCharactersWorkflowPayload, { ctx }) => {
    const payload = createDiscoverCharactersPayload(rawPayload);
    const client = getConvexClient();

    await client.mutation(api.discovery.applyLifecycle, {
      bookId: payload.bookId as Id<"books">,
      jobId: payload.jobId as Id<"jobs">,
      ...buildDiscoveryLifecycleUpdate({
        phase: "started",
        triggerRunId: ctx.run.id,
      }),
    });

    try {
      const characterCount = 0;

      await client.mutation(api.discovery.applyLifecycle, {
        bookId: payload.bookId as Id<"books">,
        jobId: payload.jobId as Id<"jobs">,
        ...buildDiscoveryLifecycleUpdate({
          phase: "completed",
          triggerRunId: ctx.run.id,
          characterCount,
        }),
      });

      return {
        bookId: payload.bookId,
        jobId: payload.jobId,
        characterCount,
        status: "completed" as const,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Discovery workflow failed.";

      await client.mutation(api.discovery.applyLifecycle, {
        bookId: payload.bookId as Id<"books">,
        jobId: payload.jobId as Id<"jobs">,
        ...buildDiscoveryLifecycleUpdate({
          phase: "failed",
          triggerRunId: ctx.run.id,
          errorMessage: message,
        }),
      });

      throw error;
    }
  },
});
