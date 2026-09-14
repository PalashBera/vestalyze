import type { StockTrade } from "@/lib/api/types";
import { tradeMetrics } from "@/lib/finance/trades";

const HEADERS = [
  "Name",
  "Symbol",
  "Buy Date",
  "Buying Price",
  "Quantity",
  "Sell Date",
  "Selling Price",
  "Total Pur Amt",
  "Total Sold Amt",
  "Return Amt",
  "Return",
  "Duration",
  "Status",
] as const;

function csvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function money(value: number | undefined): string {
  if (value === undefined) {
    return "";
  }
  return value.toFixed(2);
}

/**
 * Spreadsheet of the trade journal, including derived totals. Open trades leave
 * the sale columns blank. Buy date descending so the newest purchases come first.
 */
export function buildTradeCsv(trades: StockTrade[], now = new Date()): string {
  const rows = [...trades]
    .sort((left, right) => right.buyDate.localeCompare(left.buyDate) || right.createdAt.localeCompare(left.createdAt))
    .map((trade) => {
      const metrics = tradeMetrics(trade, now);
      return [
        csvField(trade.name?.trim() || trade.symbol),
        csvField(trade.symbol),
        csvField(trade.buyDate),
        csvField(money(trade.buyPrice)),
        csvField(trade.quantity),
        csvField(trade.sellDate),
        csvField(money(trade.sellPrice)),
        csvField(money(metrics.totalPurchaseAmount)),
        csvField(money(metrics.totalSoldAmount)),
        csvField(money(metrics.returnAmount)),
        csvField(metrics.returnPercentage === undefined ? "" : `${metrics.returnPercentage.toFixed(2)}%`),
        csvField(metrics.durationDays),
        csvField(metrics.isOpen ? "In Progress" : "Completed"),
      ].join(",");
    });

  return [HEADERS.join(","), ...rows].join("\r\n") + "\r\n";
}

export function tradeCsvFilename(now = new Date()): string {
  return `vestalyze-stock-trades-${now.toISOString().slice(0, 10)}.csv`;
}

/** Excel treats a leading BOM as UTF-8. Harmless in every other reader. */
export function tradeCsvForDownload(csv: string): Blob {
  return new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
}
