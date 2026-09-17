import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { genderValidator, testTypeValidator } from "./schema";
import { UNIT_BY_TYPE, computePercentile, matchesNorm } from "./norms";

/**
 * Save a test result. The raw score comes from the client-side AI scoring engine;
 * percentile, band and scout-worthy flag are computed server-side against the
 * seeded benchmark norms for the athlete's age/gender/test type.
 */
export const record = mutation({
  args: {
    athleteId: v.id("athletes"),
    testType: testTypeValidator,
    rawScore: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const athlete = await ctx.db.get(args.athleteId);
    if (!athlete) throw new Error("Athlete not found");

    const norms = await ctx.db
      .query("benchmarkNorms")
      .withIndex("by_type_gender", (q) => q.eq("testType", args.testType).eq("gender", athlete.gender))
      .collect();
    const norm = norms.find((n) => matchesNorm(n, args.testType, athlete.gender, athlete.age));
    if (!norm) throw new Error(`No benchmark norms for ${args.testType}, ${athlete.gender}, age ${athlete.age}`);

    const { percentile, band } = computePercentile(args.testType, args.rawScore, norm);
    const isFlagged = band === "top_15";

    const userId = await getAuthUserId(ctx);
    const id = await ctx.db.insert("tests", {
      athleteId: args.athleteId,
      testType: args.testType,
      rawScore: Math.round(args.rawScore * 100) / 100,
      unit: UNIT_BY_TYPE[args.testType],
      percentile,
      band,
      isFlagged,
      recordedBy: userId ?? undefined,
      recordedAt: Date.now(),
      notes: args.notes,
    });
    return { testId: id, percentile, band, isFlagged };
  },
});

/** All tests for one athlete, newest first. */
export const listByAthlete = query({
  args: { athleteId: v.id("athletes") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("tests")
      .withIndex("by_athlete", (q) => q.eq("athleteId", args.athleteId))
      .collect();
    return rows.sort((a, b) => (b.recordedAt ?? 0) - (a.recordedAt ?? 0));
  },
});

/** All tests (scout/admin views). */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tests").collect();
  },
});

export const get = query({
  args: { id: v.id("tests") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

type TestRow = {
  _id: Id<"tests">;
  athleteId: Id<"athletes">;
  testType: string;
  rawScore: number;
  unit: string;
  percentile: number;
  band: string;
  isFlagged: boolean;
  recordedAt?: number;
};

/** Enriched test rows joined with athlete info (used by scout dashboard + leaderboard + analytics). */
export const listEnriched = query({
  args: {},
  handler: async (ctx) => {
    const tests = (await ctx.db.query("tests").collect()) as unknown as TestRow[];
    const athletes = await ctx.db.query("athletes").collect();
    const byId = new Map(athletes.map((a) => [a._id, a]));
    return tests
      .map((t) => {
        const a = byId.get(t.athleteId);
        return {
          _id: t._id,
          testType: t.testType,
          rawScore: t.rawScore,
          unit: t.unit,
          percentile: t.percentile,
          band: t.band,
          isFlagged: t.isFlagged,
          recordedAt: t.recordedAt,
          athleteId: t.athleteId,
          athleteName: a?.name ?? "Unknown",
          athleteAge: a?.age ?? 0,
          athleteGender: a?.gender ?? "male",
          region: a?.region ?? "Unknown",
          schoolName: a?.schoolName,
          sportInterest: a?.sportInterest,
        };
      })
      .sort((a, b) => (b.recordedAt ?? 0) - (a.recordedAt ?? 0));
  },
});
