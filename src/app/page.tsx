import type { Metadata } from "next";
import { LandingContactForm } from "@/components/landing/contact-form";
import { LandingCoverageStrip } from "@/components/landing/coverage-strip";
import { LandingCta } from "@/components/landing/cta";
import { LandingDeepDive } from "@/components/landing/deep-dive";
import { LandingFaq } from "@/components/landing/faq";
import { LandingFeatureBento } from "@/components/landing/feature-bento";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHeader } from "@/components/landing/header";
import { LandingHero } from "@/components/landing/hero";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingPrinciples } from "@/components/landing/principles";
import { Section, SectionHeading } from "@/components/landing/section";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: [{ url: "/brand/vestalyze-hero.png", width: 1024, height: 683, alt: APP_TAGLINE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: ["/brand/vestalyze-hero.png"],
  },
};

export default function HomePage() {
  return (
    <div className="min-h-svh bg-background">
      <LandingHeader />

      <main className="flex flex-col">
        <LandingHero />

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 py-16 sm:px-6 md:gap-36 md:px-10 md:py-24">
          <LandingCoverageStrip />

          <Section id="features">
            <LandingFeatureBento />
          </Section>

          <Section id="product">
            <LandingDeepDive />
          </Section>

          <Section id="pricing">
            <LandingPricing />
          </Section>

          <Section>
            <LandingPrinciples />
          </Section>

          <Section id="faq">
            <SectionHeading
              eyebrow="FAQ"
              title="Frequently asked questions"
              description="Privacy, look-through, currencies, and what happens to your data when you leave."
            />
            <div className="mx-auto w-full max-w-3xl">
              <LandingFaq />
            </div>
          </Section>

          <Section id="contact" className="gap-10">
            <SectionHeading
              eyebrow="Contact"
              title="Still have a question?"
              description="Ask about look-through, markets, or anything on the roadmap. This is a note to the team, not a mailing list."
            />
            <div className="mx-auto w-full max-w-xl rounded-2xl border border-border/70 bg-card/40 p-6 md:p-8">
              <LandingContactForm />
            </div>
          </Section>

          <LandingCta />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
