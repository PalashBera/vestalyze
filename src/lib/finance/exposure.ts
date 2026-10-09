import type {
  AllocationSlice,
  Fund,
  FundHolding,
  FundOverlap,
  Investment,
  PortfolioOverview,
  Security,
  StockExposure,
} from "@/lib/api/types";

function emptyExposure(security: Security): StockExposure {
  return {
    security,
    mutualFundInvestedInr: 0,
    etfInvestedInr: 0,
    directInvestedInr: 0,
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
      row.directInvestedInr += investment.investedAmount;
      row.totalInvestedInr += investment.investedAmount;
      row.breakdown.push({
        sourceType: "stock",
        sourceName: investment.name,
        investmentId: investment.id,
        investedExposureInr: investment.investedAmount,
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
      const investedInr = investment.investedAmount * (holding.allocationPercentage / 100);

      if (investment.type === "mutual_fund") {
        row.mutualFundInvestedInr += investedInr;
      } else {
        row.etfInvestedInr += investedInr;
      }

      row.totalInvestedInr += investedInr;
      row.breakdown.push({
        sourceType: investment.type,
        sourceName: fund?.name ?? investment.name,
        investmentId: investment.id,
        allocationPercentage: holding.allocationPercentage,
        investedExposureInr: investedInr,
      });
    }
  }

  const totalPortfolio = investments.reduce((sum, item) => sum + item.investedAmount, 0);

  return [...exposures.values()]
    .map((row) => ({
      ...row,
      portfolioPercentage: totalPortfolio > 0 ? (row.totalInvestedInr / totalPortfolio) * 100 : 0,
    }))
    .sort((a, b) => b.totalInvestedInr - a.totalInvestedInr);
}

function slice(key: string, label: string, amountInr: number, totalInr: number): AllocationSlice {
  return {
    key,
    label,
    amountInr,
    percentage: totalInr > 0 ? (amountInr / totalInr) * 100 : 0,
  };
}

function investedIn(investments: Investment[], type: Investment["type"]): number {
  return investments
    .filter((item) => item.type === type)
    .reduce((sum, item) => sum + item.investedAmount, 0);
}

export function buildOverview(investments: Investment[], exposures: StockExposure[]): PortfolioOverview {
  const totalInvestedInr = investments.reduce((sum, item) => sum + item.investedAmount, 0);
  const mutualFundInvestedInr = investedIn(investments, "mutual_fund");
  const etfInvestedInr = investedIn(investments, "etf");

  return {
    totalInvestedInr,
    mutualFundInvestedInr,
    etfInvestedInr,
    stockInvestedInr: totalInvestedInr - mutualFundInvestedInr - etfInvestedInr,
    typeAllocation: [
      slice("mutual_fund", "Mutual Funds", mutualFundInvestedInr, totalInvestedInr),
      slice("etf", "ETFs", etfInvestedInr, totalInvestedInr),
    ],
    topHoldings: exposures.slice(0, 10),
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
