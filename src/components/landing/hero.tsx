import Link from "next/link";
import { ArrowRightIcon, LockIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { AppWindow } from "@/components/landing/section";
import { Button } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_TAGLINE } from "@/lib/brand";

const heroStats = [
  { label: "Total invested", value: "₹12,05,000" },
  { label: "India", value: "59.8%" },
  { label: "United States", value: "40.2%" },
];

const heroExposure = [
  { name: "HDFC Bank", weight: 18.4 },
  { name: "Apple", weight: 17.0 },
  { name: "Reliance Industries", weight: 13.9 },
  { name: "Microsoft", weight: 9.4 },
  { name: "NVIDIA", weight: 8.6 },
];

const trust = [
  {
    icon: ShieldCheckIcon,
    title: "Scoped to your login",
    body: "Row-level security on every table",
  },
  {
    icon: LockIcon,
    title: "Nothing preloaded",
    body: "Your book starts empty by design",
  },
];

function HeroPreview() {
  return (
    <AppWindow label="vestalyze.app/exposure" bodyClassName="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {heroStats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
            <p className="truncate text-[0.7rem] text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-heading text-sm tracking-tight tabular-nums md:text-base">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/60 bg-background/50 p-3 md:p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium">Look-through company exposure</p>
          <p className="text-[0.7rem] text-muted-foreground">Portfolio weight</p>
        </div>
        <ul className="mt-3 flex flex-col gap-2.5">
          {heroExposure.map((row) => (
            <li key={row.name} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="truncate text-xs">{row.name}</span>
                <span className="h-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-foreground/45"
                    style={{ width: `${(row.weight / 18.4) * 100}%` }}
                  />
                </span>
              </div>
              <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                {row.weight.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[0.7rem] text-muted-foreground">
        Rolled up from 6 holdings across 2 markets · illustrative numbers
      </p>
    </AppWindow>
  );
}

export function LandingHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 grid-backdrop radial-fade opacity-60" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[42rem] -translate-x-1/2 rounded-full bg-foreground/8 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-8 sm:px-6 md:px-10 md:pt-20 md:pb-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-14">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 py-1 pr-3.5 pl-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[0.65rem] font-medium text-background">
              <SparklesIcon className="size-3" aria-hidden />
              Free
            </span>
            Personal look-through investing
          </span>

          <h1 className="font-heading text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-[3.5rem]">
            {APP_TAGLINE}
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-pretty text-muted-foreground md:text-lg">
            {APP_DESCRIPTION}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="h-11 w-full rounded-xl px-6 text-sm sm:w-auto"
              nativeButton={false}
              render={<Link href="/register" />}
            >
              Start your portfolio
              <ArrowRightIcon className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-11 w-full rounded-xl border-border px-5 text-sm sm:w-auto sm:border-transparent"
              nativeButton={false}
              render={<Link href="#product" />}
            >
              See a sample book
            </Button>
          </div>

          <dl className="mt-2 grid gap-5 sm:grid-cols-2">
            {trust.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card/60">
                  <item.icon className="size-4" aria-hidden />
                </span>
                <div>
                  <dt className="text-sm font-medium">{item.title}</dt>
                  <dd className="text-xs text-muted-foreground">{item.body}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-foreground/5 blur-2xl" />
          <div className="transition-transform duration-700 ease-out lg:[transform:perspective(1800px)_rotateY(-7deg)_rotateX(2deg)] lg:hover:[transform:perspective(1800px)_rotateY(0deg)_rotateX(0deg)] motion-reduce:transition-none">
            <HeroPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
