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

export default function IndiaPage() {
  const { moneyNative } = useSettings();
  const { data, error, loading } = useAsync(() => api.portfolio.india());

  if (loading) {
    return <Skeleton className="h-80" />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load India dashboard</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Indian market"
        description="Mutual funds, ETFs, and direct Indian stocks with consolidated company exposure."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total India" value={moneyNative(data.totalInvestedNative, "INR")} />
        <StatCard label="Mutual funds" value={moneyNative(data.byType.mutualFund, "INR")} />
        <StatCard label="ETFs" value={moneyNative(data.byType.etf, "INR")} />
        <StatCard label="Direct stocks" value={moneyNative(data.byType.stock, "INR")} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Consolidated Indian stock exposure</CardTitle>
          <CardDescription>Same company combined across funds, ETFs, and direct holdings.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ExposureTable rows={data.exposures} variant="india" />
        </CardContent>
      </Card>
    </div>
  );
}
