import { z } from "zod";

export const sourceFileTypeSchema = z.enum(["pdf", "epub", "txt"]);

export const supportedUploadContentTypeSchema = z.enum([
  "application/pdf",
  "application/epub+zip",
  "text/plain",
]);

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

export const workflowJobStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
]);

export const discoverCharactersKickoffSchema = z.object({
  bookId: z.string().min(1),
  jobId: z.string().min(1),
  userId: z.string().min(1),
  sourceFileKey: z.string().min(1),
});

export const storageObjectSchema = z.object({
  key: z.string().min(1),
  bucket: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  publicUrl: z.string().url().optional(),
});

export const bookSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1).default("Unknown"),
  sourceFileType: sourceFileTypeSchema,
  sourceFile: storageObjectSchema,
  status: bookStatusSchema,
  characterCount: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const bookUploadInputSchema = z.object({
  title: z.string().trim().min(1),
  author: z.string().trim().min(1).optional(),
  fileName: z.string().min(1),
  contentType: supportedUploadContentTypeSchema,
  sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
}).superRefine((value, ctx) => {
  const lower = value.fileName.toLowerCase();
  const hasSupportedExtension = [".pdf", ".epub", ".txt"].some((suffix) => lower.endsWith(suffix));

  if (!hasSupportedExtension) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Only supported book file types may be uploaded.",
      path: ["fileName"],
    });
  }
});

export const characterSchema = z.object({
  id: z.string().min(1),
  bookId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  aliases: z.array(z.string().min(1)).default([]),
  sampleLineCount: z.number().int().nonnegative().default(0),
  assignedVoiceId: z.string().min(1).optional(),
});

export const workflowJobSchema = z.object({
  id: z.string().min(1),
  entityType: z.enum(["book", "aura"]),
  entityId: z.string().min(1),
  jobType: z.enum([
    "discover_characters",
    "generate_script",
    "generate_audio",
    "compile_aura",
  ]),
  status: workflowJobStatusSchema,
  progressCurrent: z.number().int().nonnegative().default(0),
  progressTotal: z.number().int().nonnegative().default(0),
  step: z.string().min(1),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type SourceFileType = z.infer<typeof sourceFileTypeSchema>;
export type BookStatus = z.infer<typeof bookStatusSchema>;
export type AuraStatus = z.infer<typeof auraStatusSchema>;
export type ScriptLineStatus = z.infer<typeof scriptLineStatusSchema>;
export type WorkflowJobStatus = z.infer<typeof workflowJobStatusSchema>;
export type DiscoverCharactersKickoff = z.infer<typeof discoverCharactersKickoffSchema>;
export type StorageObject = z.infer<typeof storageObjectSchema>;
export type BookUploadInput = z.infer<typeof bookUploadInputSchema>;
export type Book = z.infer<typeof bookSchema>;
export type Character = z.infer<typeof characterSchema>;
export type WorkflowJob = z.infer<typeof workflowJobSchema>;
