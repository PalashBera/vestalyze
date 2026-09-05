import Image from "next/image";
import Link from "next/link";
import {
  CheckIcon,
  EyeIcon,
  GlobeIcon,
  LayersIcon,
  LockIcon,
  TableIcon,
  WalletIcon,
} from "lucide-react";
import { LandingContactForm } from "@/components/landing/contact-form";
import { LandingFaq } from "@/components/landing/faq";
import { LandingHeader } from "@/components/landing/header";
import { LandingProductShowcase } from "@/components/landing/product-showcase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    body: "Company, sector, India, US, total, and portfolio weight — sortable across the whole book.",
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

const freeFeatures = [
  "Unlimited personal holdings",
  "Look-through for Indian MFs and ETFs",
  "US stocks and ETF exposure",
  "Overlap, markets, and company drill-down",
  "Private multi-tenant book",
];

export default function HomePage() {
  return (
    <div className="min-h-svh bg-background">
      <LandingHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-6 py-12 md:px-10 md:py-16">
        <section className="relative overflow-hidden rounded-3xl ring-1 ring-foreground/10">
          <div className="relative aspect-video min-h-80 md:aspect-21/9 md:min-h-128">
            <Image
              src="/brand/vestalyze-hero.png"
              alt="Vestalyze look-through portfolio across India and the United States"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1152px"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/55 to-background/15" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-end gap-5 p-6 md:p-12">
            <p className="w-fit rounded-full border border-foreground/15 bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              Personal look-through investing
            </p>
            <h1 className="max-w-3xl font-heading text-4xl leading-tight tracking-tight md:text-6xl">
              {APP_TAGLINE}
            </h1>
            <p className="max-w-xl text-base text-muted-foreground md:text-lg">{APP_DESCRIPTION}</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
                Start your portfolio
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="#product" />}>
                See the product
              </Button>
            </div>
          </div>
        </section>

        <section id="product" className="flex scroll-mt-24 flex-col gap-8">
          <div className="max-w-2xl">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">Inside {APP_NAME}</p>
            <h2 className="mt-2 font-heading text-2xl tracking-tight md:text-3xl">A sample book, fully visible</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These screens use illustrative numbers so you can see the layout before you sign in. Your
              account starts empty — nothing is preloaded.
            </p>
          </div>
          <LandingProductShowcase />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border bg-card/60 p-5 backdrop-blur transition-transform duration-300 hover:-translate-y-1"
            >
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
              <li
                key={item.step}
                className="rounded-2xl border bg-card/40 p-5 transition-transform duration-300 hover:-translate-y-1"
              >
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
              <article
                key={item.title}
                className="rounded-2xl border p-5 transition-transform duration-300 hover:-translate-y-1"
              >
                <item.icon className="mb-4 size-5" aria-hidden />
                <h3 className="font-heading text-lg">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="flex scroll-mt-24 flex-col gap-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl tracking-tight md:text-3xl">Pricing</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {APP_NAME} is a personal book. The current product is free for your own holdings.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="transition-transform duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle>Personal</CardTitle>
                <CardDescription>Everything you need to look through your own portfolio.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <p className="font-heading text-4xl tracking-tight">Free</p>
                <ul className="flex flex-col gap-2 text-sm">
                  {freeFeatures.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button nativeButton={false} render={<Link href="/register" />}>
                  Create a free account
                </Button>
              </CardContent>
            </Card>
            <Card className="transition-transform duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>Extra reporting for later — not billed today.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <p className="font-heading text-4xl tracking-tight">Coming soon</p>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <li>CSV export of look-through exposure</li>
                  <li>Scheduled holdings refresh</li>
                  <li>Shared household views</li>
                </ul>
                <Button variant="outline" nativeButton={false} render={<Link href="#contact" />}>
                  Tell us what you need
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="faq" className="flex scroll-mt-24 flex-col gap-8">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl tracking-tight md:text-3xl">FAQ</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Privacy, look-through, and how empty accounts stay empty.
            </p>
          </div>
          <LandingFaq />
        </section>

        <section id="contact" className="grid scroll-mt-24 gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-2xl tracking-tight md:text-3xl">Contact us</h2>
            <p className="text-sm text-muted-foreground">
              Questions about look-through, markets, or a private account. We do not store this form on a
              mailing list — it is a note to the team.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Send a note</CardTitle>
              <CardDescription>Name, email, and a short message.</CardDescription>
            </CardHeader>
            <CardContent>
              <LandingContactForm />
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border bg-card/50 px-6 py-10 md:px-10">
          <h2 className="font-heading text-2xl tracking-tight md:text-3xl">Your book stays yours</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            {APP_NAME} is multi-tenant. Nested data — securities, funds, and holdings — is scoped to the
            signed-in user. FX is the only shared reference. Sign in on this device and only your holdings
            appear.
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
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
          <p>
            {APP_NAME} · Sessions stay on this device · Holdings stay on your account
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#product" className="transition-colors hover:text-foreground">
              Product
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
            <a href="#contact" className="transition-colors hover:text-foreground">
              Contact
            </a>
            <Link href="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
        <Separator />
        <p className="mx-auto max-w-6xl px-6 py-4 text-xs text-muted-foreground md:px-10">
          © {new Date().getFullYear()} {APP_NAME}. Illustrative sample data on this page is not a live
          portfolio.
        </p>
      </footer>
    </div>
  );
}
