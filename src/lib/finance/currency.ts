import type { Currency } from "@/lib/api/types";

export const FX_USD_INR = 87.25;
export const FX_AS_OF = "2026-09-04";

export function toInr(amount: number, currency: Currency, usdInr = FX_USD_INR): number {
  return currency === "INR" ? amount : amount * usdInr;
}

export function toUsd(amount: number, currency: Currency, usdInr = FX_USD_INR): number {
  return currency === "USD" ? amount : amount / usdInr;
}

export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  usdInr = FX_USD_INR,
): number {
  if (from === to) {
    return amount;
  }
  return to === "INR" ? toInr(amount, from, usdInr) : toUsd(amount, from, usdInr);
}

export function getFxRate(override?: { rate: number; asOf: string }) {
  return {
    base: "USD" as const,
    quote: "INR" as const,
    rate: override?.rate ?? FX_USD_INR,
    asOf: override?.asOf ?? FX_AS_OF,
  };
}
