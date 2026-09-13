"use client";

import { ArrowLeftRightIcon } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { DesktopTable, RecordList, RecordListItem } from "@/components/record-list";
import { StatCard } from "@/components/stat-card";
import { StockTradeForm } from "@/components/stock-trade-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import type { StockTradeMetrics } from "@/lib/api/types";
import { tradeMetrics, tradeTotals } from "@/lib/finance/trades";
import {
  formatDateOnly,
  formatDuration,
  formatMoney,
  formatPrice,
  formatSignedPercent,
} from "@/lib/format";

const OPEN = "—";

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

export default function TradesPage() {
  const { data, error, loading, reload } = useAsync(() => api.trades.list());

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

  const trades = data.trades;
  const totals = tradeTotals(trades);
  const realisedPercentage = totals.invested > 0 ? (totals.returnAmount / totals.invested) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stock Trades"
        description="A journal of what you bought and sold. Purchase, sale, return, and holding period are worked out for you."
        actions={<StockTradeForm onSaved={() => void reload()} />}
      />

      {trades.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRightIcon}
          title="No trades yet"
          description="Log a buy to start the journal. Leave the sale fields empty and the trade stays open until you close it."
          action={<StockTradeForm onSaved={() => void reload()} />}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Realised return"
              value={signedInr(totals.returnAmount)}
              hint={`${formatSignedPercent(realisedPercentage)} across ${totals.closed} closed ${totals.closed === 1 ? "trade" : "trades"}`}
              tone={totals.returnAmount > 0 ? "gain" : totals.returnAmount < 0 ? "loss" : "default"}
            />
            <StatCard label="Total purchased" value={inr(totals.invested)} hint="Closed trades only" />
            <StatCard label="Total sold" value={inr(totals.sold)} hint="Closed trades only" />
            <StatCard
              label="Open positions"
              value={String(totals.open)}
              hint={totals.open > 0 ? `${inr(totals.openAmount)} still invested` : "Everything is closed"}
            />
          </div>

          <Card>
            <CardContent className="pt-6">
              <RecordList>
                {trades.map((trade) => {
                  const metrics = tradeMetrics(trade);
                  return (
                    <RecordListItem
                      key={trade.id}
                      title={trade.name}
                      subtitle={
                        <span className="flex items-center gap-2">
                          {trade.symbol}
                          {metrics.isOpen ? <Badge variant="secondary">Open</Badge> : null}
                        </span>
                      }
                      actions={
                        <div className="flex gap-1">
                          <StockTradeForm trade={trade} onSaved={() => void reload()} />
                          <ConfirmDeleteButton
                            title="Delete this trade?"
                            description={`This removes the ${trade.symbol} trade bought on ${formatDateOnly(trade.buyDate)} from your journal.`}
                            successMessage="Trade deleted"
                            errorMessage="Unable to delete the trade"
                            onConfirm={async () => {
                              await api.trades.remove(trade.id);
                              await reload();
                            }}
                          />
                        </div>
                      }
                      fields={[
                        { label: "Buy date", value: formatDateOnly(trade.buyDate) },
                        { label: "Buying price", value: price(trade.buyPrice) },
                        { label: "Quantity", value: String(trade.quantity) },
                        { label: "Sell date", value: formatDateOnly(trade.sellDate) },
                        {
                          label: "Selling price",
                          value: trade.sellPrice === undefined ? OPEN : price(trade.sellPrice),
                        },
                        { label: "Total pur amt", value: inr(metrics.totalPurchaseAmount) },
                        {
                          label: "Total sold amt",
                          value: metrics.totalSoldAmount === undefined ? OPEN : inr(metrics.totalSoldAmount),
                        },
                        {
                          label: "Return amt",
                          value: (
                            <span className={toneFor(metrics.returnAmount)}>
                              {signedInr(metrics.returnAmount)}
                            </span>
                          ),
                        },
                        {
                          label: "Return",
                          value: (
                            <span className={toneFor(metrics.returnPercentage)}>{returnCell(metrics)}</span>
                          ),
                        },
                        {
                          label: "Duration",
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Buy date</TableHead>
                        <TableHead className="text-right">Buying price</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Sell date</TableHead>
                        <TableHead className="text-right">Selling price</TableHead>
                        <TableHead className="text-right">Total pur amt</TableHead>
                        <TableHead className="text-right">Total sold amt</TableHead>
                        <TableHead className="text-right">Return amt</TableHead>
                        <TableHead className="text-right">Return</TableHead>
                        <TableHead className="text-right">Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => {
                        const metrics = tradeMetrics(trade);
                        return (
                          <TableRow key={trade.id}>
                            <TableCell className="font-medium">{trade.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{trade.symbol}</Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatDateOnly(trade.buyDate)}
                            </TableCell>
                            <TableCell className="text-right">{price(trade.buyPrice)}</TableCell>
                            <TableCell className="text-right">{trade.quantity}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {metrics.isOpen ? (
                                <Badge variant="outline">Open</Badge>
                              ) : (
                                formatDateOnly(trade.sellDate)
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {trade.sellPrice === undefined ? OPEN : price(trade.sellPrice)}
                            </TableCell>
                            <TableCell className="text-right">
                              {inr(metrics.totalPurchaseAmount)}
                            </TableCell>
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
                              <div className="flex justify-end gap-1">
                                <StockTradeForm trade={trade} onSaved={() => void reload()} />
                                <ConfirmDeleteButton
                                  title="Delete this trade?"
                                  description={`This removes the ${trade.symbol} trade bought on ${formatDateOnly(trade.buyDate)} from your journal.`}
                                  successMessage="Trade deleted"
                                  errorMessage="Unable to delete the trade"
                                  onConfirm={async () => {
                                    await api.trades.remove(trade.id);
                                    await reload();
                                  }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </DesktopTable>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
