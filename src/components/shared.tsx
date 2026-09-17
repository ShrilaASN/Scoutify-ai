import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  tone = "default",
  className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: string;
  trend?: number;
  tone?: "default" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "tl-card-lift rounded-2xl border border-border/70 p-5",
        tone === "dark" ? "bg-secondary text-white" : "bg-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            tone === "dark" ? "bg-white/10 text-white" : "bg-primary/10 text-primary",
          )}
        >
          {icon}
        </div>
        {typeof trend === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend >= 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600",
            )}
          >
            {trend >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="font-display text-3xl font-bold tracking-tight">{value}</div>
        <div className={cn("mt-0.5 text-sm", tone === "dark" ? "text-white/70" : "text-muted-foreground")}>{label}</div>
        {sub && (
          <div className={cn("mt-1 text-xs", tone === "dark" ? "text-white/50" : "text-muted-foreground/80")}>{sub}</div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <p className="mt-4 font-display text-base font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Radial percentile gauge used on the results screen (0-100, higher is better). */
export function PercentileGauge({
  value,
  color = "#00C853",
  size = 190,
}: {
  value: number;
  color?: string;
  size?: number;
}) {
  const data = [{ name: "percentile", value, fill: color }];
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={220} endAngle={-40} barSize={14}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={999} background={{ fill: "var(--muted)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="font-display text-4xl font-bold tracking-tight">{Math.round(value)}</div>
          <div className="text-xs text-muted-foreground">percentile</div>
        </div>
      </div>
    </div>
  );
}
