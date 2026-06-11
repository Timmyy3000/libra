import { describe, expect, it } from "vitest";
import {
  bookSchema,
  bookUploadInputSchema,
  characterSchema,
  discoverCharactersKickoffSchema,
  storageObjectSchema,
  voiceSchema,
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
  it("accepts supported upload metadata with an explicit title", () => {
    const parsed = bookUploadInputSchema.parse({
      title: "A Christmas Carol",
      author: "Charles Dickens",
      fileName: "christmas-carol.epub",
      contentType: "application/epub+zip",
      sizeBytes: 2048,
    });

    expect(parsed.title).toBe("A Christmas Carol");
    expect(parsed.author).toBe("Charles Dickens");
  });

  it("accepts missing author but still requires a title", () => {
    const parsed = bookUploadInputSchema.parse({
      title: "Dracula",
      fileName: "dracula.pdf",
      contentType: "application/pdf",
      sizeBytes: 2048,
    });

    expect(parsed.title).toBe("Dracula");
    expect(parsed.author).toBeUndefined();
  });

  it("rejects unsupported file types", () => {
    expect(() =>
      bookUploadInputSchema.parse({
        title: "Totally Fine",
        fileName: "malware.exe",
        contentType: "text/plain",
        sizeBytes: 2048,
      }),
    ).toThrowError(/supported/i);
  });
});

describe("discoverCharactersKickoffSchema", () => {
  it("requires the minimum trigger handoff payload including the queued job id", () => {
    const parsed = discoverCharactersKickoffSchema.parse({
      bookId: "book_123",
      jobId: "job_123",
      userId: "user_123",
      sourceFileKey: "books/book_123/source/christmas-carol.epub",
    });

    expect(parsed.jobId).toBe("job_123");
  });
});

describe("characterSchema", () => {
  it("captures a discovered character record", () => {
    const parsed = characterSchema.parse({
      id: "char_123",
      bookId: "book_123",
      name: "Ebenezer Scrooge",
      description: "A bitter miser",
      aliases: ["Scrooge"],
      sampleLineCount: 22,
    });

    expect(parsed.aliases).toEqual(["Scrooge"]);
    expect(parsed.sampleLineCount).toBe(22);
  });
});

describe("voiceSchema", () => {
  it("captures a Gemini TTS voice catalog record", () => {
    const parsed = voiceSchema.parse({
      id: "voice_123",
      userId: "user_123",
      label: "Narrator - Zephyr",
      provider: "gemini",
      providerVoiceId: "Zephyr",
      previewUrl: "https://example.com/zephyr-preview.mp3",
    });

    expect(parsed.provider).toBe("gemini");
    expect(parsed.providerVoiceId).toBe("Zephyr");
  });

  it("rejects unsupported voice providers", () => {
    expect(() =>
      voiceSchema.parse({
        id: "voice_123",
        userId: "user_123",
        label: "Unsupported",
        provider: "other",
        providerVoiceId: "Example",
      }),
    ).toThrowError(/provider/i);
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
