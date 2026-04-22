import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const markTriggered = mutation({
  args: {
    bookId: v.id("books"),
    jobId: v.id("jobs"),
    triggerRunId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      triggerRunId: args.triggerRunId,
      step: "submitted_to_trigger",
    });

    await ctx.db.patch(args.bookId, {
      status: "extracting_text",
    });
  },
});

export const applyLifecycle = mutation({
  args: {
    bookId: v.id("books"),
    jobId: v.id("jobs"),
    bookStatus: v.union(
      v.literal("uploaded"),
      v.literal("extracting_text"),
      v.literal("discovering_characters"),
      v.literal("characters_ready"),
      v.literal("failed"),
    ),
    jobStatus: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    step: v.string(),
    progressCurrent: v.number(),
    progressTotal: v.number(),
    triggerRunId: v.optional(v.string()),
    characterCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.jobStatus,
      step: args.step,
      progressCurrent: args.progressCurrent,
      progressTotal: args.progressTotal,
      ...(args.triggerRunId ? { triggerRunId: args.triggerRunId } : {}),
      ...(args.errorMessage ? { errorMessage: args.errorMessage } : {}),
    });

    await ctx.db.patch(args.bookId, {
      status: args.bookStatus,
      ...(args.characterCount !== undefined ? { characterCount: args.characterCount } : {}),
    });
  },
});

export const saveCharacters = mutation({
  args: {
    bookId: v.id("books"),
    characters: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        aliases: v.array(v.string()),
        sampleLineCount: v.number(),
        assignedVoiceId: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("characters")
      .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
      .collect();

    await Promise.all(existing.map((character) => ctx.db.delete(character._id)));

    return await Promise.all(
      args.characters.map((character) =>
        ctx.db.insert("characters", {
          bookId: args.bookId,
          name: character.name,
          description: character.description,
          aliases: character.aliases,
          sampleLineCount: character.sampleLineCount,
          ...(character.assignedVoiceId ? { assignedVoiceId: character.assignedVoiceId } : {}),
        }),
      ),
    );
  },
});
