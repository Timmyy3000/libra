import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  books: defineTable({
    userId: v.string(),
    title: v.string(),
    author: v.string(),
    sourceFileType: v.union(v.literal("pdf"), v.literal("epub"), v.literal("txt")),
    sourceFileKey: v.string(),
    sourceFileBucket: v.string(),
    sourceFileContentType: v.string(),
    sourceFileSizeBytes: v.number(),
    status: v.union(
      v.literal("uploaded"),
      v.literal("extracting_text"),
      v.literal("discovering_characters"),
      v.literal("characters_ready"),
      v.literal("failed"),
    ),
    characterCount: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  characters: defineTable({
    bookId: v.id("books"),
    name: v.string(),
    description: v.string(),
    aliases: v.array(v.string()),
    sampleLineCount: v.number(),
    assignedVoiceId: v.optional(v.string()),
  }).index("by_bookId", ["bookId"]),

  voices: defineTable({
    userId: v.string(),
    label: v.string(),
    provider: v.literal("gemini"),
    providerVoiceId: v.string(),
    previewUrl: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  jobs: defineTable({
    entityType: v.union(v.literal("book"), v.literal("aura")),
    entityId: v.id("books"),
    jobType: v.union(
      v.literal("discover_characters"),
      v.literal("generate_script"),
      v.literal("generate_audio"),
      v.literal("compile_aura"),
    ),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    progressCurrent: v.number(),
    progressTotal: v.number(),
    step: v.string(),
    triggerRunId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_entityId", ["entityId"])
    .index("by_status", ["status"]),
});
