import { NextResponse } from "next/server";
import { listBooksByUser } from "@/lib/server/convex";

export async function GET() {
  try {
    const result = await listBooksByUser("demo-user");

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load books.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status: 400,
      },
    );
  }
}
