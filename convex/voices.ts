import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voices")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    label: v.string(),
    provider: v.literal("gemini"),
    providerVoiceId: v.string(),
    previewUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("voices", {
      userId: args.userId,
      label: args.label,
      provider: args.provider,
      providerVoiceId: args.providerVoiceId,
      ...(args.previewUrl ? { previewUrl: args.previewUrl } : {}),
    });
  },
});
