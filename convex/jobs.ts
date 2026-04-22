import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobs", args);
  },
});
