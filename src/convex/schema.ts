import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const testTypeValidator = v.union(
  v.literal("vertical_jump"),
  v.literal("sprint_40m"),
  v.literal("situps_30s"),
  v.literal("shuttle_run"),
);
export type TestType = Infer<typeof testTypeValidator>;

export const genderValidator = v.union(v.literal("male"), v.literal("female"));
export type Gender = Infer<typeof genderValidator>;

export const bandValidator = v.union(
  v.literal("top_15"),
  v.literal("top_30"),
  v.literal("average"),
  v.literal("below_average"),
);
export type Band = Infer<typeof bandValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove

      // TalentLens role (app-level): coach | athlete | scout
      appRole: v.optional(v.union(v.literal("coach"), v.literal("athlete"), v.literal("scout"))),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // add other tables here

    // Athlete profiles registered by coaches (or linked to an athlete user account)
    athletes: defineTable({
      name: v.string(),
      age: v.number(),
      gender: genderValidator,
      schoolName: v.optional(v.string()),
      region: v.string(),
      sportInterest: v.optional(v.string()),
      photoUrl: v.optional(v.string()),
      heightCm: v.optional(v.number()),
      coachId: v.optional(v.id("users")),
      userId: v.optional(v.id("users")),
      createdAt: v.optional(v.number()),
    })
      .index("by_coach", ["coachId"])
      .index("by_user", ["userId"])
      .index("by_region", ["region"]),

    // One record per conducted fitness test with computed benchmarking
    tests: defineTable({
      athleteId: v.id("athletes"),
      testType: testTypeValidator,
      rawScore: v.number(),
      unit: v.string(),
      percentile: v.number(),
      band: bandValidator,
      isFlagged: v.boolean(),
      recordedBy: v.optional(v.id("users")),
      recordedAt: v.optional(v.number()),
      notes: v.optional(v.string()),
    })
      .index("by_athlete", ["athleteId"])
      .index("by_type_recorded", ["testType", "recordedAt"]),

    // Age/gender percentile cutoffs per test type (Khelo India-style seeded norms)
    benchmarkNorms: defineTable({
      testType: testTypeValidator,
      gender: genderValidator,
      ageMin: v.number(),
      ageMax: v.number(),
      percentile15Cutoff: v.number(),
      percentile30Cutoff: v.number(),
      percentile50Cutoff: v.number(),
    }).index("by_type_gender", ["testType", "gender"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
