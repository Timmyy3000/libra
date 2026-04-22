import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const listByEntityIds = query({
  args: {
    entityIds: v.array(v.id("books")),
  },
  handler: async (ctx, args) => {
    const jobs = await Promise.all(
      args.entityIds.map((entityId) =>
        ctx.db
          .query("jobs")
          .withIndex("by_entityId", (q) => q.eq("entityId", entityId))
          .order("desc")
          .collect(),
      ),
    );

    return jobs.flat();
  },
});
