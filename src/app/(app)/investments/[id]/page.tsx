"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InvestmentForm, SyncInvestmentButton } from "@/components/investment-form";
import { PageHeader } from "@/components/page-header";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { useSettings } from "@/components/settings-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/page-loader";
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
import type { Currency, ScrapeStatus } from "@/lib/api/types";
import { countryLabel, formatPercent, formatTimestamp, typeLabel } from "@/lib/format";
import { placeholderHoldings, placeholderSyncs } from "@/lib/placeholder/portfolio";

function HoldingsTable({
  rows,
  investedAmount,
  currency,
  moneyNative,
}: {
  rows: Array<{ id: string; name: string; allocationPercentage: number }>;
  investedAmount: number;
  currency: Currency;
  moneyNative: (amount: number, native: Currency) => string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead className="text-right">Allocation</TableHead>
          <TableHead className="text-right">Effective invested</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell className="text-right">{formatPercent(row.allocationPercentage)}</TableCell>
            <TableCell className="text-right">
              {moneyNative(investedAmount * (row.allocationPercentage / 100), currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SyncHistoryTable({
  rows,
}: {
  rows: Array<{
    id: string;
    startedAt: string;
    status: ScrapeStatus;
    recordsProcessed: number;
    errorMessage?: string;
  }>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Started</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Holdings</TableHead>
          <TableHead>Error</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{formatTimestamp(item.startedAt)}</TableCell>
            <TableCell>
              <Badge variant={item.status === "success" ? "secondary" : "outline"}>{item.status}</Badge>
            </TableCell>
            <TableCell className="text-right">{item.recordsProcessed}</TableCell>
            <TableCell className="max-w-xs truncate text-muted-foreground">{item.errorMessage ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { moneyNative } = useSettings();
  const { data, error, loading, reload } = useAsync(() => api.investments.get(id), [id]);

  if (loading && !data) {
    return <PageLoader />;
  }

  if (!data) {
    return (
      <Alert>
        <AlertTitle>Investment not found</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const { investment, holdings, fund, syncs } = data;

  async function remove() {
    try {
      await api.investments.remove(id);
      toast.success("Investment removed");
      router.push("/investments");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete investment");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={investment.name}
        description={`${typeLabel(investment.type)} · ${countryLabel(investment.country)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <InvestmentForm investment={investment} onSaved={() => void reload()} />
            <SyncInvestmentButton investment={investment} onSynced={() => reload()} labeled />
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" />}>Delete</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this investment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes {investment.name} from your book. Fund holdings used by other
                    investments stay in place.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => void remove()}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Invested</CardDescription>
            <CardTitle>{moneyNative(investment.investedAmount, investment.currency)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Units</CardDescription>
            <CardTitle>{investment.units ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Last sync</CardDescription>
            <CardTitle className="text-lg">
              {investment.type === "stock" ? "—" : formatTimestamp(investment.lastSyncedAt)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      {investment.sourceUrl ? (
        <p className="text-sm text-muted-foreground">
          Fund URL:{" "}
          <a className="underline underline-offset-2" href={investment.sourceUrl} target="_blank" rel="noopener noreferrer">
            {investment.sourceUrl}
          </a>
        </p>
      ) : null}
      {investment.type !== "stock" ? (
        <Card>
          <CardHeader>
            <CardTitle>Underlying holdings</CardTitle>
            <CardDescription>
              Stock split scraped from the fund URL
              {fund?.latestPortfolioDate ? ` · portfolio ${fund.latestPortfolioDate}` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {holdings.length > 0 ? (
              <HoldingsTable
                rows={holdings.map((holding) => ({
                  id: holding.id,
                  name: holding.security?.standardizedName ?? holding.securityId,
                  allocationPercentage: holding.allocationPercentage,
                }))}
                investedAmount={investment.investedAmount}
                currency={investment.currency}
                moneyNative={moneyNative}
              />
            ) : (
              <PlaceholderPreview
                title="No holdings yet"
                description="Sync this investment to scrape the stock split from the fund URL."
                hideAction
              >
                <HoldingsTable
                  rows={placeholderHoldings}
                  investedAmount={investment.investedAmount || 100000}
                  currency={investment.currency}
                  moneyNative={moneyNative}
                />
              </PlaceholderPreview>
            )}
          </CardContent>
        </Card>
      ) : null}
      {investment.type !== "stock" ? (
        <Card>
          <CardHeader>
            <CardTitle>Sync history</CardTitle>
            <CardDescription>When each scrape started and how many stocks were stored.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {syncs.length > 0 ? (
              <SyncHistoryTable rows={syncs} />
            ) : (
              <PlaceholderPreview
                title="No syncs yet"
                description="Sync this investment to scrape the stock split and record it here."
                hideAction
              >
                <SyncHistoryTable rows={placeholderSyncs} />
              </PlaceholderPreview>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
