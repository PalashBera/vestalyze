import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Eyebrow } from "@/components/landing/section";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="reveal relative isolate overflow-hidden rounded-3xl border border-border/70 bg-card/40 px-6 py-16 text-center md:px-10 md:py-24">
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[34rem] -translate-x-1/2 -translate-y-[45%] rounded-full bg-linear-to-b from-foreground/12 to-transparent blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[26rem] -translate-x-1/2 -translate-y-[45%] rounded-full border border-foreground/10"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[38rem] -translate-x-1/2 -translate-y-[45%] rounded-full border border-foreground/5"
      />

      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
        <Eyebrow>Get started</Eyebrow>
        <h2 className="font-heading text-3xl leading-[1.12] tracking-tight text-balance sm:text-4xl md:text-[2.6rem]">
          Find out what you already own, before you buy more of it
        </h2>
        <p className="text-base leading-relaxed text-pretty text-muted-foreground">
          Create a book, add your first fund, and watch it unfold into the companies underneath. It takes a
          few minutes and costs nothing.
        </p>
        <Button
          size="lg"
          className="h-11 rounded-xl px-6 text-sm"
          nativeButton={false}
          render={<Link href="/register" />}
        >
          Start your portfolio
          <ArrowRightIcon className="transition-transform duration-300 group-hover/button:translate-x-0.5" />
        </Button>
      </div>
    </section>
  );
}
