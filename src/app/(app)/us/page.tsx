"use client";

import { ExposureTable } from "@/components/exposure-table";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { StatCard } from "@/components/stat-card";
import { useSettings } from "@/components/settings-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import type { MarketDashboard } from "@/lib/api/types";
import { toUsd } from "@/lib/finance/currency";
import { placeholderExposures, placeholderOverview } from "@/lib/placeholder/portfolio";

const placeholderUs: MarketDashboard = {
  country: "US",
  totalInvestedNative: toUsd(placeholderOverview.usInvestedInr, "INR"),
  currency: "USD",
  byType: { mutualFund: 0, etf: 2800, stock: 2750 },
  exposures: placeholderExposures.filter((item) => item.usInvestedInr > 0),
};

function UsBody({
  data,
  preview = false,
  emptyExposure = false,
}: {
  data: MarketDashboard;
  preview?: boolean;
  emptyExposure?: boolean;
}) {
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
        <CardContent className="overflow-x-auto">
          {emptyExposure ? (
            <PlaceholderPreview
              title="No stock exposure yet"
              description="Add a US stock or sync a US ETF URL to fill look-through company exposure."
              href="/onboarding?country=US"
              actionLabel="Add a US holding"
            >
              <ExposureTable rows={placeholderUs.exposures} variant="us" disableLinks />
            </PlaceholderPreview>
          ) : (
            <ExposureTable rows={data.exposures} variant="us" disableLinks={preview} />
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
      <PlaceholderPreview href="/onboarding?country=US">
        <UsBody data={placeholderUs} preview />
      </PlaceholderPreview>
    );
  }

  if (data.exposures.length === 0) {
    return <UsBody data={data} emptyExposure />;
  }

  return <UsBody data={data} />;
}
