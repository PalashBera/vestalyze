import {
  ArrowLeftRightIcon,
  ChartPieIcon,
  CopyIcon,
  EyeIcon,
  LayersIcon,
  RefreshCwIcon,
  TrendingUpIcon,
} from "lucide-react";

const coverage = [
  { icon: LayersIcon, label: "Indian mutual funds" },
  { icon: ChartPieIcon, label: "Indian ETFs" },
  { icon: ChartPieIcon, label: "US ETFs" },
  { icon: TrendingUpIcon, label: "US stocks" },
  { icon: ArrowLeftRightIcon, label: "INR and USD" },
  { icon: RefreshCwIcon, label: "Fund URL sync" },
  { icon: EyeIcon, label: "Holdings look-through" },
  { icon: CopyIcon, label: "Overlap scoring" },
];

export function LandingCoverageStrip() {
  return (
    <section className="reveal relative isolate overflow-hidden rounded-3xl border border-border/70 bg-card/30 px-6 py-12 md:px-10 md:py-14">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-[32rem] -translate-x-1/2 rounded-full bg-foreground/6 blur-3xl"
      />

      <div className="flex flex-col items-center gap-8">
        <p className="max-w-2xl text-center font-heading text-xl leading-snug tracking-tight text-balance md:text-2xl">
          One private book for everything you already hold
          <span className="text-muted-foreground"> — across two markets and two kinds of instrument.</span>
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
          {coverage.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium text-foreground/80 transition-colors duration-300 hover:border-foreground/25 hover:bg-background hover:text-foreground"
            >
              <item.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
