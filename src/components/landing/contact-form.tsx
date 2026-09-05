"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LandingContactForm() {
  const [pending, setPending] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
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
    window.setTimeout(() => {
      toast.success("Thanks. We will reply if we can help.");
      form.reset();
      setPending(false);
    }, 400);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
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
      <Button type="submit" disabled={pending} className="self-start">
        Send message
      </Button>
    </form>
  );
}
