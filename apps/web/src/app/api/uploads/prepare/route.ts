import { bookUploadInputSchema } from "@libra/shared";
import { NextResponse } from "next/server";
import { persistPreparedUpload } from "@/lib/server/convex";
import { prepareBookUpload } from "@/lib/server/r2";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = bookUploadInputSchema.parse(body);
    const preparedUpload = await prepareBookUpload(input);
    const persistence = await persistPreparedUpload({
      bookId: preparedUpload.bookId,
      objectKey: preparedUpload.objectKey,
      sourceFileType: preparedUpload.sourceFileType,
      title: input.title,
      uploadInput: input,
      ...(input.author ? { author: input.author } : {}),
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...preparedUpload,
        persistence,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare upload.";

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
