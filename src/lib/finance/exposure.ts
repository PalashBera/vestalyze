import type {
  AllocationSlice,
  Country,
  Fund,
  FundHolding,
  FundOverlap,
  Investment,
  MarketDashboard,
  PortfolioOverview,
  Security,
  StockExposure,
} from "@/lib/api/types";
import { getFxRate, toInr, toUsd } from "@/lib/finance/currency";

function emptyExposure(security: Security): StockExposure {
  return {
    security,
    mutualFundInvestedInr: 0,
    etfInvestedInr: 0,
    directInvestedInr: 0,
    indiaInvestedInr: 0,
    usInvestedInr: 0,
    totalInvestedInr: 0,
    portfolioPercentage: 0,
    breakdown: [],
  };
}

export function calculateExposures(
  investments: Investment[],
  holdings: FundHolding[],
  securities: Security[],
  funds: Fund[],
  usdInr?: number,
): StockExposure[] {
  const securityMap = new Map(securities.map((item) => [item.id, item]));
  const fundMap = new Map(funds.map((item) => [item.id, item]));
  const holdingsByFund = new Map<string, FundHolding[]>();

  for (const holding of holdings) {
    const list = holdingsByFund.get(holding.fundId) ?? [];
    list.push(holding);
    holdingsByFund.set(holding.fundId, list);
  }

  const exposures = new Map<string, StockExposure>();

  function getOrCreate(securityId: string): StockExposure | null {
    const existing = exposures.get(securityId);
    if (existing) {
      return existing;
    }
    const security = securityMap.get(securityId);
    if (!security) {
      return null;
    }
    const created = emptyExposure(security);
    exposures.set(securityId, created);
    return created;
  }

  for (const investment of investments) {
    if (investment.type === "stock" && investment.securityId) {
      const row = getOrCreate(investment.securityId);
      if (!row) {
        continue;
      }
      const investedInr = toInr(investment.investedAmount, investment.currency, usdInr);
      row.directInvestedInr += investedInr;
      if (investment.country === "IN") {
        row.indiaInvestedInr += investedInr;
      } else {
        row.usInvestedInr += investedInr;
      }
      row.totalInvestedInr += investedInr;
      row.breakdown.push({
        sourceType: "stock",
        sourceName: investment.name,
        investmentId: investment.id,
        country: investment.country,
        currency: investment.currency,
        investedExposureNative: investment.investedAmount,
        investedExposureInr: investedInr,
      });
      continue;
    }

    if (!investment.fundId) {
      continue;
    }

    const fundHoldings = holdingsByFund.get(investment.fundId) ?? [];
    const fund = fundMap.get(investment.fundId);

    for (const holding of fundHoldings) {
      const row = getOrCreate(holding.securityId);
      if (!row) {
        continue;
      }
      const weight = holding.allocationPercentage / 100;
      const investedNative = investment.investedAmount * weight;
      const investedInr = toInr(investedNative, investment.currency, usdInr);

      if (investment.type === "mutual_fund") {
        row.mutualFundInvestedInr += investedInr;
      } else {
        row.etfInvestedInr += investedInr;
      }

      if (row.security.country === "IN") {
        row.indiaInvestedInr += investedInr;
      } else {
        row.usInvestedInr += investedInr;
      }

      row.totalInvestedInr += investedInr;
      row.breakdown.push({
        sourceType: investment.type,
        sourceName: fund?.name ?? investment.name,
        investmentId: investment.id,
        country: investment.country,
        currency: investment.currency,
        allocationPercentage: holding.allocationPercentage,
        investedExposureNative: investedNative,
        investedExposureInr: investedInr,
      });
    }
  }

  const totalPortfolio = investments.reduce(
    (sum, item) => sum + toInr(item.investedAmount, item.currency, usdInr),
    0,
  );

  return [...exposures.values()]
    .map((row) => ({
      ...row,
      portfolioPercentage: totalPortfolio > 0 ? (row.totalInvestedInr / totalPortfolio) * 100 : 0,
    }))
    .sort((a, b) => b.totalInvestedInr - a.totalInvestedInr);
}

function slice(
  key: string,
  label: string,
  amountInr: number,
  totalInr: number,
  usdInr?: number,
): AllocationSlice {
  return {
    key,
    label,
    amountInr,
    amountUsd: toUsd(amountInr, "INR", usdInr),
    percentage: totalInr > 0 ? (amountInr / totalInr) * 100 : 0,
  };
}

export function buildOverview(
  investments: Investment[],
  exposures: StockExposure[],
  fx = getFxRate(),
): PortfolioOverview {
  const usdInr = fx.rate;
  const totalInvestedInr = investments.reduce(
    (sum, item) => sum + toInr(item.investedAmount, item.currency, usdInr),
    0,
  );
  const indiaInvestedInr = investments
    .filter((item) => item.country === "IN")
    .reduce((sum, item) => sum + toInr(item.investedAmount, item.currency, usdInr), 0);
  const usInvestedInr = totalInvestedInr - indiaInvestedInr;
  const mutualFundInvestedInr = investments
    .filter((item) => item.type === "mutual_fund")
    .reduce((sum, item) => sum + toInr(item.investedAmount, item.currency, usdInr), 0);
  const etfInvestedInr = investments
    .filter((item) => item.type === "etf")
    .reduce((sum, item) => sum + toInr(item.investedAmount, item.currency, usdInr), 0);
  const stockInvestedInr = totalInvestedInr - mutualFundInvestedInr - etfInvestedInr;

  return {
    totalInvestedInr,
    indiaInvestedInr,
    usInvestedInr,
    mutualFundInvestedInr,
    etfInvestedInr,
    stockInvestedInr,
    fxRate: fx,
    marketAllocation: [
      slice("IN", "India", indiaInvestedInr, totalInvestedInr, usdInr),
      slice("US", "United States", usInvestedInr, totalInvestedInr, usdInr),
    ],
    typeAllocation: [
      slice("mutual_fund", "Mutual Funds", mutualFundInvestedInr, totalInvestedInr, usdInr),
      slice("etf", "ETFs", etfInvestedInr, totalInvestedInr, usdInr),
      slice("stock", "Direct Stocks", stockInvestedInr, totalInvestedInr, usdInr),
    ],
    topHoldings: exposures.slice(0, 10),
  };
}

export function buildMarketDashboard(
  country: Country,
  investments: Investment[],
  exposures: StockExposure[],
  usdInr?: number,
): MarketDashboard {
  const filtered = investments.filter((item) => item.country === country);
  const currency = country === "IN" ? "INR" : "USD";
  const totalInvestedNative = filtered.reduce((sum, item) => {
    return sum + (currency === item.currency ? item.investedAmount : toUsd(item.investedAmount, item.currency, usdInr));
  }, 0);

  const byType = {
    mutualFund: filtered
      .filter((item) => item.type === "mutual_fund")
      .reduce((sum, item) => sum + item.investedAmount, 0),
    etf: filtered
      .filter((item) => item.type === "etf")
      .reduce((sum, item) => sum + item.investedAmount, 0),
    stock: filtered
      .filter((item) => item.type === "stock")
      .reduce((sum, item) => sum + item.investedAmount, 0),
  };

  return {
    country,
    totalInvestedNative,
    currency,
    byType,
    exposures: exposures.filter((item) =>
      country === "IN" ? item.indiaInvestedInr > 0 : item.usInvestedInr > 0,
    ),
  };
}

export function buildOverlaps(investments: Investment[], holdings: FundHolding[], funds: Fund[]): FundOverlap[] {
  const heldFundIds = [...new Set(investments.map((item) => item.fundId).filter(Boolean))] as string[];
  const overlaps: FundOverlap[] = [];

  for (let i = 0; i < heldFundIds.length; i += 1) {
    for (let j = i + 1; j < heldFundIds.length; j += 1) {
      const fundAId = heldFundIds[i];
      const fundBId = heldFundIds[j];
      const aHoldings = holdings.filter((item) => item.fundId === fundAId);
      const bHoldings = holdings.filter((item) => item.fundId === fundBId);
      const bMap = new Map(bHoldings.map((item) => [item.securityId, item]));
      const overlappingSecurities = aHoldings
        .filter((item) => bMap.has(item.securityId))
        .map((item) => {
          const match = bMap.get(item.securityId);
          return {
            securityId: item.securityId,
            name: item.securityId,
            ticker: item.securityId,
            allocationA: item.allocationPercentage,
            allocationB: match?.allocationPercentage ?? 0,
          };
        });

      if (overlappingSecurities.length === 0) {
        continue;
      }

      const overlapScore = overlappingSecurities.reduce(
        (sum, item) => sum + Math.min(item.allocationA, item.allocationB),
        0,
      );

      overlaps.push({
        fundAId,
        fundAName: funds.find((item) => item.id === fundAId)?.name ?? fundAId,
        fundBId,
        fundBName: funds.find((item) => item.id === fundBId)?.name ?? fundBId,
        overlappingSecurities,
        overlapScore,
      });
    }
  }

  return overlaps.sort((a, b) => b.overlapScore - a.overlapScore);
}
