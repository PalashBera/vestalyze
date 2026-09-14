import { APP_NAME } from "@/lib/brand";

/**
 * Email clients ignore CSS variables, so the app's neutral tokens are inlined as
 * their sRGB equivalents: oklch(1 0 0) -> #ffffff, oklch(0.97 0 0) -> #f5f5f5,
 * oklch(0.922 0 0) -> #e5e5e5, oklch(0.556 0 0) -> #737373, oklch(0.145 0 0) -> #0a0a0a.
 */
const palette = {
  page: "#f5f5f5",
  card: "#ffffff",
  subtle: "#fafafa",
  border: "#e5e5e5",
  text: "#0a0a0a",
  muted: "#737373",
};

const fontStack =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji',sans-serif";
const monoStack = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

export type ContactMessage = {
  name: string;
  email: string;
  message: string;
  receivedAt: Date;
  origin: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toParagraphs(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export function formatReceivedAt(date: Date): string {
  const formatted = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
  return `${formatted} IST`;
}

function shell({
  preheader,
  badge,
  heading,
  intro,
  content,
  footnote,
}: {
  preheader: string;
  badge: string;
  heading: string;
  intro: string;
  content: string;
  footnote: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${palette.page};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${palette.page};">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${palette.card};border:1px solid ${palette.border};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid ${palette.border};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-family:${fontStack};font-size:20px;font-weight:700;letter-spacing:-0.02em;color:${palette.text};">${APP_NAME}</td>
                    <td align="right" style="font-family:${fontStack};font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:${palette.muted};">${escapeHtml(badge)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-family:${fontStack};font-size:22px;line-height:1.3;font-weight:600;letter-spacing:-0.02em;color:${palette.text};">${escapeHtml(heading)}</h1>
                <p style="margin:0 0 24px;font-family:${fontStack};font-size:15px;line-height:1.6;color:${palette.muted};">${intro}</p>
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:${palette.subtle};border-top:1px solid ${palette.border};font-family:${fontStack};font-size:12px;line-height:1.6;color:${palette.muted};">
                ${footnote}
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-family:${fontStack};font-size:11px;color:${palette.muted};">${APP_NAME} · Look through every fund to the companies you actually own.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function detailTable(rows: Array<{ label: string; value: string; mono?: boolean }>): string {
  const cells = rows
    .map((row, index) => {
      const border = index < rows.length - 1 ? `border-bottom:1px solid ${palette.border};` : "";
      const family = row.mono ? monoStack : fontStack;
      return `<tr>
        <td style="padding:14px 16px;${border}">
          <div style="font-family:${fontStack};font-size:11px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${palette.muted};">${escapeHtml(row.label)}</div>
          <div style="margin-top:4px;font-family:${family};font-size:15px;line-height:1.5;color:${palette.text};">${row.value}</div>
        </td>
      </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${palette.subtle};border:1px solid ${palette.border};border-radius:12px;">${cells}</table>`;
}

function messageBlock(label: string, message: string): string {
  return `<div style="margin-top:16px;">
    <div style="margin-bottom:8px;font-family:${fontStack};font-size:11px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${palette.muted};">${escapeHtml(label)}</div>
    <div style="padding:16px;background:${palette.subtle};border:1px solid ${palette.border};border-radius:12px;font-family:${fontStack};font-size:15px;line-height:1.65;color:${palette.text};white-space:normal;">${toParagraphs(message)}</div>
  </div>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
    <tr>
      <td style="background:${palette.text};border-radius:10px;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:11px 22px;font-family:${fontStack};font-size:14px;font-weight:500;color:${palette.card};text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function contactTeamEmail(input: ContactMessage): { subject: string; html: string; text: string } {
  const received = formatReceivedAt(input.receivedAt);
  const content =
    detailTable([
      { label: "Name", value: escapeHtml(input.name) },
      { label: "Email", value: escapeHtml(input.email), mono: true },
      { label: "Received", value: escapeHtml(received) },
    ]) + messageBlock("Message", input.message);

  return {
    subject: `New contact request from ${input.name}`,
    html: shell({
      preheader: `${input.name} <${input.email}> — ${input.message.slice(0, 120)}`,
      badge: "Contact",
      heading: "New contact request",
      intro: `Someone reached out through the ${escapeHtml(APP_NAME)} landing page.`,
      content,
      footnote: `Reply to this email to answer ${escapeHtml(input.name)} directly — the reply-to address is already set to their email.`,
    }),
    text: [
      `New contact request from ${input.name}`,
      "",
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Received: ${received}`,
      "",
      "Message:",
      input.message,
    ].join("\n"),
  };
}

export function contactAckEmail(input: ContactMessage): { subject: string; html: string; text: string } {
  const firstName = input.name.split(/\s+/)[0] || input.name;
  const content =
    messageBlock("What you sent", input.message) + button(input.origin, `Explore ${APP_NAME}`);

  return {
    subject: `We received your message — ${APP_NAME}`,
    html: shell({
      preheader: `Thanks for reaching out. The ${APP_NAME} team will get back to you shortly.`,
      badge: "Received",
      heading: `Thanks for reaching out, ${firstName}`,
      intro: `Your message is with the ${escapeHtml(APP_NAME)} team. We read everything that comes in and will get back to you shortly.`,
      content,
      footnote: `You received this because this address was used to contact ${escapeHtml(APP_NAME)} on ${escapeHtml(formatReceivedAt(input.receivedAt))}. If that was not you, you can ignore this email — no account was created.`,
    }),
    text: [
      `Thanks for reaching out, ${firstName}`,
      "",
      `Your message is with the ${APP_NAME} team. We read everything that comes in and will get back to you shortly.`,
      "",
      "What you sent:",
      input.message,
      "",
      input.origin,
    ].join("\n"),
  };
}

export function tradeExportEmail(input: {
  name: string;
  email: string;
  filename: string;
  tradeCount: number;
  inProgress: number;
  completed: number;
}): { subject: string; html: string; text: string } {
  const firstName = input.name.split(/\s+/)[0] || input.name;
  const content = detailTable([
    { label: "File", value: escapeHtml(input.filename), mono: true },
    { label: "Trades", value: String(input.tradeCount) },
    { label: "In progress", value: String(input.inProgress) },
    { label: "Completed", value: String(input.completed) },
  ]);

  return {
    subject: `Your stock trades CSV — ${APP_NAME}`,
    html: shell({
      preheader: `${input.tradeCount} trades attached as ${input.filename}.`,
      badge: "Export",
      heading: `Your trade journal, ${escapeHtml(firstName)}`,
      intro: `A CSV of every stock trade on this ${escapeHtml(APP_NAME)} account is attached. Open lots are marked In Progress and leave the sale columns blank.`,
      content,
      footnote: `Sent to ${escapeHtml(input.email)} because you asked for an export from Stock Trades. If that was not you, you can ignore this email.`,
    }),
    text: [
      `Your trade journal, ${firstName}`,
      "",
      `A CSV of every stock trade on this ${APP_NAME} account is attached.`,
      "",
      `File: ${input.filename}`,
      `Trades: ${input.tradeCount}`,
      `In progress: ${input.inProgress}`,
      `Completed: ${input.completed}`,
    ].join("\n"),
  };
}
