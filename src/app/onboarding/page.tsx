"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandLockup } from "@/components/brand-mark";
import { InvestmentFields, payloadFromForm } from "@/components/investment-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api/client";
import type { InvestmentType } from "@/lib/api/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(0);
  const [type, setType] = useState<InvestmentType>("mutual_fund");

  // onSubmit rather than the form `action` prop, so a failed save keeps what the
  // user typed. The form is cleared only once the holding is saved.
  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = payloadFromForm(new FormData(form), type);
    setPending(true);
    try {
      await api.investments.create(payload);
      setAdded((count) => count + 1);
      toast.success("Holding saved");
      form.reset();
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
            <CardTitle>Add your first holdings</CardTitle>
            <CardDescription>
              {added > 0
                ? `${added} holding${added === 1 ? "" : "s"} added. Add another or finish.`
                : "Start with a mutual fund or ETF you already own. Nothing is preloaded."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-6" onSubmit={(event) => void onAdd(event)}>
              <InvestmentFields type={type} onTypeChange={setType} />
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
