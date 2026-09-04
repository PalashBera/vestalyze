export type Country = "IN" | "US";
export type Currency = "INR" | "USD";
export type InvestmentType = "mutual_fund" | "etf" | "stock";
export type DataStatus = "fresh" | "stale" | "failed" | "pending";
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
  companyName: string;
  standardizedName: string;
  ticker: string;
  isin?: string;
  exchange: string;
  country: Country;
  currency: Currency;
  sector: string;
  industry: string;
}

export interface Fund {
  id: string;
  name: string;
  symbol: string;
  type: Exclude<InvestmentType, "stock">;
  fundHouse: string;
  category: string;
  country: Country;
  currency: Currency;
  latestPortfolioDate: string;
  sourceWebsite: string;
  sourceUrl: string;
  lastScrapedAt: string;
  dataStatus: DataStatus;
}

export interface FundHolding {
  id: string;
  fundId: string;
  securityId: string;
  allocationPercentage: number;
  holdingDate: string;
  shares?: number;
  marketValue?: number;
  sourceId: string;
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
  currentValue: number;
  units?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentTransaction {
  id: string;
  investmentId: string;
  transactionDate: string;
  units?: number;
  purchasePrice?: number;
  investedAmount: number;
}

export interface DataSource {
  id: string;
  name: string;
  url: string;
  type: "indian_mf" | "indian_etf" | "us_etf" | "factsheet";
  lastScrapedAt: string;
  lastSuccessfulAt?: string;
  status: DataStatus;
}

export interface ScrapingLog {
  id: string;
  dataSourceId: string;
  startedAt: string;
  completedAt?: string;
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
  currentExposureNative: number;
  investedExposureInr: number;
  currentExposureInr: number;
}

export interface StockExposure {
  security: Security;
  mutualFundInvestedInr: number;
  etfInvestedInr: number;
  directInvestedInr: number;
  indiaInvestedInr: number;
  usInvestedInr: number;
  totalInvestedInr: number;
  totalCurrentInr: number;
  portfolioPercentage: number;
  breakdown: ExposureBreakdown[];
}

export interface PortfolioOverview {
  totalInvestedInr: number;
  totalCurrentInr: number;
  profitLossInr: number;
  returnPercentage: number;
  indiaInvestedInr: number;
  usInvestedInr: number;
  mutualFundInvestedInr: number;
  etfInvestedInr: number;
  stockInvestedInr: number;
  fxRate: FxRate;
  marketAllocation: AllocationSlice[];
  typeAllocation: AllocationSlice[];
  sectorAllocation: AllocationSlice[];
  topHoldings: StockExposure[];
}

export interface MarketDashboard {
  country: Country;
  totalInvestedNative: number;
  totalCurrentNative: number;
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
  currentValue: number;
  units?: number;
  fundId?: string;
  securityId?: string;
}

export interface UpdateInvestmentRequest {
  name?: string;
  investedAmount?: number;
  currentValue?: number;
  units?: number;
}

export interface CreateTransactionRequest {
  transactionDate: string;
  investedAmount: number;
  units?: number;
  purchasePrice?: number;
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
