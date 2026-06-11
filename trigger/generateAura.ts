import { ConvexHttpClient } from "convex/browser";
import { buildAuraLifecycleUpdate, generateAuraKickoffSchema, type GenerateAuraKickoff } from "@libra/shared";
import { task } from "@trigger.dev/sdk/v3";

export const generateAuraWorkflowId = "generate-aura";
export type GenerateAuraWorkflowPayload = GenerateAuraKickoff;

const AURA_APPLY_LIFECYCLE = "auraGeneration:applyLifecycle";
const CHARACTERS_LIST_BY_BOOK_ID = "characters:listByBookId";
const SCRIPT_LINES_REPLACE_FOR_AURA = "scriptLines:replaceForAura";

export function createGenerateAuraPayload(input: GenerateAuraWorkflowPayload): GenerateAuraWorkflowPayload {
  return generateAuraKickoffSchema.parse(input);
}

function getConvexClient() {
  const deploymentUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!deploymentUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL for Trigger aura task.");
  return new ConvexHttpClient(deploymentUrl, { skipConvexDeploymentUrlCheck: true, logger: false });
}

type CharacterRecord = { _id: string; name: string; assignedVoiceId?: string };

export const generateAuraTask = task({
  id: generateAuraWorkflowId,
  run: async (rawPayload: GenerateAuraWorkflowPayload, { ctx }) => {
    const payload = createGenerateAuraPayload(rawPayload);
    const client = getConvexClient();

    await client.mutation(AURA_APPLY_LIFECYCLE as any, { auraId: payload.auraId, jobId: payload.jobId, ...buildAuraLifecycleUpdate({ phase: "started", triggerRunId: ctx.run.id }) });

    try {
      const characters = (await client.query(CHARACTERS_LIST_BY_BOOK_ID as any, { bookId: payload.bookId })) as CharacterRecord[];
      if (characters.length === 0) throw new Error("Cannot generate an aura until characters have been discovered.");
      const uncast = characters.filter((character) => !character.assignedVoiceId);
      if (uncast.length > 0) throw new Error(`Cannot generate an aura until every character has a voice: ${uncast.map((c) => c.name).join(", ")}.`);

      const lines = characters.slice(0, 12).map((character, index) => ({
        lineNumber: index + 1,
        speakerName: character.name,
        characterId: String(character._id),
        voiceId: String(character.assignedVoiceId),
        text: `${character.name}: This placeholder aura line is ready for future Gemini TTS generation.`,
        status: "ready" as const,
      }));

      await client.mutation(SCRIPT_LINES_REPLACE_FOR_AURA as any, { auraId: payload.auraId, lines });
      await client.mutation(AURA_APPLY_LIFECYCLE as any, { auraId: payload.auraId, jobId: payload.jobId, ...buildAuraLifecycleUpdate({ phase: "completed", triggerRunId: ctx.run.id }) });
      return { status: "completed" as const, auraId: payload.auraId, lineCount: lines.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Aura generation failed.";
      await client.mutation(AURA_APPLY_LIFECYCLE as any, { auraId: payload.auraId, jobId: payload.jobId, ...buildAuraLifecycleUpdate({ phase: "failed", triggerRunId: ctx.run.id, errorMessage: message }) });
      throw error;
    }
  },
});
