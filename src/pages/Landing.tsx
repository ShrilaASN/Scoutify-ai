import { motion } from "framer-motion";
import { Activity, Camera, Gauge, Radar, ScanLine, Sparkles, Trophy, Users, WifiOff } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HOW_IT_WORKS = [
  {
    icon: <Camera className="size-5" />,
    step: "01",
    title: "Record",
    description: "Any PE teacher opens the camera on a basic smartphone — no wearables, no stopwatches, no jump mats.",
  },
  {
    icon: <ScanLine className="size-5" />,
    step: "02",
    title: "AI Scores",
    description: "On-device pose AI tracks the athlete's skeleton, counts reps and measures jumps or sprints in seconds.",
  },
  {
    icon: <Radar className="size-5" />,
    step: "03",
    title: "Get Scouted",
    description: "Scores are benchmarked against national norms — top performers are flagged straight to the scout dashboard.",
  },
];

const ROLES = [
  {
    to: "/auth?mode=coach",
    icon: <Users className="size-5" />,
    title: "I'm a Coach / Teacher",
    description: "Register athletes, run standardized fitness tests and track progress across your school.",
    cta: "Open coach dashboard",
  },
  {
    to: "/auth?mode=athlete",
    icon: <Activity className="size-5" />,
    title: "I'm an Athlete",
    description: "See your scores, percentile bands and improvement over time against your region.",
    cta: "View my progress",
  },
  {
    to: "/auth?mode=scout",
    icon: <Radar className="size-5" />,
    title: "I'm a Scout",
    description: "Search flagged talent by region, age, sport and percentile band across every registered school.",
    cta: "Open scout dashboard",
  },
];

const FEATURES = [
  { icon: <ScanLine className="size-4" />, title: "Pose AI, in-browser", text: "MediaPipe pose estimation runs fully on-device — works on low-end phones, no server GPU." },
  { icon: <Gauge className="size-4" />, title: "Instant benchmarking", text: "Age/gender percentile cutoffs modeled on Khelo India norms, computed the moment a test ends." },
  { icon: <Trophy className="size-4" />, title: "Scout-worthy flags", text: "Top-15% performances raise an automatic flag for academy recruiters." },
  { icon: <WifiOff className="size-4" />, title: "Built for low connectivity", text: "Designed offline-first for rural schools — record now, sync whenever you get signal." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-secondary text-white shadow-sm">
              <Activity className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Talent<span className="text-primary">Lens</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/leaderboard">Leaderboard</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="tl-gradient-hero relative overflow-hidden">
        <div className="tl-grid-bg absolute inset-0 opacity-60" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
            <Badge className="mb-5 gap-1.5 rounded-full border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Sparkles className="size-3.5" />
              AI sports talent identification for rural & Tier-2 India
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">
              Every smartphone is now a{" "}
              <span className="bg-gradient-to-r from-orange-300 to-amber-200 bg-clip-text text-transparent">scouting combine</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              TalentLens turns a phone camera into an AI-powered fitness assessor. Record a jump, sprint or
              sit-up test — get instant, benchmarked results and surface scout-worthy athletes that
              stopwatches and paper registers keep missing.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-white text-secondary hover:bg-white/90">
                <Link to="/auth?mode=coach">Start assessing free</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/auth?mode=scout">I scout talent</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/70">
              <span className="inline-flex items-center gap-2"><Camera className="size-4" /> Works on any phone</span>
              <span className="inline-flex items-center gap-2"><ScanLine className="size-4" /> On-device AI</span>
              <span className="inline-flex items-center gap-2"><Gauge className="size-4" /> Results in seconds</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            From playground to national scouting list — in three steps
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="tl-card-lift rounded-2xl border border-border/70 bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">{item.icon}</span>
                <span className="font-display text-4xl font-bold text-muted-foreground/20">{item.step}</span>
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Role CTAs */}
      <section className="border-y border-border/70 bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight">Pick your role</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            One platform, three views — coaches run the tests, athletes own their progress, scouts find the next champion.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {ROLES.map((role, i) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link
                  to={role.to}
                  className="tl-card-lift group block rounded-2xl border border-border/70 bg-card p-6 h-full"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-secondary/10 text-secondary">{role.icon}</span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{role.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {role.cta}
                    <Sparkles className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Why TalentLens</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Standardized testing that finally scales beyond the cities
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              Grassroots fitness assessment today is manual, inconsistent and paper-based. TalentLens replaces
              it with one repeatable flow: standardized capture, automated scoring, and transparent national
              benchmarks — so talent is found while the training window is still open.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/auth">Try the demo</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="rounded-2xl border border-border/70 bg-card p-5"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">{f.icon}</span>
                <h3 className="mt-3.5 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="tl-gradient-hero relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
          <div className="tl-grid-bg absolute inset-0 opacity-40" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              The next champion is training in a village ground right now
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
              Sign in with a demo account and run your first AI-scored fitness test in under two minutes.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-white text-secondary hover:bg-white/90">
              <Link to="/auth">Open TalentLens</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-secondary text-white">
              <Activity className="size-3.5" />
            </span>
            TalentLens — AI sports talent identification
          </div>
          <span>Built for rural & Tier-2 India · Demo data included</span>
        </div>
      </footer>
    </div>
  );
}
