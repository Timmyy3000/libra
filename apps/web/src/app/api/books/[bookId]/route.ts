import { NextResponse, type NextRequest } from "next/server";
import { getBookById } from "@/lib/server/convex";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { bookId } = await context.params;
    const result = await getBookById("demo-user", bookId);

    if (result.mode === "convex" && !result.book) {
      return NextResponse.json({ ok: false, error: "Book not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load book.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
