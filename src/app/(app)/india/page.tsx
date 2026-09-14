"use client";

import { LandmarkIcon } from "lucide-react";
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

function IndiaBody({ data }: { data: MarketDashboard }) {
  const { moneyNative } = useSettings();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Indian market"
        description="Mutual funds and ETFs with consolidated company exposure."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total India" value={moneyNative(data.totalInvestedNative, "INR")} />
        <StatCard label="Mutual funds" value={moneyNative(data.byType.mutualFund, "INR")} />
        <StatCard label="ETFs" value={moneyNative(data.byType.etf, "INR")} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Consolidated Indian stock exposure</CardTitle>
          <CardDescription>Same company combined across funds and ETFs.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.exposures.length > 0 ? (
            <ExposureTable rows={data.exposures} variant="india" />
          ) : (
            <EmptyState
              title="No stock exposure yet"
              description="Sync a fund URL to unfold Indian companies behind your mutual funds and ETFs."
              href="/investments"
              actionLabel="Open investments"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function IndiaPage() {
  const { data, error, loading } = useAsync(() => api.portfolio.india());

  if (loading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load India dashboard</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (data.totalInvestedNative === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Indian market"
          description="Mutual funds and ETFs with consolidated company exposure."
        />
        <EmptyState
          icon={LandmarkIcon}
          title="No Indian holdings yet"
          description="Add an Indian mutual fund or ETF to see your consolidated exposure for this market."
          href="/onboarding"
          actionLabel="Add an Indian holding"
        />
      </div>
    );
  }

  return <IndiaBody data={data} />;
}
