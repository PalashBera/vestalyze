"use client";

import { useMemo, useState } from "react";
import { ArrowDownIcon, ArrowLeftRightIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { CopySymbol } from "@/components/copy-symbol";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { DesktopTable, RecordList, RecordListItem } from "@/components/record-list";
import { StatCard } from "@/components/stat-card";
import { StockTradeForm } from "@/components/stock-trade-form";
import { TradeExportActions } from "@/components/trade-export-actions";
import { TruncatedName } from "@/components/truncated-name";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import type { StockTrade, StockTradeMetrics } from "@/lib/api/types";
import { tradeMetrics, tradeTotals } from "@/lib/finance/trades";
import {
  formatDateOnly,
  formatDuration,
  formatMoney,
  formatPrice,
  formatSignedPercent,
} from "@/lib/format";

const OPEN = "—";

type SortKey =
  | "name"
  | "symbol"
  | "buyDate"
  | "buyPrice"
  | "quantity"
  | "sellDate"
  | "sellPrice"
  | "totalPur"
  | "totalSold"
  | "returnAmt"
  | "returnPct"
  | "duration";

type StatusFilter = "all" | "in-progress" | "completed";

function inr(amount: number): string {
  return formatMoney(amount, "INR");
}

function price(amount: number): string {
  return formatPrice(amount, "INR");
}

function toneFor(value?: number): string {
  if (value === undefined || value === 0) {
    return "";
  }
  return value > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";
}

function signedInr(amount?: number): string {
  if (amount === undefined) {
    return OPEN;
  }
  return `${amount > 0 ? "+" : ""}${inr(amount)}`;
}

function returnCell(metrics: StockTradeMetrics) {
  return metrics.returnPercentage === undefined ? OPEN : formatSignedPercent(metrics.returnPercentage);
}

function tradeLabel(trade: { name?: string; symbol: string }): string {
  return trade.name?.trim() || trade.symbol;
}

function sortValue(trade: StockTrade, key: SortKey): string | number | null {
  const metrics = tradeMetrics(trade);
  switch (key) {
    case "name":
      return tradeLabel(trade).toLowerCase();
    case "symbol":
      return trade.symbol.toLowerCase();
    case "buyDate":
      return trade.buyDate;
    case "buyPrice":
      return trade.buyPrice;
    case "quantity":
      return trade.quantity;
    case "sellDate":
      return trade.sellDate ?? null;
    case "sellPrice":
      return trade.sellPrice ?? null;
    case "totalPur":
      return metrics.totalPurchaseAmount;
    case "totalSold":
      return metrics.totalSoldAmount ?? null;
    case "returnAmt":
      return metrics.returnAmount ?? null;
    case "returnPct":
      return metrics.returnPercentage ?? null;
    case "duration":
      return metrics.durationDays;
    default:
      return null;
  }
}

function sortTrades(trades: StockTrade[], key: SortKey, direction: "asc" | "desc"): StockTrade[] {
  return [...trades].sort((left, right) => {
    const a = sortValue(left, key);
    const b = sortValue(right, key);
    if (a === null && b === null) {
      return right.buyDate.localeCompare(left.buyDate);
    }
    if (a === null) {
      return 1;
    }
    if (b === null) {
      return -1;
    }
    const compared =
      typeof a === "string" && typeof b === "string" ? a.localeCompare(b) : Number(a) - Number(b);
    if (compared !== 0) {
      return direction === "asc" ? compared : -compared;
    }
    return right.buyDate.localeCompare(left.buyDate);
  });
}

function SortableHead({
  label,
  hint,
  column,
  active,
  direction,
  align = "left",
  onSort,
}: {
  label: string;
  hint?: string;
  column: SortKey;
  active: SortKey;
  direction: "asc" | "desc";
  align?: "left" | "right";
  onSort: (column: SortKey) => void;
}) {
  const Icon = active === column ? (direction === "asc" ? ArrowUpIcon : ArrowDownIcon) : ArrowUpDownIcon;
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={align === "right" ? "ml-auto h-7 px-1.5" : "h-7 px-1.5"}
      onClick={() => onSort(column)}
    >
      {label}
      <Icon data-icon="inline-end" className="opacity-70" />
    </Button>
  );
  return (
    <TableHead className={align === "right" ? "whitespace-nowrap text-right" : "whitespace-nowrap"}>
      {hint ? (
        <Tooltip>
          <TooltipTrigger render={button} />
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </TableHead>
  );
}

function TradeActions({ trade, onSaved }: { trade: StockTrade; onSaved: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <StockTradeForm trade={trade} onSaved={onSaved} />
      <ConfirmDeleteButton
        title="Delete this trade?"
        description={`This removes the ${trade.symbol} trade bought on ${formatDateOnly(trade.buyDate)} from your journal.`}
        successMessage="Trade deleted"
        errorMessage="Unable to delete the trade"
        onConfirm={async () => {
          await api.trades.remove(trade.id);
          onSaved();
        }}
      />
    </div>
  );
}

function TradeRows({
  trades,
  sortKey,
  direction,
  onSort,
  onSaved,
}: {
  trades: StockTrade[];
  sortKey: SortKey;
  direction: "asc" | "desc";
  onSort: (column: SortKey) => void;
  onSaved: () => void;
}) {
  return (
    <>
      <RecordList>
        {trades.map((trade) => {
          const metrics = tradeMetrics(trade);
          return (
            <RecordListItem
              key={trade.id}
              title={<TruncatedName name={tradeLabel(trade)} />}
              subtitle={
                <span className="flex items-center gap-2">
                  <CopySymbol symbol={trade.symbol} badge={false} />
                  {metrics.isOpen ? <Badge variant="secondary">In progress</Badge> : null}
                </span>
              }
              actions={<TradeActions trade={trade} onSaved={onSaved} />}
              fields={[
                { label: "Bought", value: formatDateOnly(trade.buyDate) },
                { label: "Buy", value: price(trade.buyPrice) },
                { label: "Qty", value: String(trade.quantity) },
                { label: "Sold", value: formatDateOnly(trade.sellDate) },
                {
                  label: "Sell",
                  value: trade.sellPrice === undefined ? OPEN : price(trade.sellPrice),
                },
                { label: "Cost", value: inr(metrics.totalPurchaseAmount) },
                {
                  label: "Proceeds",
                  value: metrics.totalSoldAmount === undefined ? OPEN : inr(metrics.totalSoldAmount),
                },
                {
                  label: "P&L",
                  value: (
                    <span className={toneFor(metrics.returnAmount)}>{signedInr(metrics.returnAmount)}</span>
                  ),
                },
                {
                  label: "Return %",
                  value: <span className={toneFor(metrics.returnPercentage)}>{returnCell(metrics)}</span>,
                },
                {
                  label: "Days",
                  value: metrics.isOpen
                    ? `${formatDuration(metrics.durationDays)} so far`
                    : formatDuration(metrics.durationDays),
                },
              ]}
            />
          );
        })}
      </RecordList>

      <DesktopTable>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Name" column="name" active={sortKey} direction={direction} onSort={onSort} />
              <SortableHead label="Symbol" column="symbol" active={sortKey} direction={direction} onSort={onSort} />
              <SortableHead
                label="Bought"
                hint="Buy date"
                column="buyDate"
                active={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <SortableHead
                label="Buy"
                hint="Buying price"
                column="buyPrice"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Qty"
                hint="Quantity"
                column="quantity"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Sold"
                hint="Sell date"
                column="sellDate"
                active={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <SortableHead
                label="Sell"
                hint="Selling price"
                column="sellPrice"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Cost"
                hint="Total purchase amount"
                column="totalPur"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Proceeds"
                hint="Total sold amount"
                column="totalSold"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="P&L"
                hint="Return amount"
                column="returnAmt"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Ret %"
                hint="Return percentage"
                column="returnPct"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Days"
                hint="Holding period"
                column="duration"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => {
              const metrics = tradeMetrics(trade);
              return (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">
                    <TruncatedName name={tradeLabel(trade)} />
                  </TableCell>
                  <TableCell>
                    <CopySymbol symbol={trade.symbol} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateOnly(trade.buyDate)}</TableCell>
                  <TableCell className="text-right">{price(trade.buyPrice)}</TableCell>
                  <TableCell className="text-right">{trade.quantity}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {metrics.isOpen ? (
                      <Badge variant="outline">In progress</Badge>
                    ) : (
                      formatDateOnly(trade.sellDate)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {trade.sellPrice === undefined ? OPEN : price(trade.sellPrice)}
                  </TableCell>
                  <TableCell className="text-right">{inr(metrics.totalPurchaseAmount)}</TableCell>
                  <TableCell className="text-right">
                    {metrics.totalSoldAmount === undefined ? OPEN : inr(metrics.totalSoldAmount)}
                  </TableCell>
                  <TableCell className={`text-right ${toneFor(metrics.returnAmount)}`}>
                    {signedInr(metrics.returnAmount)}
                  </TableCell>
                  <TableCell className={`text-right ${toneFor(metrics.returnPercentage)}`}>
                    {returnCell(metrics)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                    {metrics.isOpen
                      ? `${formatDuration(metrics.durationDays)} so far`
                      : formatDuration(metrics.durationDays)}
                  </TableCell>
                  <TableCell>
                    <TradeActions trade={trade} onSaved={onSaved} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DesktopTable>
    </>
  );
}

export default function TradesPage() {
  const { data, error, loading, reload } = useAsync(() => api.trades.list());
  const [sortKey, setSortKey] = useState<SortKey>("buyDate");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const trades = data?.trades ?? [];
  const totals = tradeTotals(trades);
  const realisedPercentage = totals.invested > 0 ? (totals.returnAmount / totals.invested) * 100 : 0;

  const sorted = useMemo(() => sortTrades(trades, sortKey, direction), [trades, sortKey, direction]);
  const inProgress = useMemo(() => sorted.filter((trade) => tradeMetrics(trade).isOpen), [sorted]);
  const completed = useMemo(() => sorted.filter((trade) => !tradeMetrics(trade).isOpen), [sorted]);

  function onSort(column: SortKey) {
    if (sortKey === column) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(column);
    setDirection(column === "name" || column === "symbol" ? "asc" : "desc");
  }

  if (loading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load trades</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const tabs: Array<{
    value: StatusFilter;
    label: string;
    rows: StockTrade[];
    emptyTitle: string;
    emptyDescription: string;
  }> = [
    {
      value: "all",
      label: "All",
      rows: sorted,
      emptyTitle: "No trades yet",
      emptyDescription: "Log a buy to start the journal.",
    },
    {
      value: "in-progress",
      label: "In Progress",
      rows: inProgress,
      emptyTitle: "Nothing in progress",
      emptyDescription: "Trades without a sell date and selling price show up here.",
    },
    {
      value: "completed",
      label: "Completed",
      rows: completed,
      emptyTitle: "No completed trades",
      emptyDescription: "Close a trade by filling in the sell date and selling price.",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stock Trades"
        description="A journal of what you bought and sold. Purchase, sale, return, and holding period are worked out for you."
        actions={
          <>
            <TradeExportActions trades={trades} />
            <StockTradeForm onSaved={() => void reload()} />
          </>
        }
      />

      {trades.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRightIcon}
          title="No trades yet"
          description="Log a buy to start the journal. Leave the sale fields empty and the trade stays in progress until you close it."
          action={<StockTradeForm onSaved={() => void reload()} />}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Realised return"
              value={signedInr(totals.returnAmount)}
              hint={`${formatSignedPercent(realisedPercentage)} across ${totals.closed} completed ${totals.closed === 1 ? "trade" : "trades"}`}
              tone={totals.returnAmount > 0 ? "gain" : totals.returnAmount < 0 ? "loss" : "default"}
            />
            <StatCard label="Total purchased" value={inr(totals.invested)} hint="Completed trades only" />
            <StatCard label="Total sold" value={inr(totals.sold)} hint="Completed trades only" />
            <StatCard
              label="In progress"
              value={String(totals.open)}
              hint={totals.open > 0 ? `${inr(totals.openAmount)} still invested` : "Everything is completed"}
            />
          </div>

          <Card>
            <Tabs defaultValue="all" className="gap-0">
              <CardHeader className="border-b">
                <TabsList className="h-auto w-full flex-wrap sm:w-fit">
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="cursor-pointer px-3">
                      {tab.label}
                      <Badge variant="secondary">{tab.rows.length}</Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </CardHeader>
              <CardContent>
                {tabs.map((tab) => (
                  <TabsContent key={tab.value} value={tab.value} className="mt-0">
                    {tab.rows.length === 0 ? (
                      <EmptyState
                        icon={ArrowLeftRightIcon}
                        title={tab.emptyTitle}
                        description={tab.emptyDescription}
                        className="border-0 py-10"
                      />
                    ) : (
                      <TradeRows
                        trades={tab.rows}
                        sortKey={sortKey}
                        direction={direction}
                        onSort={onSort}
                        onSaved={() => void reload()}
                      />
                    )}
                  </TabsContent>
                ))}
              </CardContent>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
}
