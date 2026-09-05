import type { PortfolioOverview, StockExposure } from "@/lib/api/types";
import { getFxRate } from "@/lib/finance/currency";

function demoSecurity(
  id: string,
  name: string,
  ticker: string,
  country: "IN" | "US",
  sector: string,
): StockExposure["security"] {
  return {
    id,
    userId: "preview",
    companyName: name,
    standardizedName: name,
    ticker,
    exchange: country === "IN" ? "NSE" : "NASDAQ",
    country,
    currency: country === "IN" ? "INR" : "USD",
    sector,
    industry: sector,
  };
}

export const placeholderExposures: StockExposure[] = [
  {
    security: demoSecurity("demo-hdfc", "HDFC Bank", "HDFCBANK", "IN", "Banking"),
    mutualFundInvestedInr: 180000,
    etfInvestedInr: 42000,
    directInvestedInr: 0,
    indiaInvestedInr: 222000,
    usInvestedInr: 0,
    totalInvestedInr: 222000,
    portfolioPercentage: 18.4,
    breakdown: [],
  },
  {
    security: demoSecurity("demo-aapl", "Apple", "AAPL", "US", "Technology"),
    mutualFundInvestedInr: 95000,
    etfInvestedInr: 70000,
    directInvestedInr: 40000,
    indiaInvestedInr: 0,
    usInvestedInr: 205000,
    totalInvestedInr: 205000,
    portfolioPercentage: 17,
    breakdown: [],
  },
  {
    security: demoSecurity("demo-rel", "Reliance Industries", "RELIANCE", "IN", "Energy"),
    mutualFundInvestedInr: 60000,
    etfInvestedInr: 38000,
    directInvestedInr: 70000,
    indiaInvestedInr: 168000,
    usInvestedInr: 0,
    totalInvestedInr: 168000,
    portfolioPercentage: 13.9,
    breakdown: [],
  },
  {
    security: demoSecurity("demo-msft", "Microsoft", "MSFT", "US", "Technology"),
    mutualFundInvestedInr: 52000,
    etfInvestedInr: 61000,
    directInvestedInr: 0,
    indiaInvestedInr: 0,
    usInvestedInr: 113000,
    totalInvestedInr: 113000,
    portfolioPercentage: 9.4,
    breakdown: [],
  },
  {
    security: demoSecurity("demo-infy", "Infosys", "INFY", "IN", "Technology"),
    mutualFundInvestedInr: 48000,
    etfInvestedInr: 21000,
    directInvestedInr: 0,
    indiaInvestedInr: 69000,
    usInvestedInr: 0,
    totalInvestedInr: 69000,
    portfolioPercentage: 5.7,
    breakdown: [],
  },
];

export const placeholderOverview: PortfolioOverview = {
  totalInvestedInr: 1205000,
  indiaInvestedInr: 720000,
  usInvestedInr: 485000,
  mutualFundInvestedInr: 510000,
  etfInvestedInr: 380000,
  stockInvestedInr: 315000,
  fxRate: getFxRate(),
  marketAllocation: [
    { key: "IN", label: "India", amountInr: 720000, amountUsd: 8250, percentage: 59.8 },
    { key: "US", label: "United States", amountInr: 485000, amountUsd: 5560, percentage: 40.2 },
  ],
  typeAllocation: [
    { key: "mutual_fund", label: "Mutual Funds", amountInr: 510000, amountUsd: 5845, percentage: 42.3 },
    { key: "etf", label: "ETFs", amountInr: 380000, amountUsd: 4355, percentage: 31.5 },
    { key: "stock", label: "Direct Stocks", amountInr: 315000, amountUsd: 3610, percentage: 26.2 },
  ],
  topHoldings: placeholderExposures,
};

export const placeholderHoldings = [
  { id: "ph-1", name: "HDFC Bank", allocationPercentage: 8.4 },
  { id: "ph-2", name: "Reliance Industries", allocationPercentage: 6.1 },
  { id: "ph-3", name: "Infosys", allocationPercentage: 4.8 },
  { id: "ph-4", name: "ICICI Bank", allocationPercentage: 3.9 },
  { id: "ph-5", name: "TCS", allocationPercentage: 3.2 },
];

export const placeholderSyncs = [
  { id: "ps-1", startedAt: "2026-08-12T09:14:00.000Z", status: "success" as const, recordsProcessed: 48 },
  { id: "ps-2", startedAt: "2026-07-03T11:02:00.000Z", status: "success" as const, recordsProcessed: 46 },
  { id: "ps-3", startedAt: "2026-06-01T08:40:00.000Z", status: "failed" as const, recordsProcessed: 0, errorMessage: "Could not read the holdings table." },
];
