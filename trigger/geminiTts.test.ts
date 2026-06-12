import { afterEach, describe, expect, it, vi } from "vitest";
import { generateGeminiSpeech } from "./geminiTts";

describe("generateGeminiSpeech", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls Gemini TTS with audio modality and a prebuilt voice", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ inlineData: { mimeType: "audio/wav", data: Buffer.from("wav-bytes").toString("base64") } }] } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const audio = await generateGeminiSpeech({ text: "Hello", voiceName: "Kore", apiKey: "test-key" });

    expect(Buffer.from(audio.bytes).toString("utf8")).toBe("wav-bytes");
    expect(audio.mimeType).toBe("audio/wav");
    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    const [url, init] = call!;
    expect(String(url)).toContain("gemini-2.5-flash-preview-tts:generateContent");
    expect(String(url)).toContain("key=test-key");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
      },
    });
  });

  it("fails honestly when Gemini returns no audio", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ candidates: [] }), { status: 200 })));

    await expect(generateGeminiSpeech({ text: "Hello", voiceName: "Kore", apiKey: "test-key" })).rejects.toThrow(
      "Gemini TTS response did not include audio data.",
    );
  });
});
