import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const scriptStatus = v.union(v.literal("pending"), v.literal("generating"), v.literal("ready"), v.literal("failed"));

export const replaceForAura = mutation({
  args: {
    auraId: v.id("auras"),
    lines: v.array(v.object({ lineNumber: v.number(), speakerName: v.string(), characterId: v.string(), voiceId: v.string(), text: v.string(), status: scriptStatus, audioUrl: v.optional(v.string()) })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("scriptLines").withIndex("by_auraId", (q) => q.eq("auraId", args.auraId)).collect();
    await Promise.all(existing.map((line) => ctx.db.delete(line._id)));
    await Promise.all(args.lines.map((line) => ctx.db.insert("scriptLines", { auraId: args.auraId, ...line })));
    return args.lines.length;
  },
});

export const listByAuraId = query({
  args: { auraId: v.id("auras") },
  handler: async (ctx, args) => {
    return await ctx.db.query("scriptLines").withIndex("by_auraId_and_lineNumber", (q) => q.eq("auraId", args.auraId)).collect();
  },
});
