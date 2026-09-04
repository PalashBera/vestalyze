"use client";

import { use } from "react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useSettings } from "@/components/settings-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { formatPercent, typeLabel } from "@/lib/format";

export default function ExposureDetailPage({
  params,
}: {
  params: Promise<{ securityId: string }>;
}) {
  const { securityId } = use(params);
  const { money, moneyNative } = useSettings();
  const { data, error, loading } = useAsync(() => api.portfolio.exposureDetail(securityId), [securityId]);

  if (loading) {
    return <Skeleton className="h-80" />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Exposure not found</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={data.security.standardizedName}
        description={`${data.security.companyName} · ${data.security.exchange} · ${data.security.sector}`}
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{data.security.ticker}</Badge>
        {data.security.isin ? <Badge variant="outline">{data.security.isin}</Badge> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total exposure" value={money(data.totalInvestedInr)} hint={`${formatPercent(data.portfolioPercentage)} of portfolio`} />
        <StatCard label="Direct" value={money(data.directInvestedInr)} />
        <StatCard label="Funds + ETFs" value={money(data.mutualFundInvestedInr + data.etfInvestedInr)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Source breakdown</CardTitle>
          <CardDescription>How this company exposure is built from each investment.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Allocation</TableHead>
                <TableHead className="text-right">Effective invested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.breakdown.map((item) => (
                <TableRow key={`${item.investmentId}-${item.sourceName}`}>
                  <TableCell>{item.sourceName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{typeLabel(item.sourceType)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.allocationPercentage ? formatPercent(item.allocationPercentage) : "100%"}
                  </TableCell>
                  <TableCell className="text-right">
                    {moneyNative(item.investedExposureNative, item.currency)}
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
