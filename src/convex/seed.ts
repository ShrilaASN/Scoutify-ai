import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Gender, TestType } from "./schema";
import { UNIT_BY_TYPE, computePercentile, type NormRow } from "./norms";

// Deterministic PRNG so seeded data is stable across runs.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller normal sample.
function gauss(rand: () => number, mean: number, sd: number) {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const REGIONS = ["Nashik Rural", "Jaipur Tier-2", "Bhubaneswar Block", "Coimbatore District", "Guwahati Zone"];
const SCHOOLS: Record<string, string[]> = {
  "Nashik Rural": ["Zilla Parishad Vidyalaya", "Killa Adarsh School"],
  "Jaipur Tier-2": ["Govt Sr Sec School, Sanganer", "Rajkiya Balika Vidyalaya"],
  "Bhubaneswar Block": ["Sarang Nodal High School", "Block UP School"],
  "Coimbatore District": ["Panchayat Union School", "GHSS Pollachi"],
  "Guwahati Zone": ["Ambari Govt High School", "Chandmari MV School"],
};
const SPORTS = ["Athletics", "Football", "Kabaddi", "Hockey", "Wrestling", "Boxing", "Badminton", "Kho-Kho"];
const FIRST_M = ["Arjun", "Rohan", "Vikram", "Imran", "Karthik", "Suresh", "Deepak", "Manoj", "Rahul", "Praveen", "Sanjay", "Ankit"];
const FIRST_F = ["Priya", "Anita", "Meena", "Kavita", "Divya", "Ritu", "Sneha", "Pooja", "Lakshmi", "Nandini", "Sapna", "Aarti"];
const LAST = ["Patil", "Sharma", "Das", "Kumar", "Reddy", "Naik", "Bora", "Singh", "Rao", "Pillai", "Mahato", "Chauhan"];

// Seeded Khelo India-style norms: percentile cutoffs per test/gender/age band.
// c15 = 15th-percentile cutoff (scout-worthy), c30 = 30th, c50 = median.
function normRows(): NormRow[] {
  const rows: NormRow[] = [];
  const defs: Record<TestType, { bands: [number, number][]; male: [number, number, number][]; female: [number, number, number][] }> = {
    vertical_jump: {
      bands: [[12, 14], [15, 16], [17, 19]],
      male: [
        [38, 32, 25],
        [44, 37, 29],
        [50, 42, 33],
      ],
      female: [
        [32, 27, 21],
        [38, 31, 25],
        [43, 36, 28],
      ],
    },
    sprint_40m: {
      bands: [[12, 14], [15, 16], [17, 19]],
      male: [
        [5.9, 6.4, 7.1],
        [5.5, 6.0, 6.7],
        [5.1, 5.6, 6.3],
      ],
      female: [
        [6.4, 6.9, 7.6],
        [6.0, 6.5, 7.2],
        [5.7, 6.2, 6.9],
      ],
    },
    situps_30s: {
      bands: [[12, 14], [15, 16], [17, 19]],
      male: [
        [25, 21, 16],
        [28, 24, 18],
        [31, 27, 20],
      ],
      female: [
        [22, 18, 14],
        [25, 21, 16],
        [28, 23, 18],
      ],
    },
    shuttle_run: {
      bands: [[12, 14], [15, 16], [17, 19]],
      male: [
        [9.6, 10.2, 11.0],
        [9.1, 9.7, 10.5],
        [8.6, 9.2, 10.0],
      ],
      female: [
        [10.3, 10.9, 11.7],
        [9.8, 10.4, 11.2],
        [9.4, 10.0, 10.8],
      ],
    },
  };
  (Object.keys(defs) as TestType[]).forEach((testType) => {
    const def = defs[testType];
    ([["male", def.male], ["female", def.female]] as [Gender, [number, number, number][]][]).forEach(
      ([gender, cutoffs]) => {
        def.bands.forEach(([ageMin, ageMax], i) => {
          const [c15, c30, c50] = cutoffs[i];
          rows.push({
            testType,
            gender,
            ageMin,
            ageMax,
            percentile15Cutoff: c15,
            percentile30Cutoff: c30,
            percentile50Cutoff: c50,
          });
        });
      },
    );
  });
  return rows;
}

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("athletes").first();
    if (existing) return { seeded: false, message: "Already seeded" };

    // 1) Benchmark norms
    for (const row of normRows()) {
      await ctx.db.insert("benchmarkNorms", row);
    }

    // 2) Demo accounts (coach / athlete / scout) for the judge quick-start
    const users = {
      coach: await ctx.db.insert("users", {
        name: "Coach Meera",
        email: "coach@demo.com",
        isAnonymous: false,
        appRole: "coach",
      }),
      athlete: await ctx.db.insert("users", {
        name: "Arjun Patil",
        email: "athlete@demo.com",
        isAnonymous: false,
        appRole: "athlete",
      }),
      scout: await ctx.db.insert("users", {
        name: "SAI Scout Vikram",
        email: "scout@demo.com",
        isAnonymous: false,
        appRole: "scout",
      }),
    };

    // 3) 30 mock athletes across 5 regions
    const rand = mulberry32(20260917);
    const athleteIds: { id: string; age: number; gender: Gender }[] = [];
    for (let i = 0; i < 30; i++) {
      const region = REGIONS[i % REGIONS.length];
      const gender: Gender = i % 2 === 0 ? "male" : "female";
      const age = 12 + Math.floor(rand() * 8); // 12-19
      const first = gender === "male" ? FIRST_M[Math.floor(rand() * FIRST_M.length)] : FIRST_F[Math.floor(rand() * FIRST_F.length)];
      const last = LAST[Math.floor(rand() * LAST.length)];
      const school = SCHOOLS[region][Math.floor(rand() * 2)];
      const id = await ctx.db.insert("athletes", {
        name: `${first} ${last}`,
        age,
        gender,
        schoolName: school,
        region,
        sportInterest: SPORTS[Math.floor(rand() * SPORTS.length)],
        heightCm: Math.round(gender === "male" ? gauss(rand, 158 + (age - 12) * 4, 8) : gauss(rand, 150 + (age - 12) * 3.6, 7)),
        coachId: users.coach,
        createdAt: Date.now() - Math.floor(rand() * 90) * 86400000,
      });
      athleteIds.push({ id, age, gender });
    }

    // Link the athlete demo account to Arjun Patil (first athlete, age 15, male)
    const arjun = athleteIds[0];
    const arjunDoc = await ctx.db.get(arjun.id as never);
    if (arjunDoc) {
      await ctx.db.patch(arjun.id as never, { name: "Arjun Patil", age: 15, gender: "male", userId: users.athlete });
      arjun.age = 15;
      arjun.gender = "male";
    }

    // 4) ~84 mock test records with realistic score distributions
    const MEANS: Record<TestType, { male: [number, number, number]; female: [number, number, number] }> = {
      // [12-14, 15-16, 17-19] group means around the median
      vertical_jump: { male: [26, 30, 34], female: [22, 26, 29] },
      sprint_40m: { male: [7.0, 6.6, 6.2], female: [7.5, 7.1, 6.8] },
      situps_30s: { male: [17, 19, 21], female: [15, 17, 19] },
      shuttle_run: { male: [10.9, 10.4, 9.9], female: [11.6, 11.1, 10.7] },
    };
    const SD: Record<TestType, number> = { vertical_jump: 5, sprint_40m: 0.45, situps_30s: 3.5, shuttle_run: 0.5 };
    const LOWER_IS_BETTER: Record<TestType, boolean> = {
      vertical_jump: false,
      sprint_40m: true,
      situps_30s: false,
      shuttle_run: true,
    };
    const norms = await ctx.db.query("benchmarkNorms").collect();

    let count = 0;
    for (const athlete of athleteIds) {
      // 2-4 tests per athlete across test types
      const nTests = 2 + Math.floor(rand() * 3);
      const types: TestType[] = ["vertical_jump", "sprint_40m", "situps_30s", "shuttle_run"];
      for (let t = 0; t < nTests; t++) {
        const testType = types[Math.floor(rand() * types.length)];
        const gi = athlete.age <= 14 ? 0 : athlete.age <= 16 ? 1 : 2;
        const mean = MEANS[testType][athlete.gender][gi];
        const raw = Math.max(1, gauss(rand, mean, SD[testType]));
        const norm = norms.find(
          (n) =>
            n.testType === testType &&
            n.gender === athlete.gender &&
            athlete.age >= n.ageMin &&
            athlete.age <= n.ageMax,
        );
        if (!norm) continue;
        const { percentile, band } = computePercentile(testType, raw, norm);
        const lower = LOWER_IS_BETTER[testType];
        await ctx.db.insert("tests", {
          athleteId: athlete.id as never,
          testType,
          rawScore: Math.round(raw * 10) / 10,
          unit: UNIT_BY_TYPE[testType],
          percentile,
          band,
          isFlagged: band === "top_15",
          recordedBy: users.coach,
          recordedAt: Date.now() - Math.floor(rand() * 120) * 86400000,
        });
        count++;
        void lower;
      }
    }

    return { seeded: true, athletes: athleteIds.length, tests: count };
  },
});

export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    for (const t of await ctx.db.query("tests").collect()) await ctx.db.delete(t._id);
    for (const a of await ctx.db.query("athletes").collect()) await ctx.db.delete(a._id);
    for (const n of await ctx.db.query("benchmarkNorms").collect()) await ctx.db.delete(n._id);
    for (const u of await ctx.db.query("users").collect()) await ctx.db.delete(u._id);
    return { reset: true };
  },
});
