import { NextResponse, type NextRequest } from "next/server";
import { assignVoiceToCharacter } from "@/lib/server/convex";

type RouteContext = {
  params: Promise<{ bookId: string; characterId: string }>;
};

type PatchPayload = {
  assignedVoiceId?: unknown;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { characterId } = await context.params;
    const payload = (await request.json()) as PatchPayload;
    const assignedVoiceId = typeof payload.assignedVoiceId === "string" ? payload.assignedVoiceId.trim() : "";
    const result = await assignVoiceToCharacter(characterId, assignedVoiceId || undefined);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign voice.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
