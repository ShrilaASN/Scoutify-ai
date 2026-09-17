import { query } from "./_generated/server";
import { v } from "convex/values";
import { testTypeValidator } from "./schema";

export const list = query({
  args: { testType: v.optional(testTypeValidator) },
  handler: async (ctx, args) => {
    if (args.testType) {
      return await ctx.db
        .query("benchmarkNorms")
        .withIndex("by_type_gender", (q) => q.eq("testType", args.testType!))
        .collect();
    }
    return await ctx.db.query("benchmarkNorms").collect();
  },
});
