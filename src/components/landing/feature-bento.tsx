import type { ReactNode } from "react";
import { ArrowDownIcon, LockIcon } from "lucide-react";
import { SectionHeading } from "@/components/landing/section";
import { cn } from "@/lib/utils";

function BentoCard({
  title,
  body,
  visual,
  className,
}: {
  title: string;
  body: string;
  visual: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40 transition-colors duration-300 hover:border-border hover:bg-card/70",
        className,
      )}
    >
      <div className="relative h-56 overflow-hidden border-b border-border/60 bg-muted/25 p-5">{visual}</div>
      <div className="flex flex-col gap-2 p-5">
        <h3 className="font-heading text-lg tracking-tight">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </article>
  );
}

function WeightBar({ value, max }: { value: number; max: number }) {
  return (
    <span className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
      <span className="block h-full rounded-full bg-foreground/40" style={{ width: `${(value / max) * 100}%` }} />
    </span>
  );
}

const unfolded = [
  { name: "HDFC Bank", weight: 8.4 },
  { name: "Reliance", weight: 6.1 },
  { name: "Infosys", weight: 4.8 },
  { name: "ICICI Bank", weight: 3.9 },
];

function LookThroughVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2">
        <span className="truncate text-xs font-medium">Parag Parikh Flexi Cap Direct</span>
        <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground">₹6,10,000</span>
      </div>
      <div className="flex items-center justify-center gap-2 text-[0.65rem] tracking-widest text-muted-foreground uppercase">
        <ArrowDownIcon className="size-3" aria-hidden />
        Look-through
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {unfolded.map((row) => (
          <li key={row.name} className="rounded-lg border border-border/60 bg-background/40 px-2.5 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[0.7rem]">{row.name}</span>
              <span className="font-mono text-[0.65rem] text-muted-foreground tabular-nums">{row.weight}%</span>
            </div>
            <div className="mt-1.5 flex">
              <WeightBar value={row.weight} max={8.4} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverlapVisual() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div className="relative flex items-center">
        <span className="size-28 rounded-full border border-foreground/25 bg-foreground/5" />
        <span className="-ml-12 size-28 rounded-full border border-foreground/25 bg-foreground/10" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-background/85 px-2.5 py-1 font-heading text-sm tracking-tight backdrop-blur">
            12.4%
          </span>
        </span>
      </div>
      <div className="flex items-center gap-4 text-[0.7rem] text-muted-foreground">
        <span>Flexi Cap</span>
        <span className="size-1 rounded-full bg-foreground/25" />
        <span>Invesco QQQ</span>
      </div>
    </div>
  );
}

const markets = [
  { label: "India", currency: "INR", amount: "₹7,20,000", share: 59.8 },
  { label: "United States", currency: "USD", amount: "$5,560", share: 40.2 },
];

function MarketsVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      {markets.map((market) => (
        <div key={market.label} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium">{market.label}</span>
            <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">{market.amount}</span>
          </div>
          <div className="flex items-center gap-2">
            <WeightBar value={market.share} max={100} />
            <span className="w-10 shrink-0 text-right font-mono text-[0.65rem] text-muted-foreground tabular-nums">
              {market.share}%
            </span>
          </div>
          <span className="text-[0.65rem] text-muted-foreground">Held and reported in {market.currency}</span>
        </div>
      ))}
    </div>
  );
}

const scoped = ["securities", "funds", "fund_holdings", "investments"];

function PrivacyVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      {scoped.map((table) => (
        <div
          key={table}
          className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/50 px-3 py-2"
        >
          <span className="flex items-center gap-2 font-mono text-[0.7rem]">
            <LockIcon className="size-3 text-muted-foreground" aria-hidden />
            {table}
          </span>
          <span className="font-mono text-[0.65rem] text-muted-foreground">user_id = auth.uid()</span>
        </div>
      ))}
      <div
        aria-hidden
        className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border/60 px-3 py-2 opacity-45 blur-[2px] select-none"
      >
        <span className="font-mono text-[0.7rem]">another account</span>
        <span className="font-mono text-[0.65rem]">no rows returned</span>
      </div>
    </div>
  );
}

export function LandingFeatureBento() {
  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <SectionHeading
        eyebrow="Features"
        title="Supercharge how you read your portfolio"
        description="Four views that turn a list of products into a list of the companies you actually own."
      />
      <div className="grid gap-4 md:grid-cols-5">
        <BentoCard
          className="md:col-span-3"
          visual={<LookThroughVisual />}
          title="Every fund, unfolded"
          body="Paste a public fund URL and sync. Vestalyze reads the holdings table and weights each company by what you invested, so exposure stops hiding behind a product name."
        />
        <BentoCard
          className="md:col-span-2"
          visual={<OverlapVisual />}
          title="Overlap you can see"
          body="Compare any two funds and get a single overlap score, plus the shared names driving it."
        />
        <BentoCard
          className="md:col-span-2"
          visual={<MarketsVisual />}
          title="India and the US, side by side"
          body="INR stays INR and USD stays USD. Conversion happens only when you ask for one reporting number."
        />
        <BentoCard
          className="md:col-span-3"
          visual={<PrivacyVisual />}
          title="Private by construction, not by promise"
          body="Securities, funds, holdings, and investments are all scoped to your user id with row-level security in Postgres. Another signed-in account queries the same tables and gets nothing back."
        />
      </div>
    </div>
  );
}
