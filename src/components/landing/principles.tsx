import { EyeIcon, QuoteIcon, ShieldCheckIcon, SplitIcon } from "lucide-react";
import { SectionHeading } from "@/components/landing/section";
import { APP_NAME, APP_SHORT_NAME } from "@/lib/brand";

const principles = [
  {
    icon: EyeIcon,
    title: "Holdings over labels",
    body: "A fund is judged by the companies inside it, not by the category on the factsheet.",
  },
  {
    icon: SplitIcon,
    title: "One weight per company",
    body: "Fund slices and direct lots are the same exposure, so they are added, not listed twice.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Your numbers stay yours",
    body: "No shared tables, no preloaded portfolios, no sample data written into your account.",
  },
];

export function LandingPrinciples() {
  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <SectionHeading
        eyebrow="Why we built it"
        title="Most portfolios own the same ten companies twice"
        description="Vestalyze started from one uncomfortable spreadsheet. These are the principles that came out of it."
      />

      <figure className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 md:p-10">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-foreground/5 blur-3xl"
        />
        <div className="relative flex items-start justify-between gap-6">
          <span className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-background font-heading text-sm">
            {APP_SHORT_NAME}
          </span>
          <QuoteIcon className="size-8 shrink-0 text-foreground/10" aria-hidden />
        </div>
        <blockquote className="relative mt-6 max-w-3xl font-heading text-xl leading-snug tracking-tight text-balance md:text-2xl">
          “A flexi cap fund, a Nifty ETF, and a handful of direct stocks feel like diversification. Line up
          what each one actually holds and the same four or five names keep coming back. That concentration
          is easy to fix — once you can see it.”
        </blockquote>
        <figcaption className="relative mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">The {APP_NAME} team</p>
            <p className="text-xs text-muted-foreground">Product principle, not a customer testimonial</p>
          </div>
        </figcaption>
      </figure>

      <div className="grid gap-4 md:grid-cols-3">
        {principles.map((item) => (
          <article
            key={item.title}
            className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/40 p-5 transition-colors duration-300 hover:border-border hover:bg-card/70"
          >
            <span className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-background/60">
              <item.icon className="size-4" aria-hidden />
            </span>
            <h3 className="font-heading text-base tracking-tight">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
