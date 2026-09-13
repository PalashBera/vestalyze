"use client";

import { ChartPieIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExposureTable } from "@/components/exposure-table";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { StatCard } from "@/components/stat-card";
import { useSettings } from "@/components/settings-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import type { MarketDashboard } from "@/lib/api/types";

function UsBody({ data }: { data: MarketDashboard }) {
  const { moneyNative } = useSettings();
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
        <CardContent>
          {data.exposures.length > 0 ? (
            <ExposureTable rows={data.exposures} variant="us" />
          ) : (
            <EmptyState
              title="No stock exposure yet"
              description="Add a US stock or sync a US ETF URL to fill look-through company exposure."
              href="/onboarding?country=US"
              actionLabel="Add a US holding"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsPage() {
  const { data, error, loading } = useAsync(() => api.portfolio.us());

  if (loading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load US dashboard</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (data.totalInvestedNative === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="US market"
          description="Direct US stocks and ETF look-through exposure in US dollars."
        />
        <EmptyState
          icon={ChartPieIcon}
          title="No US holdings yet"
          description="Add a US stock or ETF to see your consolidated exposure for this market."
          href="/onboarding?country=US"
          actionLabel="Add a US holding"
        />
      </div>
    );
  }

  return <UsBody data={data} />;
}
