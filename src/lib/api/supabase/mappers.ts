import type {
  DataSource,
  Fund,
  FundHolding,
  Investment,
  InvestmentTransaction,
  ScrapingLog,
  Security,
  User,
} from "@/lib/api/types";
import type { Database } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];

export function mapSecurity(row: Tables["securities"]["Row"]): Security {
  return {
    id: row.id,
    companyName: row.company_name,
    standardizedName: row.standardized_name,
    ticker: row.ticker,
    isin: row.isin ?? undefined,
    exchange: row.exchange,
    country: row.country,
    currency: row.currency,
    sector: row.sector,
    industry: row.industry,
  };
}

export function mapFund(row: Tables["funds"]["Row"]): Fund {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    type: row.type,
    fundHouse: row.fund_house,
    category: row.category,
    country: row.country,
    currency: row.currency,
    latestPortfolioDate: row.latest_portfolio_date,
    sourceWebsite: row.source_website,
    sourceUrl: row.source_url,
    lastScrapedAt: row.last_scraped_at,
    dataStatus: row.data_status,
  };
}

export function mapHolding(row: Tables["fund_holdings"]["Row"]): FundHolding {
  return {
    id: row.id,
    fundId: row.fund_id,
    securityId: row.security_id,
    allocationPercentage: Number(row.allocation_percentage),
    holdingDate: row.holding_date,
    shares: row.shares == null ? undefined : Number(row.shares),
    marketValue: row.market_value == null ? undefined : Number(row.market_value),
    sourceId: row.source_id,
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
    currency: row.currency,
    investedAmount: Number(row.invested_amount),
    currentValue: Number(row.current_value),
    units: row.units == null ? undefined : Number(row.units),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTransaction(row: Tables["investment_transactions"]["Row"]): InvestmentTransaction {
  return {
    id: row.id,
    investmentId: row.investment_id,
    transactionDate: row.transaction_date,
    units: row.units == null ? undefined : Number(row.units),
    purchasePrice: row.purchase_price == null ? undefined : Number(row.purchase_price),
    investedAmount: Number(row.invested_amount),
  };
}

export function mapDataSource(row: Tables["data_sources"]["Row"]): DataSource {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    type: row.type,
    lastScrapedAt: row.last_scraped_at,
    lastSuccessfulAt: row.last_successful_at ?? undefined,
    status: row.status,
  };
}

export function mapLog(row: Tables["scraping_logs"]["Row"]): ScrapingLog {
  return {
    id: row.id,
    dataSourceId: row.data_source_id,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    status: row.status,
    recordsProcessed: row.records_processed,
    errorMessage: row.error_message ?? undefined,
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

export function throwQueryError(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
