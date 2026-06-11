import { NextResponse, type NextRequest } from "next/server";
import { createVoiceForUser, listVoicesByUser } from "@/lib/server/convex";

type PostPayload = {
  label?: unknown;
  provider?: unknown;
  providerVoiceId?: unknown;
  previewUrl?: unknown;
};

export async function GET() {
  try {
    const result = await listVoicesByUser("demo-user");
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load voices.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as PostPayload;
    const label = typeof payload.label === "string" ? payload.label.trim() : "";
    const providerVoiceId = typeof payload.providerVoiceId === "string" ? payload.providerVoiceId.trim() : "";
    const previewUrl = typeof payload.previewUrl === "string" ? payload.previewUrl.trim() : "";
    const provider = payload.provider === "gemini" || payload.provider === undefined ? "gemini" : null;

    if (!label) return NextResponse.json({ ok: false, error: "Voice label is required." }, { status: 400 });
    if (!provider) return NextResponse.json({ ok: false, error: "Only Gemini voices are supported." }, { status: 400 });
    if (!providerVoiceId) return NextResponse.json({ ok: false, error: "Provider voice id is required." }, { status: 400 });

    const result = await createVoiceForUser({
      userId: "demo-user",
      label,
      provider,
      providerVoiceId,
      ...(previewUrl ? { previewUrl } : {}),
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create voice.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
