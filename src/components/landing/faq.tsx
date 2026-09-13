"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    value: "private",
    question: "Is my portfolio visible to other users?",
    answer:
      "No. Holdings, funds, and look-through companies stay on your login. Postgres row-level security filters every nested table by your user id, so another account querying the same table gets nothing back.",
  },
  {
    value: "sync",
    question: "How does fund look-through actually work?",
    answer:
      "Paste a public fund URL on a mutual fund or ETF, then sync. Vestalyze reads the published holdings table and weights each company by your invested amount, so a 6% position inside a fund you put ₹6,00,000 into becomes ₹36,000 of real exposure.",
  },
  {
    value: "fx",
    question: "How are INR and USD combined?",
    answer:
      "They are not, until you ask. Indian amounts stay in INR and US amounts stay in USD on their own pages. Consolidated totals convert using the USD/INR rate you set in Settings.",
  },
  {
    value: "data",
    question: "Do you preload a sample portfolio?",
    answer:
      "Never. A new account is genuinely empty, and the sample numbers on this page are illustrative only. Your account shows real figures the moment you add your first holding, and nothing before that.",
  },
  {
    value: "markets",
    question: "Can I track both India and the US?",
    answer:
      "Yes. Mutual funds, ETFs, and direct stocks across both markets live in one book, with a dedicated page per market and a consolidated view across them.",
  },
  {
    value: "delete",
    question: "What happens if I delete my account?",
    answer:
      "Everything goes. Deleting your account removes your profile, investments, funds, securities, holdings, and sync history from the database, then removes the login itself. There is no soft delete.",
  },
];

export function LandingFaq() {
  return (
    <Accordion className="gap-3">
      {faqs.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className="rounded-xl border border-border/70 bg-card/40 px-4 transition-colors duration-300 not-last:border-b hover:border-border hover:bg-card/70"
        >
          <AccordionTrigger className="cursor-pointer py-4 text-base hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
