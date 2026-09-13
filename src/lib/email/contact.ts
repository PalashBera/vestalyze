import { Resend } from "resend";
import { throwQueryError } from "@/lib/api/supabase/mappers";
import { isValidEmail } from "@/lib/auth/password";
import { contactAckEmail, contactTeamEmail, type ContactMessage } from "@/lib/email/templates";

/**
 * `onboarding@resend.dev` is Resend's shared sandbox sender. It only delivers to the
 * address that owns the Resend account, so set CONTACT_FROM_EMAIL to an address on a
 * verified domain before the acknowledgement can reach arbitrary visitors.
 */
const DEFAULT_FROM = "Vestalyze <onboarding@resend.dev>";
const DEFAULT_TO = "palashbera1234@gmail.com";

const MAX_NAME_LENGTH = 80;
const MIN_MESSAGE_LENGTH = 8;
const MAX_MESSAGE_LENGTH = 2000;

export type ContactInput = {
  name?: string;
  email?: string;
  message?: string;
};

function emailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return {
    apiKey,
    from: process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM,
    to: process.env.CONTACT_TO_EMAIL?.trim() || DEFAULT_TO,
  };
}

/** Resolves to an error message, or null when the message was accepted. */
async function deliver(send: Promise<{ error: { message: string } | null }>): Promise<string | null> {
  try {
    const { error } = await send;
    return error?.message ?? null;
  } catch (error) {
    return error instanceof Error ? error.message : "Unknown email error";
  }
}

export async function sendContactMessage(input: ContactInput, origin: string) {
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const message = (input.message ?? "").trim();

  if (!name || name.length > MAX_NAME_LENGTH) {
    throwQueryError("Add your name.", 400);
  }
  if (!isValidEmail(email)) {
    throwQueryError("Add a valid email address.", 400);
  }
  if (message.length < MIN_MESSAGE_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    throwQueryError(
      `Add a message between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters.`,
      400,
    );
  }

  const config = emailConfig();
  if (!config) {
    console.error("[contact] RESEND_API_KEY is not set — the message was not sent.");
    throwQueryError("Email delivery is not configured yet. Please try again later.", 503);
  }

  const payload: ContactMessage = { name, email, message, receivedAt: new Date(), origin };
  const team = contactTeamEmail(payload);
  const acknowledgement = contactAckEmail(payload);
  const resend = new Resend(config.apiKey);

  // Sent independently rather than as a batch so a rejected acknowledgement
  // (unverified sending domain, bouncing visitor address) still lets the team
  // notification through.
  const [teamError, ackError] = await Promise.all([
    deliver(
      resend.emails.send({
        from: config.from,
        to: config.to,
        replyTo: email,
        subject: team.subject,
        html: team.html,
        text: team.text,
      }),
    ),
    deliver(
      resend.emails.send({
        from: config.from,
        to: email,
        subject: acknowledgement.subject,
        html: acknowledgement.html,
        text: acknowledgement.text,
      }),
    ),
  ]);

  if (teamError) {
    console.error("[contact] Resend rejected the team notification:", teamError);
    throwQueryError("We could not send your message. Please try again.", 502);
  }
  if (ackError) {
    console.error("[contact] Resend rejected the visitor acknowledgement:", ackError);
  }

  return { ok: true as const, acknowledged: !ackError };
}
