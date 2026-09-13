import type { StockAnalysis, StockTrade, StockTradeMetrics } from "@/lib/api/types";

const DAY_MS = 86_400_000;

/**
 * Date columns arrive as YYYY-MM-DD. Parsing them as UTC midnight keeps day
 * counts stable regardless of the viewer's timezone.
 */
function parseDateOnly(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

function todayUtc(now: Date): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * Purchase, sale, return, and duration for one trade. An open trade has no
 * sale figures, and its duration is how long it has been held so far.
 */
export function tradeMetrics(trade: StockTrade, now = new Date()): StockTradeMetrics {
  const totalPurchaseAmount = trade.buyPrice * trade.quantity;
  const isOpen = trade.sellDate === undefined || trade.sellPrice === undefined;
  const end = isOpen ? todayUtc(now) : parseDateOnly(trade.sellDate!);
  const durationDays = Math.max(0, Math.round((end - parseDateOnly(trade.buyDate)) / DAY_MS));

  if (isOpen) {
    return { totalPurchaseAmount, durationDays, isOpen: true };
  }

  const totalSoldAmount = trade.sellPrice! * trade.quantity;
  const returnAmount = totalSoldAmount - totalPurchaseAmount;
  return {
    totalPurchaseAmount,
    totalSoldAmount,
    returnAmount,
    returnPercentage: (returnAmount / totalPurchaseAmount) * 100,
    durationDays,
    isOpen: false,
  };
}

/** The price the entry has to reach to hit the target return. */
export function targetPrice(entry: Pick<StockAnalysis, "buyPrice" | "targetReturnPercentage">): number {
  return entry.buyPrice * (1 + entry.targetReturnPercentage / 100);
}

/** Totals across the closed trades in a list. Open trades contribute nothing. */
export function tradeTotals(trades: StockTrade[], now = new Date()) {
  return trades.reduce(
    (totals, trade) => {
      const metrics = tradeMetrics(trade, now);
      if (metrics.isOpen) {
        return { ...totals, open: totals.open + 1, openAmount: totals.openAmount + metrics.totalPurchaseAmount };
      }
      return {
        ...totals,
        closed: totals.closed + 1,
        invested: totals.invested + metrics.totalPurchaseAmount,
        sold: totals.sold + (metrics.totalSoldAmount ?? 0),
        returnAmount: totals.returnAmount + (metrics.returnAmount ?? 0),
      };
    },
    { closed: 0, open: 0, invested: 0, sold: 0, returnAmount: 0, openAmount: 0 },
  );
}
