import { z } from "zod";

export const bookStatusSchema = z.enum([
  "uploaded",
  "extracting_text",
  "discovering_characters",
  "characters_ready",
  "failed",
]);

export const auraStatusSchema = z.enum([
  "draft",
  "queued",
  "generating_script",
  "script_ready",
  "generating_audio",
  "ready",
  "failed",
]);

export const scriptLineStatusSchema = z.enum([
  "pending",
  "generating",
  "ready",
  "failed",
]);

export const bookSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1).default("Unknown"),
  sourceFileType: z.enum(["pdf", "epub", "txt"]),
  status: bookStatusSchema,
  characterCount: z.number().int().nonnegative().default(0),
});

export const characterSchema = z.object({
  id: z.string().min(1),
  bookId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  assignedVoiceId: z.string().min(1).optional(),
});

export const auraJobSchema = z.object({
  id: z.string().min(1),
  entityType: z.enum(["book", "aura"]),
  entityId: z.string().min(1),
  jobType: z.enum([
    "discover_characters",
    "generate_script",
    "generate_audio",
    "compile_aura",
  ]),
  status: z.enum(["queued", "running", "completed", "failed"]),
  progressCurrent: z.number().int().nonnegative().default(0),
  progressTotal: z.number().int().nonnegative().default(0),
  step: z.string().min(1),
});

export type BookStatus = z.infer<typeof bookStatusSchema>;
export type AuraStatus = z.infer<typeof auraStatusSchema>;
export type ScriptLineStatus = z.infer<typeof scriptLineStatusSchema>;
export type Book = z.infer<typeof bookSchema>;
export type Character = z.infer<typeof characterSchema>;
export type AuraJob = z.infer<typeof auraJobSchema>;
