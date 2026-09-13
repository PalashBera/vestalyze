"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { BrandLockup } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/brand";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      if (mode === "login") {
        await api.auth.login(email, password);
      } else {
        await api.auth.register(name, email, password);
      }
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      const fallback = mode === "register" ? "/onboarding" : "/dashboard";
      const next = searchParams.get("next") ?? fallback;
      router.push(next.startsWith("/") ? next : fallback);
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to continue";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-foreground">
          <BrandLockup />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <form className="flex w-full max-w-sm flex-col gap-6" onSubmit={(event) => void onSubmit(event)}>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-2xl">
              {mode === "login" ? "Sign in" : "Create account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Access your consolidated India and US portfolio."
                : `Set up ${APP_NAME} with the holdings you already own.`}
            </p>
          </div>
          <FieldGroup>
            {mode === "register" ? (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
            ) : null}
            <Field data-invalid={Boolean(error) || undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={Boolean(error)}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field data-invalid={Boolean(error) || undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={8}
                maxLength={128}
                aria-invalid={Boolean(error)}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <FieldDescription>
                {error ?? "Use at least 8 characters. Paste is supported."}
              </FieldDescription>
            </Field>
          </FieldGroup>
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Need an account?{" "}
                <Link href="/register" className="text-foreground underline-offset-4 hover:underline">
                  Register
                </Link>
              </>
            ) : (
              <>
                Already registered?{" "}
                <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </form>
      </main>
    </div>
  );
}
