import { NextResponse, type NextRequest } from "next/server";
import { deleteCharacterById, updateCharacterById } from "@/lib/server/convex";

type RouteContext = {
  params: Promise<{ bookId: string; characterId: string }>;
};

type PatchPayload = {
  name?: unknown;
  description?: unknown;
  aliases?: unknown;
};

function normalizeAliases(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((alias) => alias.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((alias) => alias.trim())
      .filter(Boolean);
  }

  return [];
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { characterId } = await context.params;
    const payload = (await request.json()) as PatchPayload;
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const description = typeof payload.description === "string" ? payload.description.trim() : "";

    if (!name) {
      return NextResponse.json({ ok: false, error: "Character name is required." }, { status: 400 });
    }

    const result = await updateCharacterById(characterId, {
      name,
      description,
      aliases: normalizeAliases(payload.aliases),
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update character.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { characterId } = await context.params;
    const result = await deleteCharacterById(characterId);
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete character.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
