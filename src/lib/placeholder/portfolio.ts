import type { FundOverlap, Investment, PortfolioOverview, StockExposure } from "@/lib/api/types";
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
    standardizedName: name,
    ticker,
    country,
    currency: country === "IN" ? "INR" : "USD",
    sector,
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
    security: demoSecurity("demo-nvda", "NVIDIA", "NVDA", "US", "Technology"),
    mutualFundInvestedInr: 28000,
    etfInvestedInr: 54000,
    directInvestedInr: 22000,
    indiaInvestedInr: 0,
    usInvestedInr: 104000,
    totalInvestedInr: 104000,
    portfolioPercentage: 8.6,
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
  {
    security: demoSecurity("demo-amzn", "Amazon", "AMZN", "US", "Consumer"),
    mutualFundInvestedInr: 18000,
    etfInvestedInr: 41000,
    directInvestedInr: 0,
    indiaInvestedInr: 0,
    usInvestedInr: 59000,
    totalInvestedInr: 59000,
    portfolioPercentage: 4.9,
    breakdown: [],
  },
  {
    security: demoSecurity("demo-tcs", "TCS", "TCS", "IN", "Technology"),
    mutualFundInvestedInr: 31000,
    etfInvestedInr: 12000,
    directInvestedInr: 15000,
    indiaInvestedInr: 58000,
    usInvestedInr: 0,
    totalInvestedInr: 58000,
    portfolioPercentage: 4.8,
    breakdown: [],
  },
  {
    security: demoSecurity("demo-googl", "Alphabet", "GOOGL", "US", "Technology"),
    mutualFundInvestedInr: 12000,
    etfInvestedInr: 36000,
    directInvestedInr: 0,
    indiaInvestedInr: 0,
    usInvestedInr: 48000,
    totalInvestedInr: 48000,
    portfolioPercentage: 4.0,
    breakdown: [],
  },
  {
    security: demoSecurity("demo-meta", "Meta", "META", "US", "Technology"),
    mutualFundInvestedInr: 8000,
    etfInvestedInr: 27000,
    directInvestedInr: 9000,
    indiaInvestedInr: 0,
    usInvestedInr: 44000,
    totalInvestedInr: 44000,
    portfolioPercentage: 3.6,
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
  { id: "ph-6", name: "Bharti Airtel", allocationPercentage: 2.7 },
  { id: "ph-7", name: "Larsen & Toubro", allocationPercentage: 2.4 },
];

export const placeholderSyncs = [
  { id: "ps-1", startedAt: "2026-08-12T09:14:00.000Z", status: "success" as const, recordsProcessed: 48 },
  { id: "ps-2", startedAt: "2026-07-03T11:02:00.000Z", status: "success" as const, recordsProcessed: 46 },
  { id: "ps-3", startedAt: "2026-06-01T08:40:00.000Z", status: "failed" as const, recordsProcessed: 0, errorMessage: "Could not read the holdings table." },
];

export const placeholderInvestments: Array<Pick<Investment, "id" | "name" | "type" | "country" | "currency"> & { invested: string; units: string; lastSync: string }> = [
  { id: "pi-1", name: "Bandhan Small Cap Fund Direct Growth", type: "mutual_fund", country: "IN", currency: "INR", invested: "₹12,40,000", units: "18,420", lastSync: "12 Aug 2026" },
  { id: "pi-2", name: "Nippon India Nifty 50 ETF", type: "etf", country: "IN", currency: "INR", invested: "₹3,80,000", units: "1,245", lastSync: "12 Aug 2026" },
  { id: "pi-3", name: "Parag Parikh Flexi Cap Direct", type: "mutual_fund", country: "IN", currency: "INR", invested: "₹6,10,000", units: "8,902", lastSync: "3 Jul 2026" },
  { id: "pi-4", name: "Invesco QQQ", type: "etf", country: "US", currency: "USD", invested: "$8,400", units: "18.2", lastSync: "12 Aug 2026" },
  { id: "pi-5", name: "Apple", type: "stock", country: "US", currency: "USD", invested: "$5,000", units: "22", lastSync: "—" },
  { id: "pi-6", name: "HDFC Bank", type: "stock", country: "IN", currency: "INR", invested: "₹2,15,000", units: "140", lastSync: "—" },
];

export const placeholderOverlaps: FundOverlap[] = [
  {
    fundAId: "pa",
    fundAName: "Parag Parikh Flexi Cap",
    fundBId: "qqq",
    fundBName: "Invesco QQQ",
    overlapScore: 12.4,
    overlappingSecurities: [
      { securityId: "msft", name: "Microsoft", ticker: "MSFT", allocationA: 5.0, allocationB: 8.1 },
      { securityId: "amzn", name: "Amazon", ticker: "AMZN", allocationA: 5.5, allocationB: 5.2 },
      { securityId: "aapl", name: "Apple", ticker: "AAPL", allocationA: 2.1, allocationB: 8.8 },
      { securityId: "nvda", name: "NVIDIA", ticker: "NVDA", allocationA: 1.8, allocationB: 8.4 },
      { securityId: "googl", name: "Alphabet", ticker: "GOOGL", allocationA: 2.4, allocationB: 5.1 },
    ],
  },
  {
    fundAId: "bandhan",
    fundAName: "Bandhan Small Cap",
    fundBId: "nifty",
    fundBName: "Nifty 50 ETF",
    overlapScore: 6.8,
    overlappingSecurities: [
      { securityId: "hdfc", name: "HDFC Bank", ticker: "HDFCBANK", allocationA: 2.2, allocationB: 11.4 },
      { securityId: "icici", name: "ICICI Bank", ticker: "ICICIBANK", allocationA: 1.4, allocationB: 7.9 },
      { securityId: "infy", name: "Infosys", ticker: "INFY", allocationA: 1.1, allocationB: 5.6 },
      { securityId: "rel", name: "Reliance Industries", ticker: "RELIANCE", allocationA: 0.9, allocationB: 8.2 },
    ],
  },
];
