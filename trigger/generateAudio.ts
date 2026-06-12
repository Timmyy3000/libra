import { ConvexHttpClient } from "convex/browser";
import { buildAuraLifecycleUpdate } from "@libra/shared";
import { task } from "@trigger.dev/sdk/v3";
import { generateGeminiSpeech } from "./geminiTts";
import { writeAudioToR2 } from "./r2";

export const generateAudioWorkflowId = "generate-audio";

export type GenerateAudioWorkflowPayload = {
  bookId: string;
  auraId: string;
  jobId: string;
  userId: string;
};

const AURA_APPLY_LIFECYCLE = "auraGeneration:applyLifecycle";
const SCRIPT_LINES_LIST_BY_AURA_ID = "scriptLines:listByAuraId";
const SCRIPT_LINES_REPLACE_FOR_AURA = "scriptLines:replaceForAura";
const VOICES_LIST_BY_USER = "voices:listByUser";

type ScriptLineRecord = {
  _id: string;
  lineNumber: number;
  speakerName: string;
  characterId: string;
  voiceId: string;
  text: string;
  status: "pending" | "generating" | "ready" | "failed";
  audioUrl?: string;
};

type VoiceRecord = {
  _id: string;
  providerVoiceId: string;
};

function getConvexClient() {
  const deploymentUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!deploymentUrl) throw new Error("Missing CONVEX_URL or NEXT_PUBLIC_CONVEX_URL for Trigger audio task.");
  return new ConvexHttpClient(deploymentUrl, { skipConvexDeploymentUrlCheck: true, logger: false });
}

function audioExtension(mimeType: string): string {
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav") || mimeType.includes("pcm")) return "wav";
  return "audio";
}

export const generateAudioTask = task({
  id: generateAudioWorkflowId,
  run: async (payload: GenerateAudioWorkflowPayload, { ctx }) => {
    const client = getConvexClient();
    await client.mutation(AURA_APPLY_LIFECYCLE as any, { auraId: payload.auraId, jobId: payload.jobId, ...buildAuraLifecycleUpdate({ phase: "audio_started", triggerRunId: ctx.run.id }) });

    try {
      const [lines, voices] = await Promise.all([
        client.query(SCRIPT_LINES_LIST_BY_AURA_ID as any, { auraId: payload.auraId }) as Promise<ScriptLineRecord[]>,
        client.query(VOICES_LIST_BY_USER as any, { userId: payload.userId }) as Promise<VoiceRecord[]>,
      ]);
      if (lines.length === 0) throw new Error("Cannot generate audio before script lines exist.");

      const voicesById = new Map(voices.map((voice) => [String(voice._id), voice.providerVoiceId]));
      const updatedLines = [];

      for (const line of lines.sort((a, b) => a.lineNumber - b.lineNumber)) {
        const providerVoiceId = voicesById.get(String(line.voiceId));
        if (!providerVoiceId) throw new Error(`Missing voice record for script line ${line.lineNumber}.`);

        const audio = await generateGeminiSpeech({ text: line.text, voiceName: providerVoiceId });
        const key = `audio/${payload.bookId}/${payload.auraId}/line-${String(line.lineNumber).padStart(4, "0")}.${audioExtension(audio.mimeType)}`;
        const audioUrl = await writeAudioToR2({ key, bytes: audio.bytes, contentType: audio.mimeType });

        updatedLines.push({
          lineNumber: line.lineNumber,
          speakerName: line.speakerName,
          characterId: line.characterId,
          voiceId: line.voiceId,
          text: line.text,
          status: "ready" as const,
          audioUrl,
        });
      }

      await client.mutation(SCRIPT_LINES_REPLACE_FOR_AURA as any, { auraId: payload.auraId, lines: updatedLines });
      await client.mutation(AURA_APPLY_LIFECYCLE as any, { auraId: payload.auraId, jobId: payload.jobId, ...buildAuraLifecycleUpdate({ phase: "audio_completed", triggerRunId: ctx.run.id }) });
      return { status: "completed" as const, auraId: payload.auraId, lineCount: updatedLines.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Audio generation failed.";
      await client.mutation(AURA_APPLY_LIFECYCLE as any, { auraId: payload.auraId, jobId: payload.jobId, ...buildAuraLifecycleUpdate({ phase: "failed", triggerRunId: ctx.run.id, errorMessage: message }) });
      throw error;
    }
  },
});
