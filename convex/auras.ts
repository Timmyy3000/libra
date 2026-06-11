import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const auraStatus = v.union(v.literal("draft"), v.literal("queued"), v.literal("generating_script"), v.literal("script_ready"), v.literal("generating_audio"), v.literal("ready"), v.literal("failed"));

export const create = mutation({
  args: { bookId: v.id("books"), title: v.string(), status: auraStatus },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auras", args);
  },
});

export const getByBookId = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db.query("auras").withIndex("by_bookId", (q) => q.eq("bookId", args.bookId)).order("desc").first();
  },
});
