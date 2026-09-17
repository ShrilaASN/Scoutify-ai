export type TestType = "vertical_jump" | "sprint_40m" | "situps_30s" | "shuttle_run";

export const TEST_TYPES: TestType[] = ["vertical_jump", "sprint_40m", "situps_30s", "shuttle_run"];

export const TEST_META: Record<
  TestType,
  { label: string; short: string; unit: string; icon: "arrow-up" | "timer" | "repeat" | "move"; hint: string }
> = {
  vertical_jump: {
    label: "Vertical Jump",
    short: "Jump",
    unit: "cm",
    icon: "arrow-up",
    hint: "Stand side-on to the camera, jump as high as possible.",
  },
  sprint_40m: {
    label: "Sprint (40m)",
    short: "Sprint",
    unit: "s",
    icon: "timer",
    hint: "Run the marked 40m lane — timing starts when you move.",
  },
  situps_30s: {
    label: "Sit-ups (30s)",
    short: "Sit-ups",
    unit: "reps",
    icon: "repeat",
    hint: "Face the camera lying down; count as many sit-ups in 30 seconds.",
  },
  shuttle_run: {
    label: "Shuttle Run (4x10m)",
    short: "Shuttle",
    unit: "s",
    icon: "move",
    hint: "Sprint between the two lines as fast as possible.",
  },
};

/** Lower raw score is better for these test types. */
export const LOWER_IS_BETTER: Record<TestType, boolean> = {
  vertical_jump: false,
  sprint_40m: true,
  situps_30s: false,
  shuttle_run: true,
};

export type AppRole = "coach" | "athlete" | "scout";

export const REGIONS = [
  "Nashik Rural",
  "Jaipur Tier-2",
  "Bhubaneswar Block",
  "Coimbatore District",
  "Guwahati Zone",
] as const;

export const SPORTS = [
  "Athletics",
  "Football",
  "Kabaddi",
  "Hockey",
  "Wrestling",
  "Boxing",
  "Badminton",
  "Kho-Kho",
] as const;

export const DEMO_ACCOUNTS = [
  { role: "coach" as AppRole, email: "coach@demo.com" },
  { role: "athlete" as AppRole, email: "athlete@demo.com" },
  { role: "scout" as AppRole, email: "scout@demo.com" },
];

export const ROLE_HOME: Record<AppRole, string> = {
  coach: "/coach/dashboard",
  athlete: "/athlete/dashboard",
  scout: "/scout/dashboard",
};
