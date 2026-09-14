import { Resend } from "resend";

const DEFAULT_FROM = "Vestalyze <onboarding@resend.dev>";

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return {
    apiKey,
    from: process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM,
  };
}

export function createResendClient(apiKey: string) {
  return new Resend(apiKey);
}

/** Resolves to an error message, or null when the message was accepted. */
export async function deliverEmail(
  send: Promise<{ error: { message: string } | null }>,
): Promise<string | null> {
  try {
    const { error } = await send;
    return error?.message ?? null;
  } catch (error) {
    return error instanceof Error ? error.message : "Unknown email error";
  }
}
