import type { StockAnalysis } from "@/lib/api/types";
import { analysisIsOpen, sellTargetPrice, stopLossPrice, targetPrice } from "@/lib/finance/trades";
import { tradeCsvForDownload } from "@/lib/finance/trade-csv";

const HEADERS = [
  "Symbol",
  "Buy Date",
  "Buying Price",
  "Target Return %",
  "Target Price",
  "Stop Loss",
  "Sell Target",
  "Exited Date",
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

export function buildAnalysisCsv(
  entries: StockAnalysis[],
  targets: { profit?: number; loss?: number } = {},
): string {
  const rows = [...entries]
    .sort((left, right) => right.buyDate.localeCompare(left.buyDate) || right.createdAt.localeCompare(left.createdAt))
    .map((entry) => {
      const open = analysisIsOpen(entry);
      return [
        csvField(entry.symbol),
        csvField(entry.buyDate),
        csvField(money(entry.buyPrice)),
        csvField(`${entry.targetReturnPercentage.toFixed(2)}%`),
        csvField(money(targetPrice(entry))),
        csvField(targets.loss === undefined ? "" : money(stopLossPrice(entry, targets.loss))),
        csvField(targets.profit === undefined ? "" : money(sellTargetPrice(entry, targets.profit))),
        csvField(entry.exitedDate),
        csvField(open ? "In Progress" : "Exited"),
      ].join(",");
    });

  return [HEADERS.join(","), ...rows].join("\r\n") + "\r\n";
}

export function analysisCsvFilename(now = new Date()): string {
  return `vestalyze-stock-analysis-${now.toISOString().slice(0, 10)}.csv`;
}

export { tradeCsvForDownload as analysisCsvForDownload };
