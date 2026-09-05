"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BrandLockup } from "@/components/brand-mark";
import { InvestmentFields, payloadFromForm } from "@/components/investment-form";
import { PageLoader } from "@/components/page-loader";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSettings } from "@/components/settings-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import type { Country, Currency, InvestmentType } from "@/lib/api/types";

const currencyItems = [
  { label: "INR", value: "INR" },
  { label: "USD", value: "USD" },
];

export default function OnboardingPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OnboardingForm />
    </Suspense>
  );
}

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency, setCurrency } = useSettings();
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(0);
  const [type, setType] = useState<InvestmentType>("mutual_fund");
  const [country, setCountry] = useState<Country>(searchParams.get("country") === "US" ? "US" : "IN");
  const [sector, setSector] = useState("Uncategorized");

  async function onCurrencyChange(value: string | null) {
    if (value !== "INR" && value !== "USD") {
      return;
    }
    await setCurrency(value as Currency);
  }

  async function onAdd(formData: FormData) {
    setPending(true);
    try {
      await api.investments.create(payloadFromForm(formData, type, country, sector));
      setAdded((count) => count + 1);
      toast.success("Holding saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add holding");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative min-h-svh bg-background">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-4">
        <BrandLockup />
        <ThemeToggle />
      </header>
      <main className="flex min-h-svh items-center justify-center px-4 py-24">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>{step === 1 ? "How should we report?" : "Add your first holdings"}</CardTitle>
            <CardDescription>
              {step === 1
                ? "Pick a display currency. You can change this later in Settings."
                : added > 0
                  ? `${added} holding${added === 1 ? "" : "s"} added. Add another or finish.`
                  : "Start with a holding you already own. Nothing is preloaded."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <div className="flex flex-col gap-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel>Display currency</FieldLabel>
                    <Select items={currencyItems} value={currency} onValueChange={onCurrencyChange}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {currencyItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>Indian amounts stay in INR. US amounts stay in USD. Totals convert with FX.</FieldDescription>
                  </Field>
                </FieldGroup>
                <div className="flex items-center justify-between">
                  <Button variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
                    Skip for now
                  </Button>
                  <Button onClick={() => setStep(2)}>Continue</Button>
                </div>
              </div>
            ) : (
              <form className="flex flex-col gap-6" action={(formData) => void onAdd(formData)}>
                <InvestmentFields
                  type={type}
                  country={country}
                  sector={sector}
                  onTypeChange={setType}
                  onCountryChange={setCountry}
                  onSectorChange={setSector}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button type="button" variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>
                    {added > 0 ? "Finish" : "Skip for now"}
                  </Button>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={pending}>
                      {pending ? <Spinner data-icon="inline-start" /> : null}
                      Save holding
                    </Button>
                    {added > 0 ? (
                      <Button type="button" onClick={() => router.push("/dashboard")}>
                        Go to dashboard
                      </Button>
                    ) : null}
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
