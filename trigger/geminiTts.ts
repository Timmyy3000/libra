export type GeminiTtsInput = {
  text: string;
  voiceName: string;
  apiKey?: string;
  model?: string;
};

export type GeminiTtsAudio = {
  bytes: Uint8Array;
  mimeType: string;
};

type GeminiPart = {
  inlineData?: {
    mimeType?: string;
    data?: string;
  };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

function getApiKey(explicit?: string): string {
  const apiKey = explicit ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY for Gemini TTS.");
  return apiKey;
}

function decodeBase64(data: string): Uint8Array {
  return Uint8Array.from(Buffer.from(data, "base64"));
}

export async function generateGeminiSpeech(input: GeminiTtsInput): Promise<GeminiTtsAudio> {
  const apiKey = getApiKey(input.apiKey);
  const model = input.model ?? process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: input.text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voiceName },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini TTS request failed: ${response.status} ${body.slice(0, 240)}`);
  }

  const payload = (await response.json()) as GeminiResponse;
  const audio = payload.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
  if (!audio?.data) throw new Error("Gemini TTS response did not include audio data.");

  return {
    bytes: decodeBase64(audio.data),
    mimeType: audio.mimeType ?? "audio/wav",
  };
}
