import { describe, expect, it } from "vitest";
import { auraJobSchema, bookSchema } from "../src/schemas";

describe("bookSchema", () => {
  it("accepts the upload-to-discovery lifecycle states", () => {
    const parsed = bookSchema.parse({
      id: "book_123",
      title: "A Christmas Carol",
      author: "Charles Dickens",
      sourceFileType: "epub",
      status: "discovering_characters",
      characterCount: 0,
    });

    expect(parsed.status).toBe("discovering_characters");
  });
});

describe("auraJobSchema", () => {
  it("tracks a workflow step with progress", () => {
    const parsed = auraJobSchema.parse({
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
