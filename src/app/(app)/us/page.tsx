"use client";

import { ExposureTable } from "@/components/exposure-table";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useSettings } from "@/components/settings-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";

export default function UsPage() {
  const { moneyNative } = useSettings();
  const { data, error, loading } = useAsync(() => api.portfolio.us());

  if (loading) {
    return <Skeleton className="h-80" />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load US dashboard</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="US market"
        description="Direct US stocks and ETF look-through exposure in US dollars."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total US" value={moneyNative(data.totalInvestedNative, "USD")} />
        <StatCard label="US ETFs" value={moneyNative(data.byType.etf, "USD")} />
        <StatCard label="Direct stocks" value={moneyNative(data.byType.stock, "USD")} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Consolidated US stock exposure</CardTitle>
          <CardDescription>Direct holdings plus ETF look-through allocations.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ExposureTable rows={data.exposures} variant="us" />
        </CardContent>
      </Card>
    </div>
  );
}
