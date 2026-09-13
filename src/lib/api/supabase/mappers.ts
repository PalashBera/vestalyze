import type {
  Fund,
  FundHolding,
  Investment,
  Security,
  StockAnalysis,
  StockTrade,
  User,
} from "@/lib/api/types";
import { currencyForCountry } from "@/lib/finance/currency";
import type { Database } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];

export function mapSecurity(row: Tables["securities"]["Row"]): Security {
  return {
    id: row.id,
    userId: row.user_id,
    standardizedName: row.standardized_name,
    ticker: row.ticker,
    country: row.country,
    currency: currencyForCountry(row.country),
  };
}

export function mapFund(row: Tables["funds"]["Row"]): Fund {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    country: row.country,
    currency: currencyForCountry(row.country),
    latestPortfolioDate: row.latest_portfolio_date,
    sourceUrl: row.source_url,
  };
}

export function mapHolding(row: Tables["fund_holdings"]["Row"]): FundHolding {
  return {
    id: row.id,
    userId: row.user_id,
    fundId: row.fund_id,
    securityId: row.security_id,
    allocationPercentage: Number(row.allocation_percentage),
  };
}

export function mapInvestment(row: Tables["investments"]["Row"]): Investment {
  return {
    id: row.id,
    userId: row.user_id,
    fundId: row.fund_id ?? undefined,
    securityId: row.security_id ?? undefined,
    name: row.name,
    type: row.type,
    country: row.country,
    currency: currencyForCountry(row.country),
    investedAmount: Number(row.invested_amount),
    sourceUrl: row.source_url ?? undefined,
    lastSyncedAt: row.last_synced_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapUser(
  id: string,
  email: string,
  profile: Pick<Tables["profiles"]["Row"], "name" | "display_currency" | "created_at">,
): User {
  return {
    id,
    email,
    name: profile.name,
    displayCurrency: profile.display_currency,
    createdAt: profile.created_at,
  };
}

export function mapSync(row: Tables["investment_syncs"]["Row"]): import("@/lib/api/types").InvestmentSync {
  return {
    id: row.id,
    userId: row.user_id,
    investmentId: row.investment_id,
    startedAt: row.started_at,
    status: row.status,
    recordsProcessed: row.records_processed,
    errorMessage: row.error_message ?? undefined,
  };
}

export function mapTrade(row: Tables["stock_trades"]["Row"]): StockTrade {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    symbol: row.symbol,
    buyDate: row.buy_date,
    buyPrice: Number(row.buy_price),
    quantity: Number(row.quantity),
    sellDate: row.sell_date ?? undefined,
    sellPrice: row.sell_price === null ? undefined : Number(row.sell_price),
    createdAt: row.created_at,
  };
}

export function mapAnalysis(row: Tables["stock_analysis"]["Row"]): StockAnalysis {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    symbol: row.symbol,
    buyDate: row.buy_date,
    buyPrice: Number(row.buy_price),
    targetReturnPercentage: Number(row.target_return_percentage),
    createdAt: row.created_at,
  };
}

export function throwQueryError(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
