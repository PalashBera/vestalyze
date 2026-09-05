import Link from "next/link";
import {
  EyeIcon,
  GlobeIcon,
  LayersIcon,
  LockIcon,
  TableIcon,
  WalletIcon,
} from "lucide-react";
import { BrandLockup } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/brand";

const features = [
  {
    icon: EyeIcon,
    title: "Look through every fund",
    body: "Mutual funds and ETFs unfold into the companies underneath, so overlap stops hiding in the product name.",
  },
  {
    icon: GlobeIcon,
    title: "India and US in one book",
    body: "INR and USD stay in their markets. Totals convert only when you ask for a single reporting number.",
  },
  {
    icon: LockIcon,
    title: "Private to your account",
    body: "Holdings, securities, and funds live only on your login. Another user cannot open your book.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create your account",
    body: "Register with email. Sessions stay on this device in an HttpOnly cookie.",
  },
  {
    step: "02",
    title: "Add what you already own",
    body: "Mutual funds, ETFs, and stocks. Nothing is preloaded. You type the book.",
  },
  {
    step: "03",
    title: "Read the look-through",
    body: "Company exposure, India vs US, overlap, and weight — all from your holdings.",
  },
];

const capabilities = [
  {
    icon: LayersIcon,
    title: "Stock exposure",
    body: "Company, category, India, US, total, and portfolio weight — sortable.",
  },
  {
    icon: TableIcon,
    title: "Fund overlap",
    body: "See where two products own the same names so you are not doubled up by accident.",
  },
  {
    icon: WalletIcon,
    title: "Your lots",
    body: "Track invested amount and units per holding. Sync a fund URL to pull the stock split.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-foreground/8 blur-3xl" />
        <div className="absolute right-[-8rem] bottom-[-6rem] size-[28rem] rounded-full bg-foreground/5 blur-3xl" />
      </div>
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <BrandLockup />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button nativeButton={false} render={<Link href="/register" />}>
            Get started
          </Button>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col gap-24 px-6 pb-24 pt-10 md:px-10 md:pt-16">
        <section className="flex flex-col items-start gap-8 md:max-w-3xl">
          <p className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
            Personal look-through investing
          </p>
          <h1 className="font-heading text-4xl leading-tight tracking-tight md:text-6xl">{APP_TAGLINE}</h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">{APP_DESCRIPTION}</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
              Start your portfolio
            </Button>
            <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
              I already have an account
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Empty accounts show a blurred preview until you add a holding. No shared catalog.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border bg-card/60 p-5 backdrop-blur">
              <feature.icon className="mb-4 size-5 text-foreground" aria-hidden />
              <h2 className="font-heading text-lg">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </section>

        <section className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl tracking-tight md:text-3xl">How it works</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Three steps from a blank book to company-level exposure across India and the US.
            </p>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((item) => (
              <li key={item.step} className="rounded-2xl border bg-card/40 p-5">
                <p className="font-heading text-xs tracking-widest text-muted-foreground">{item.step}</p>
                <h3 className="mt-3 font-heading text-lg">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl tracking-tight md:text-3xl">What you can see</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Once holdings are in, the same numbers power overview, markets, exposure, and overlap.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {capabilities.map((item) => (
              <article key={item.title} className="rounded-2xl border p-5">
                <item.icon className="mb-4 size-5" aria-hidden />
                <h3 className="font-heading text-lg">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border bg-card/50 px-6 py-10 md:px-10">
          <h2 className="font-heading text-2xl tracking-tight md:text-3xl">Your book stays yours</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            {APP_NAME} is multi-tenant. Nested data — securities, funds, and holdings — is
            scoped to the signed-in user. FX is the only shared reference. Sign in on this device and only
            your holdings appear.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/register" />}>
              Create a private account
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
              Sign in
            </Button>
          </div>
        </section>
      </main>
      <footer className="relative z-10 border-t px-6 py-6 text-xs text-muted-foreground md:px-10">
        {APP_NAME} · Sessions stay on this device · Holdings stay on your account
      </footer>
    </div>
  );
}
