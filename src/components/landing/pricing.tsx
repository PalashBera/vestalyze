import Link from "next/link";
import { CheckIcon, HouseIcon, SparklesIcon, WalletIcon } from "lucide-react";
import { SectionHeading } from "@/components/landing/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    icon: WalletIcon,
    name: "Personal",
    price: "Free",
    priceNote: "no card, no trial clock",
    description: "Everything Vestalyze does today, for your own book.",
    cta: { label: "Create a free account", href: "/register", variant: "secondary" as const },
    featuresLabel: "What's included",
    features: [
      "Unlimited holdings across India and the US",
      "Look-through for mutual funds and ETFs",
      "Company exposure with portfolio weight",
      "Fund-to-fund overlap scoring",
      "A private, row-level secured book",
    ],
    highlighted: false,
  },
  {
    id: "pro",
    icon: SparklesIcon,
    name: "Pro",
    price: "Coming soon",
    priceNote: "not billed today",
    description: "Reporting on top of the same look-through engine.",
    cta: { label: "Request early access", href: "#contact", variant: "default" as const },
    featuresLabel: "Everything in Personal, plus",
    features: [
      "CSV export of look-through exposure",
      "Scheduled holdings refresh",
      "Exposure history over time",
      "Concentration and drift alerts",
    ],
    highlighted: true,
  },
  {
    id: "household",
    icon: HouseIcon,
    name: "Household",
    price: "Coming soon",
    priceNote: "not billed today",
    description: "One combined view across more than one investor.",
    cta: { label: "Tell us what you need", href: "#contact", variant: "secondary" as const },
    featuresLabel: "Everything in Pro, plus",
    features: [
      "Shared household exposure view",
      "Per-member books kept separate",
      "Combined overlap across members",
      "Invite and revoke access",
    ],
    highlighted: false,
  },
];

export function LandingPricing() {
  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <SectionHeading
        eyebrow="Pricing"
        title="Plans and pricing"
        description="Vestalyze is a personal book, and the personal book is free. Paid tiers are on the roadmap, not on your card."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex h-full flex-col gap-6 rounded-2xl border p-6 transition-colors duration-300",
              plan.highlighted
                ? "border-foreground/25 bg-card shadow-xl shadow-foreground/10 lg:-my-3 lg:py-9"
                : "border-border/70 bg-card/40 hover:border-border hover:bg-card/70",
            )}
          >
            {plan.highlighted ? (
              <>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-32 rounded-t-2xl bg-linear-to-b from-foreground/8 to-transparent"
                />
                <span className="absolute top-6 right-6 rounded-full border border-border bg-background px-2.5 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase">
                  Most requested
                </span>
              </>
            ) : null}

            <div className="relative flex flex-col gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-background/60">
                <plan.icon className="size-4" aria-hidden />
              </span>
              <p className="text-sm font-medium">{plan.name}</p>
              <div className="flex flex-col gap-1">
                <p className="font-heading text-3xl tracking-tight">{plan.price}</p>
                <p className="text-xs text-muted-foreground">{plan.priceNote}</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
            </div>

            <Button
              size="lg"
              variant={plan.cta.variant}
              className="h-10 w-full rounded-xl text-sm"
              nativeButton={false}
              render={<Link href={plan.cta.href} />}
            >
              {plan.cta.label}
            </Button>

            <div className="flex flex-col gap-3 border-t pt-5">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{plan.featuresLabel}</p>
              <ul className="flex flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Coming-soon tiers have no price and no signup. Ask for what you need and it moves up the list.
      </p>
    </div>
  );
}
