"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    value: "private",
    question: "Is my portfolio visible to other users?",
    answer:
      "No. Holdings, funds, and look-through companies stay on your login. Another account cannot open your book.",
  },
  {
    value: "sync",
    question: "How does fund look-through work?",
    answer:
      "Paste a public fund URL on a mutual fund or ETF, then sync. Vestalyze reads the holdings table and weights each company by your invested amount.",
  },
  {
    value: "fx",
    question: "How are INR and USD combined?",
    answer:
      "Indian amounts stay in INR. US amounts stay in USD. Consolidated totals convert with the USD/INR rate you set in Settings.",
  },
  {
    value: "data",
    question: "Do you preload a sample portfolio?",
    answer:
      "Never. Empty pages show a blurred preview so you can see the layout. Your numbers appear only after you add a holding.",
  },
  {
    value: "markets",
    question: "Can I track both India and the US?",
    answer:
      "Yes. Mutual funds, ETFs, and direct stocks across both markets sit in one book, with market pages for each.",
  },
];

export function LandingFaq() {
  return (
    <Accordion>
      {faqs.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger className="cursor-pointer text-base">{item.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
