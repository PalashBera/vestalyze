"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { useSettings } from "@/components/settings-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { countryLabel, formatPercent, typeLabel } from "@/lib/format";

export default function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { moneyNative } = useSettings();
  const { data, error, loading } = useAsync(() => api.investments.get(id), [id]);

  if (loading) {
    return <Skeleton className="h-80" />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Investment not found</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const { investment, holdings, transactions, fund } = data;

  async function remove() {
    await api.investments.remove(id);
    toast.success("Investment removed");
    router.push("/investments");
  }

  async function refresh() {
    if (!investment.fundId) {
      return;
    }
    await api.catalog.refreshFund(investment.fundId);
    toast.success("Holdings refresh queued");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={investment.name}
        description={`${typeLabel(investment.type)} · ${countryLabel(investment.country)}`}
        actions={
          <div className="flex gap-2">
            {investment.fundId ? (
              <Button variant="outline" onClick={() => void refresh()}>
                Refresh holdings
              </Button>
            ) : null}
            <Button variant="destructive" onClick={() => void remove()}>
              Delete
            </Button>
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
            <CardDescription>Current value</CardDescription>
            <CardTitle>{moneyNative(investment.currentValue, investment.currency)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Portfolio date</CardDescription>
            <CardTitle>{fund?.latestPortfolioDate ?? "Direct holding"}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      {holdings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Underlying holdings</CardTitle>
            <CardDescription>Public allocation percentages used for look-through exposure.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Ticker</TableHead>
                  <TableHead className="text-right">Allocation</TableHead>
                  <TableHead className="text-right">Effective invested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((holding) => (
                  <TableRow key={holding.id}>
                    <TableCell>{holding.security?.standardizedName ?? holding.securityId}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{holding.security?.ticker}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(holding.allocationPercentage)}</TableCell>
                    <TableCell className="text-right">
                      {moneyNative(
                        investment.investedAmount * (holding.allocationPercentage / 100),
                        investment.currency,
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Purchase lots used for invested amount tracking.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.transactionDate}</TableCell>
                  <TableCell className="text-right">{item.units ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {moneyNative(item.investedAmount, investment.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
