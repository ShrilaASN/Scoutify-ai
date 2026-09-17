import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { genderValidator } from "./schema";

/** Athletes registered by the signed-in coach. Falls back to all demo athletes so new coach accounts see the seeded roster. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const mine = await ctx.db
      .query("athletes")
      .withIndex("by_coach", (q) => q.eq("coachId", userId))
      .collect();
    if (mine.length > 0) return mine;
    // Demo fallback: surface the seeded roster for freshly signed-in coach accounts.
    return await ctx.db.query("athletes").collect();
  },
});

/** All athlete profiles (scout/admin views). */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("athletes").collect();
  },
});

/** The athlete profile linked to the signed-in athlete user (if any). */
export const myAthleteProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const rows = await ctx.db
      .query("athletes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return rows[0] ?? null;
  },
});

/**
 * Link the signed-in athlete user to a demo athlete profile so the athlete
 * dashboard shows real data (e.g. after one-tap demo sign-in).
 */
export const linkMyDemoProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const existing = await ctx.db
      .query("athletes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (existing.length > 0) return existing[0]._id;
    // Prefer the seeded demo athlete; otherwise adopt any unlinked profile.
    const all = await ctx.db.query("athletes").collect();
    const demo = all.find((a) => a.name === "Arjun Patil" && a.userId === undefined) ?? all.find((a) => a.userId === undefined);
    if (!demo) return null;
    await ctx.db.patch(demo._id, { userId });
    return demo._id;
  },
});

export const get = query({
  args: { id: v.id("athletes") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const create = mutation({
  args: {
    name: v.string(),
    age: v.number(),
    gender: genderValidator,
    schoolName: v.optional(v.string()),
    region: v.string(),
    sportInterest: v.optional(v.string()),
    heightCm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const id = await ctx.db.insert("athletes", {
      ...args,
      coachId: userId ?? undefined,
      createdAt: Date.now(),
    });
    return id;
  },
});
