import { describe, expect, it } from "vitest";
import {
  bookSchema,
  bookUploadInputSchema,
  storageObjectSchema,
  workflowJobSchema,
} from "../src/schemas";

describe("bookSchema", () => {
  it("accepts the upload-to-discovery lifecycle states", () => {
    const parsed = bookSchema.parse({
      id: "book_123",
      userId: "user_123",
      title: "A Christmas Carol",
      author: "Charles Dickens",
      sourceFileType: "epub",
      sourceFile: {
        key: "books/book_123/source.epub",
        bucket: "libra-dev",
        contentType: "application/epub+zip",
        sizeBytes: 1024,
      },
      status: "discovering_characters",
      characterCount: 0,
    });

    expect(parsed.status).toBe("discovering_characters");
  });
});

describe("workflowJobSchema", () => {
  it("tracks a workflow step with progress", () => {
    const parsed = workflowJobSchema.parse({
      id: "job_123",
      entityType: "book",
      entityId: "book_123",
      jobType: "discover_characters",
      status: "running",
      progressCurrent: 1,
      progressTotal: 3,
      step: "extracting_text",
    });

    expect(parsed.progressTotal).toBe(3);
  });
});

describe("bookUploadInputSchema", () => {
  it("accepts supported upload metadata", () => {
    const parsed = bookUploadInputSchema.parse({
      fileName: "christmas-carol.epub",
      contentType: "application/epub+zip",
      sizeBytes: 2048,
    });

    expect(parsed.fileName).toBe("christmas-carol.epub");
  });

  it("rejects unsupported file types", () => {
    expect(() =>
      bookUploadInputSchema.parse({
        fileName: "malware.exe",
        contentType: "text/plain",
        sizeBytes: 2048,
      }),
    ).toThrowError(/supported/i);
  });
});

describe("storageObjectSchema", () => {
  it("requires an object key and bucket", () => {
    const parsed = storageObjectSchema.parse({
      key: "books/book_123/source.pdf",
      bucket: "libra-dev",
      contentType: "application/pdf",
      sizeBytes: 4096,
    });

    expect(parsed.bucket).toBe("libra-dev");
  });
});
