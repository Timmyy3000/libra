import { v } from "convex/values";
import { mutation } from "./_generated/server";

const auraStatus = v.union(v.literal("draft"), v.literal("queued"), v.literal("generating_script"), v.literal("script_ready"), v.literal("generating_audio"), v.literal("ready"), v.literal("failed"));
const jobStatus = v.union(v.literal("queued"), v.literal("running"), v.literal("completed"), v.literal("failed"));

export const markTriggered = mutation({
  args: { auraId: v.id("auras"), jobId: v.id("jobs"), triggerRunId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.auraId, { triggerRunId: args.triggerRunId });
    await ctx.db.patch(args.jobId, { triggerRunId: args.triggerRunId });
    return args.auraId;
  },
});

export const applyLifecycle = mutation({
  args: {
    auraId: v.id("auras"), jobId: v.id("jobs"), auraStatus, jobStatus, step: v.string(), progressCurrent: v.number(), progressTotal: v.number(), triggerRunId: v.optional(v.string()), errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { auraId, jobId, auraStatus, jobStatus, step, progressCurrent, progressTotal, triggerRunId, errorMessage } = args;
    await ctx.db.patch(auraId, { status: auraStatus, ...(triggerRunId ? { triggerRunId } : {}), ...(errorMessage ? { errorMessage } : {}) });
    await ctx.db.patch(jobId, { status: jobStatus, step, progressCurrent, progressTotal, ...(triggerRunId ? { triggerRunId } : {}), ...(errorMessage ? { errorMessage } : {}) });
    return auraId;
  },
});
