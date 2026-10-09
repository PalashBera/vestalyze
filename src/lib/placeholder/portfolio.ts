// Illustrative numbers for the marketing pages only. Signed-in screens render
// real data or an empty state, never these.
import type { FundOverlap, Investment, StockExposure } from "@/lib/api/types";

function demoExposure(
  id: string,
  name: string,
  ticker: string,
  mutualFundInvestedInr: number,
  etfInvestedInr: number,
  portfolioPercentage: number,
): StockExposure {
  return {
    security: { id, userId: "demo", standardizedName: name, ticker },
    mutualFundInvestedInr,
    etfInvestedInr,
    directInvestedInr: 0,
    totalInvestedInr: mutualFundInvestedInr + etfInvestedInr,
    portfolioPercentage,
    breakdown: [],
  };
}

export const placeholderExposures: StockExposure[] = [
  demoExposure("demo-hdfc", "HDFC Bank", "HDFCBANK", 158000, 64000, 18.4),
  demoExposure("demo-icici", "ICICI Bank", "ICICIBANK", 112000, 56000, 13.9),
  demoExposure("demo-rel", "Reliance Industries", "RELIANCE", 74000, 39000, 9.4),
  demoExposure("demo-infy", "Infosys", "INFY", 66000, 38000, 8.6),
  demoExposure("demo-airtel", "Bharti Airtel", "BHARTIARTL", 52000, 17000, 5.7),
  demoExposure("demo-lt", "Larsen & Toubro", "LT", 41000, 18000, 4.9),
  demoExposure("demo-tcs", "TCS", "TCS", 34000, 24000, 4.8),
  demoExposure("demo-axis", "Axis Bank", "AXISBANK", 36000, 12000, 4.0),
  demoExposure("demo-itc", "ITC", "ITC", 27000, 17000, 3.7),
  demoExposure("demo-sbi", "State Bank of India", "SBIN", 29000, 11000, 3.3),
];

export const placeholderInvestments: Array<Pick<Investment, "id" | "name" | "type"> & { invested: string; lastSync: string }> = [
  { id: "pi-1", name: "Parag Parikh Flexi Cap Direct", type: "mutual_fund", invested: "₹4,60,000", lastSync: "12 Aug 2026" },
  { id: "pi-2", name: "Bandhan Small Cap Fund Direct Growth", type: "mutual_fund", invested: "₹3,64,000", lastSync: "12 Aug 2026" },
  { id: "pi-3", name: "Nippon India ETF Nifty 50 BeES", type: "etf", invested: "₹2,41,000", lastSync: "3 Jul 2026" },
  { id: "pi-4", name: "ICICI Prudential Nifty Bank ETF", type: "etf", invested: "₹1,40,000", lastSync: "12 Aug 2026" },
];

export const placeholderOverlaps: FundOverlap[] = [
  {
    fundAId: "ppfas",
    fundAName: "Parag Parikh Flexi Cap",
    fundBId: "niftybees",
    fundBName: "Nifty 50 BeES",
    overlapScore: 24.3,
    overlappingSecurities: [
      { securityId: "hdfc", name: "HDFC Bank", ticker: "HDFCBANK", allocationA: 7.6, allocationB: 13.1 },
      { securityId: "icici", name: "ICICI Bank", ticker: "ICICIBANK", allocationA: 5.7, allocationB: 8.9 },
      { securityId: "itc", name: "ITC", ticker: "ITC", allocationA: 5.3, allocationB: 3.6 },
      { securityId: "axis", name: "Axis Bank", ticker: "AXISBANK", allocationA: 2.9, allocationB: 3.1 },
    ],
  },
  {
    fundAId: "bandhan",
    fundAName: "Bandhan Small Cap",
    fundBId: "niftybees",
    fundBName: "Nifty 50 BeES",
    overlapScore: 6.8,
    overlappingSecurities: [
      { securityId: "hdfc", name: "HDFC Bank", ticker: "HDFCBANK", allocationA: 2.2, allocationB: 13.1 },
      { securityId: "icici", name: "ICICI Bank", ticker: "ICICIBANK", allocationA: 1.4, allocationB: 8.9 },
      { securityId: "infy", name: "Infosys", ticker: "INFY", allocationA: 1.1, allocationB: 5.6 },
      { securityId: "rel", name: "Reliance Industries", ticker: "RELIANCE", allocationA: 0.9, allocationB: 8.2 },
    ],
  },
];
