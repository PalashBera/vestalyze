import type { Currency, InvestmentType } from "@/lib/api/types";

export function formatMoney(amount: number, currency: Currency, compact = false): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(amount);
}

/**
 * Per-share prices, where the app's usual whole-rupee rounding would hide the
 * paise the user actually entered.
 */
export function formatPrice(amount: number, currency: Currency = "INR"): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPercent(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

export function typeLabel(type: InvestmentType): string {
  if (type === "mutual_fund") {
    return "Mutual Fund";
  }
  if (type === "etf") {
    return "ETF";
  }
  return "Stock";
}

export function countryLabel(country: "IN" | "US"): string {
  return country === "IN" ? "India" : "United States";
}

export function titleize(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Formats a YYYY-MM-DD column. Forced to UTC so the day never shifts. */
export function formatDateOnly(value?: string | null): string {
  if (!value) {
    return "—";
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatDuration(days: number): string {
  if (days === 0) {
    return "Same day";
  }
  return days === 1 ? "1 day" : `${days} days`;
}

export function formatTimestamp(value?: string): string {
  if (!value) {
    return "Never";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Never";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
