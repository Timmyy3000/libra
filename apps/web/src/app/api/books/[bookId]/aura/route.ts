import { NextResponse, type NextRequest } from "next/server";
import { generateAuraForBook } from "@/lib/server/convex";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { bookId } = await context.params;
    const result = await generateAuraForBook("demo-user", bookId);

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate aura.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
