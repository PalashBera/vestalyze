"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LandingContactForm() {
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    if (!name || !emailPattern.test(email) || message.length < 8) {
      toast.error("Add your name, a valid email, and a short message.");
      return;
    }
    setPending(true);
    try {
      const result = await api.contact.send({ name, email, message });
      toast.success(
        result.acknowledged
          ? "Thanks. A confirmation is on its way to your inbox."
          : "Thanks. We have your message and will reply shortly.",
      );
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your message.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="contact-name">Name</FieldLabel>
          <Input id="contact-name" name="name" autoComplete="name" required maxLength={80} />
        </Field>
        <Field>
          <FieldLabel htmlFor="contact-email">Email</FieldLabel>
          <Input id="contact-email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="contact-message">Message</FieldLabel>
          <Textarea id="contact-message" name="message" required minLength={8} maxLength={2000} rows={5} />
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending} className="h-10 w-full rounded-xl sm:w-auto sm:self-start sm:px-5">
        Send message
      </Button>
    </form>
  );
}
