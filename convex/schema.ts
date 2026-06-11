import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  books: defineTable({
    userId: v.string(), title: v.string(), author: v.string(),
    sourceFileType: v.union(v.literal("pdf"), v.literal("epub"), v.literal("txt")),
    sourceFileKey: v.string(), sourceFileBucket: v.string(), sourceFileContentType: v.string(), sourceFileSizeBytes: v.number(),
    status: v.union(v.literal("uploaded"), v.literal("extracting_text"), v.literal("discovering_characters"), v.literal("characters_ready"), v.literal("failed")),
    characterCount: v.number(),
  }).index("by_userId", ["userId"]).index("by_status", ["status"]),

  characters: defineTable({ bookId: v.id("books"), name: v.string(), description: v.string(), aliases: v.array(v.string()), sampleLineCount: v.number(), assignedVoiceId: v.optional(v.string()) }).index("by_bookId", ["bookId"]),
  voices: defineTable({ userId: v.string(), label: v.string(), provider: v.literal("gemini"), providerVoiceId: v.string(), previewUrl: v.optional(v.string()) }).index("by_userId", ["userId"]),

  auras: defineTable({
    bookId: v.id("books"), title: v.string(),
    status: v.union(v.literal("draft"), v.literal("queued"), v.literal("generating_script"), v.literal("script_ready"), v.literal("generating_audio"), v.literal("ready"), v.literal("failed")),
    triggerRunId: v.optional(v.string()), errorMessage: v.optional(v.string()),
  }).index("by_bookId", ["bookId"]),

  scriptLines: defineTable({
    auraId: v.id("auras"), lineNumber: v.number(), speakerName: v.string(), characterId: v.string(), voiceId: v.string(), text: v.string(),
    status: v.union(v.literal("pending"), v.literal("generating"), v.literal("ready"), v.literal("failed")),
    audioUrl: v.optional(v.string()),
  }).index("by_auraId", ["auraId"]).index("by_auraId_and_lineNumber", ["auraId", "lineNumber"]),

  jobs: defineTable({
    entityType: v.union(v.literal("book"), v.literal("aura")), entityId: v.string(),
    jobType: v.union(v.literal("discover_characters"), v.literal("generate_script"), v.literal("generate_audio"), v.literal("compile_aura")),
    status: v.union(v.literal("queued"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    progressCurrent: v.number(), progressTotal: v.number(), step: v.string(), triggerRunId: v.optional(v.string()), errorMessage: v.optional(v.string()),
  }).index("by_entityId", ["entityId"]).index("by_status", ["status"]),
});
