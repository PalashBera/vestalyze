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

export interface AuthUser extends User {
  passwordHash: string;
  fxUsdInr: number;
  fxAsOf: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  lastSeenAt: number;
  userAgentHash: string;
}

export interface Security {
  id: string;
  userId: string;
  standardizedName: string;
  ticker: string;
  country: Country;
  currency: Currency;
  sector: string;
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
  lastScrapedAt: string;
}

export interface FundHolding {
  id: string;
  userId: string;
  fundId: string;
  securityId: string;
  allocationPercentage: number;
  holdingDate: string;
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
  units?: number;
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
  currency: Currency;
  investedAmount: number;
  units?: number;
  fundId?: string;
  securityId?: string;
  ticker?: string;
  sector?: string;
  sourceUrl?: string;
}

export interface UpdateInvestmentRequest {
  name?: string;
  investedAmount?: number;
  units?: number;
  sourceUrl?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface AuthResponse {
  user: User;
}

export interface RefreshResult {
  fundId: string;
  status: ScrapeStatus;
  recordsProcessed: number;
  lastScrapedAt: string;
  message: string;
}
