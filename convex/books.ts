import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("books", args);
  },
});

export const listByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("books")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
