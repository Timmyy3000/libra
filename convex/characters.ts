import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const replaceForBook = mutation({
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

export const listByBookIds = query({
  args: {
    bookIds: v.array(v.id("books")),
  },
  handler: async (ctx, args) => {
    const characters = await Promise.all(
      args.bookIds.map((bookId) =>
        ctx.db
          .query("characters")
          .withIndex("by_bookId", (q) => q.eq("bookId", bookId))
          .collect(),
      ),
    );

    return characters.flat();
  },
});
