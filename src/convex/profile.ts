import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateAppRole = mutation({
  args: { appRole: v.union(v.literal("coach"), v.literal("athlete"), v.literal("scout")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    await ctx.db.patch(userId, { appRole: args.appRole });
    return userId;
  },
});
