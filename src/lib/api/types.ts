export type Country = "IN" | "US";
export type Currency = "INR" | "USD";
export type InvestmentType = "mutual_fund" | "etf" | "stock";
export type ScrapeStatus = "success" | "failed" | "running";

export interface User {
  id: string;
  email: string;
  name: string;
  displayCurrency: Currency;
  createdAt: string;
}

export interface Security {
  id: string;
  userId: string;
  standardizedName: string;
  ticker: string;
  country: Country;
  currency: Currency;
}

export interface Fund {
  id: string;
  userId: string;
  name: string;
  type: Exclude<InvestmentType, "stock">;
  country: Country;
  currency: Currency;
  latestPortfolioDate: string;
  sourceUrl: string;
}

export interface FundHolding {
  id: string;
  userId: string;
  fundId: string;
  securityId: string;
  allocationPercentage: number;
}

export interface Investment {
  id: string;
  userId: string;
  fundId?: string;
  securityId?: string;
  name: string;
  type: InvestmentType;
  country: Country;
  currency: Currency;
  investedAmount: number;
  sourceUrl?: string;
  lastSyncedAt?: string;
  createdAt: string;
}

export interface InvestmentSync {
  id: string;
  userId: string;
  investmentId: string;
  startedAt: string;
  status: ScrapeStatus;
  recordsProcessed: number;
  errorMessage?: string;
}

export interface UserSettings {
  displayCurrency: Currency;
}

export interface FxRate {
  base: Currency;
  quote: Currency;
  rate: number;
  asOf: string;
}

export interface AllocationSlice {
  key: string;
  label: string;
  amountInr: number;
  amountUsd: number;
  percentage: number;
}

export interface ExposureBreakdown {
  sourceType: InvestmentType;
  sourceName: string;
  investmentId: string;
  country: Country;
  currency: Currency;
  allocationPercentage?: number;
  investedExposureNative: number;
  investedExposureInr: number;
}

export interface StockExposure {
  security: Security;
  mutualFundInvestedInr: number;
  etfInvestedInr: number;
  directInvestedInr: number;
  indiaInvestedInr: number;
  usInvestedInr: number;
  totalInvestedInr: number;
  portfolioPercentage: number;
  breakdown: ExposureBreakdown[];
}

export interface PortfolioOverview {
  totalInvestedInr: number;
  indiaInvestedInr: number;
  usInvestedInr: number;
  mutualFundInvestedInr: number;
  etfInvestedInr: number;
  stockInvestedInr: number;
  fxRate: FxRate;
  marketAllocation: AllocationSlice[];
  typeAllocation: AllocationSlice[];
  topHoldings: StockExposure[];
}

export interface MarketDashboard {
  country: Country;
  totalInvestedNative: number;
  currency: Currency;
  byType: {
    mutualFund: number;
    etf: number;
    stock: number;
  };
  exposures: StockExposure[];
}

export interface FundOverlap {
  fundAId: string;
  fundAName: string;
  fundBId: string;
  fundBName: string;
  overlappingSecurities: Array<{
    securityId: string;
    name: string;
    ticker: string;
    allocationA: number;
    allocationB: number;
  }>;
  overlapScore: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface CreateInvestmentRequest {
  name: string;
  type: InvestmentType;
  country: Country;
  investedAmount: number;
  fundId?: string;
  securityId?: string;
  ticker?: string;
  sourceUrl?: string;
}

export interface UpdateInvestmentRequest {
  name?: string;
  investedAmount?: number;
  sourceUrl?: string;
}

/**
 * A stock trade. Amounts are in INR. `sellDate` and `sellPrice` are absent
 * together while the trade is still open.
 */
export interface StockTrade {
  id: string;
  userId: string;
  name?: string;
  symbol: string;
  buyDate: string;
  buyPrice: number;
  quantity: number;
  sellDate?: string;
  sellPrice?: number;
  createdAt: string;
}

/** Everything derived from a trade. Computed on read, never stored. */
export interface StockTradeMetrics {
  totalPurchaseAmount: number;
  totalSoldAmount?: number;
  returnAmount?: number;
  returnPercentage?: number;
  durationDays: number;
  isOpen: boolean;
}

export interface CreateStockTradeRequest {
  name?: string | null;
  symbol: string;
  buyDate: string;
  buyPrice: number;
  quantity: number;
  sellDate?: string | null;
  sellPrice?: number | null;
}

/** A price target being tracked. Amounts are in INR. */
export interface StockAnalysis {
  id: string;
  userId: string;
  name: string;
  symbol: string;
  buyDate: string;
  buyPrice: number;
  targetReturnPercentage: number;
  createdAt: string;
}

export interface CreateStockAnalysisRequest {
  name: string;
  symbol: string;
  buyDate: string;
  buyPrice: number;
  targetReturnPercentage: number;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface AuthResponse {
  user: User;
}

