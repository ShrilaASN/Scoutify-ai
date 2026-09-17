import { motion } from "framer-motion";
import { Activity, Camera, Gauge, LineChart, Lock, Radar, ScanLine, Sparkles, Upload, Users, WifiOff } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HOW_IT_WORKS = [
  {
    icon: <Camera className="size-5" />,
    step: "01",
    title: "Record a few simple tests",
    description:
      "Point a phone at the athlete. No stopwatches, jump mats, or clipboards — the capture takes a school lunch break, not a weekend.",
  },
  {
    icon: <ScanLine className="size-5" />,
    step: "02",
    title: "Get a fair performance signal",
    description:
      "Computer vision scores every attempt the same way, then benchmarks it against age and gender norms. No shaky stopwatch, no favouritism — just signal.",
  },
  {
    icon: <Radar className="size-5" />,
    step: "03",
    title: "Put overlooked athletes on the map",
    description:
      "Top-percentile performances are flagged and appear on scouts' desks across regions — talent that postal-code lotteries used to hide.",
  },
];

const AUDIENCES = [
  {
    to: "/auth?mode=coach",
    icon: <Users className="size-5" />,
    title: "For coaches and PE teachers",
    description:
      "Run standardized fitness assessments with nothing but a phone. Track every athlete's progress with evidence behind it.",
    cta: "Open your scouting desk",
  },
  {
    to: "/auth?mode=athlete",
    icon: <LineChart className="size-5" />,
    title: "For athletes and families",
    description:
      "See exactly where your performance stands — percentile by percentile — and watch it climb across every retest.",
    cta: "See your progress",
  },
  {
    to: "/auth?mode=scout",
    icon: <Radar className="size-5" />,
    title: "For scouts and academy recruiters",
    description:
      "Search a live, benchmarked talent pool by region, age, sport, and percentile band. Spend your travel budget on the right grounds.",
    cta: "Enter the scout desk",
  },
];

const FEATURES = [
  {
    icon: <ScanLine className="size-4" />,
    title: "Vision that runs on the device",
    text: "Pose estimation executes entirely in the browser. Low-end phones work; there is no server to trust with footage.",
  },
  {
    icon: <Gauge className="size-4" />,
    title: "Benchmarks, not gut feel",
    text: "Every score is measured against age- and gender-specific norms modeled on national fitness standards.",
  },
  {
    icon: <Upload className="size-4" />,
    title: "Upload or record",
    text: "Capture live, or upload footage shot anywhere and let the engine analyze it after the fact.",
  },
  {
    icon: <WifiOff className="size-4" />,
    title: "Built for weak connections",
    text: "Designed offline-first for rural schools — record on the ground, review whenever signal returns.",
  },
  {
    icon: <LineChart className="size-4" />,
    title: "Longitudinal evidence",
    text: "Trend lines per test type show improvement over months, so progress is documented rather than remembered.",
  },
  {
    icon: <Lock className="size-4" />,
    title: "Consent and privacy first",
    text: "Footage is processed on the spot. Profiles hold results and reference links, never a public video gallery.",
  },
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
              Scoutify<span className="tl-gradient-text"> AI</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/leaderboard">Leaderboard</Link>
            </Button>
            <Button asChild className="rounded-full shadow-md shadow-primary/25">
              <Link to="/auth">Request access</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="tl-gradient-hero relative overflow-hidden">
        <div className="tl-grid-bg absolute inset-0 opacity-70" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <Badge className="mb-6 gap-1.5 rounded-full border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur">
              <Sparkles className="size-3.5" />
              Computer-vision scouting for the next generation of champions
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-6xl">
              Every coach deserves a{" "}
              <span className="tl-gradient-text">scouting desk</span> that fits in a pocket
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Scoutify AI turns a routine phone camera into a credible scouting instrument. Record a few
              simple fitness tests, receive a fair, benchmarked performance signal within seconds, and
              make sure the athletes who deserve attention are the ones who get it.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-white text-secondary shadow-xl shadow-black/20 hover:bg-white/90">
                <Link to="/auth?mode=coach">Open your scouting desk</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/leaderboard">Browse the live leaderboard</Link>
              </Button>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <div>
                <p className="font-display text-2xl font-bold text-white">4 tests</p>
                <p className="mt-0.5 text-xs text-white/60">Jump, sprint, sit-ups, shuttle</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">&lt; 60s</p>
                <p className="mt-0.5 text-xs text-white/60">From recording to scored</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">100%</p>
                <p className="mt-0.5 text-xs text-white/60">On-device processing</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            A scouting pipeline in three disciplined steps
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            The same protocol for every athlete, every ground, every region — which is exactly what makes
            the comparison fair.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="tl-card-lift rounded-2xl border border-border/70 bg-card p-7"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary/10 text-secondary">{item.icon}</span>
                <span className="font-display text-4xl font-bold text-muted-foreground/15">{item.step}</span>
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Audience CTAs */}
      <section className="border-y border-border/70 bg-muted/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight">Built for the people who find talent</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            One platform, three disciplined views — coaches run assessments, athletes own their progress,
            scouts work from evidence instead of rumor.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {AUDIENCES.map((role, i) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link to={role.to} className="tl-card-lift group block h-full rounded-2xl border border-border/70 bg-card p-7">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">{role.icon}</span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{role.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {role.cta}
                    <Sparkles className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Why Scoutify</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Serious tooling for a problem worth solving seriously
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Grassroots assessment has been manual, inconsistent, and easy to game. Scoutify replaces it
              with one repeatable protocol: standardized capture, automated measurement, transparent
              benchmarks — so ability is found while the training window is still open.
            </p>
            <Button asChild className="mt-7 rounded-full shadow-md shadow-primary/25">
              <Link to="/auth">Request access</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="rounded-2xl border border-border/70 bg-card p-5"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-secondary/10 text-secondary">{f.icon}</span>
                <h3 className="mt-3.5 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="tl-gradient-hero relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12">
          <div className="tl-grid-bg absolute inset-0 opacity-50" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Somewhere today, a champion is training where nobody is watching
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              Open a demo desk with a full region of athlete data, or request access and run your first
              assessed session this week.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-white text-secondary shadow-xl shadow-black/20 hover:bg-white/90">
                <Link to="/auth">Request access</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/leaderboard">View the leaderboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-secondary text-white">
              <Activity className="size-3.5" />
            </span>
            <span className="font-medium text-foreground">Scoutify AI</span>
            <span>— the pocket scouting desk</span>
          </div>
          <span>Fair signals for overlooked athletes</span>
        </div>
      </footer>
    </div>
  );
}
