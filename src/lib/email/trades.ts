import { throwQueryError } from "@/lib/api/supabase/mappers";
import { isValidEmail } from "@/lib/auth/password";
import { createResendClient, deliverEmail, getResendConfig } from "@/lib/email/resend";
import { tradeExportEmail } from "@/lib/email/templates";

export async function sendTradeCsvEmail(input: {
  name: string;
  email: string;
  filename: string;
  csv: string;
  tradeCount: number;
  inProgress: number;
  completed: number;
}) {
  if (!isValidEmail(input.email)) {
    throwQueryError("Your account does not have a valid email address.", 400);
  }

  const config = getResendConfig();
  if (!config) {
    console.error("[trades] RESEND_API_KEY is not set — the export was not emailed.");
    throwQueryError("Email delivery is not configured yet. Please try again later.", 503);
  }

  const message = tradeExportEmail(input);
  const resend = createResendClient(config.apiKey);
  const error = await deliverEmail(
    resend.emails.send({
      from: config.from,
      to: input.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: [
        {
          filename: input.filename,
          content: Buffer.from(input.csv, "utf8"),
          contentType: "text/csv",
        },
      ],
    }),
  );

  if (error) {
    console.error("[trades] Resend rejected the trade export:", error);
    throwQueryError("We could not email the CSV. Please try again.", 502);
  }

  return { ok: true as const, email: input.email };
}
