import type { Country, CreateInvestmentRequest, Currency, Security } from "@/lib/api/types";

export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9.]/g, "");
}

export function securityIdFor(userId: string, ticker: string, country: Country): string {
  const owner = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32).toLowerCase();
  const code = normalizeTicker(ticker).toLowerCase().replace(/[^a-z0-9]/g, "");
  return `sec-${owner}-${code}-${country.toLowerCase()}`;
}

export function companySlug(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "").slice(0, 48) || "holding";
}

export function buildSecurityFromCompany(userId: string, name: string, country: Country): Security {
  const slug = companySlug(name);
  return {
    id: securityIdFor(userId, slug, country),
    userId,
    companyName: name.trim(),
    standardizedName: name.trim(),
    ticker: slug.toUpperCase(),
    exchange: country === "IN" ? "NSE" : "NASDAQ",
    country,
    currency: (country === "IN" ? "INR" : "USD") as Currency,
    sector: "Uncategorized",
    industry: "Uncategorized",
  };
}

export function buildSecurityFromInput(input: CreateInvestmentRequest, userId: string): Security | null {
  if (input.type !== "stock") {
    return null;
  }
  const ticker = normalizeTicker(input.ticker || input.name);
  if (!ticker || ticker.length > 16) {
    return null;
  }
  const name = input.name.trim();
  const sector = input.sector?.trim() || "Uncategorized";
  return {
    id: securityIdFor(userId, ticker, input.country),
    userId,
    companyName: name,
    standardizedName: name,
    ticker,
    exchange: input.country === "IN" ? "NSE" : "NASDAQ",
    country: input.country,
    currency: (input.country === "IN" ? "INR" : "USD") as Currency,
    sector,
    industry: sector,
  };
}
