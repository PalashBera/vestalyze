import { GlobeIcon, LayersIcon, ShieldIcon, TargetIcon } from "lucide-react";
import { LandingProductShowcase } from "@/components/landing/product-showcase";
import { SectionHeading } from "@/components/landing/section";

const stats = [
  {
    icon: GlobeIcon,
    value: "2",
    label: "Markets in one book",
    body: "India and the United States, each kept in its own currency until you ask for a total.",
  },
  {
    icon: LayersIcon,
    value: "3",
    label: "Instrument types",
    body: "Mutual funds, ETFs, and direct stocks sit in the same ledger.",
  },
  {
    icon: TargetIcon,
    value: "1",
    label: "Number per company",
    body: "Fund slices and direct lots collapse into a single exposure and weight.",
  },
  {
    icon: ShieldIcon,
    value: "0",
    label: "Rows shared between users",
    body: "Nested tables are filtered by your user id on every read and write.",
  },
];

export function LandingDeepDive() {
  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <SectionHeading
        eyebrow="The product"
        title={
          <>
            Deep dive into every company
            <br className="hidden sm:block" /> before it surprises you
          </>
        }
        description="A sample book you can read right now. Your own account starts empty — nothing here is preloaded for you."
      />

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 -top-8 bottom-16 -z-10 rounded-[3rem] bg-foreground/4 blur-3xl" />
        <LandingProductShowcase />
      </div>

      <dl className="grid gap-8 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2">
            <stat.icon className="size-4 text-muted-foreground" aria-hidden />
            <dt className="flex items-baseline gap-2">
              <span className="font-heading text-3xl tracking-tight tabular-nums">{stat.value}</span>
              <span className="text-sm font-medium">{stat.label}</span>
            </dt>
            <dd className="text-sm leading-relaxed text-muted-foreground">{stat.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
