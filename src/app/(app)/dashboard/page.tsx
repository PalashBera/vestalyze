"use client";

import { AllocationChart } from "@/components/allocation-chart";
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
import type { PortfolioOverview } from "@/lib/api/types";
import { placeholderExposures, placeholderOverview } from "@/lib/placeholder/portfolio";

function DashboardBody({ data, preview = false }: { data: PortfolioOverview; preview?: boolean }) {
  const { money } = useSettings();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Portfolio overview"
        description="Consolidated invested amount and look-through exposure across India and the US."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total invested" value={money(data.totalInvestedInr)} hint="All markets, all vehicles" />
        <StatCard label="India" value={money(data.indiaInvestedInr)} />
        <StatCard label="United States" value={money(data.usInvestedInr)} />
        <StatCard label="FX rate" value={`${data.fxRate.rate.toFixed(2)} INR / USD`} hint={data.fxRate.asOf} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AllocationChart title="Market split" description="India vs United States" data={data.marketAllocation} />
        <AllocationChart title="Investment type" description="Mutual funds, ETFs, and stocks" data={data.typeAllocation} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Top company exposure</CardTitle>
          <CardDescription>
            Direct holdings plus look-through allocations from mutual funds and ETFs.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {preview || data.topHoldings.length > 0 ? (
            <ExposureTable rows={data.topHoldings} disableLinks={preview} />
          ) : (
            <PlaceholderPreview
              title="This is a preview"
              description="Sync a fund URL to fill this table with look-through company exposure."
              href="/investments"
              actionLabel="Open investments"
            >
              <ExposureTable rows={placeholderExposures} disableLinks />
            </PlaceholderPreview>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { data, error, loading } = useAsync(() => api.portfolio.overview());

  if (loading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load portfolio</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (data.totalInvestedInr === 0) {
    return (
      <PlaceholderPreview>
        <DashboardBody data={placeholderOverview} preview />
      </PlaceholderPreview>
    );
  }

  return <DashboardBody data={data} />;
}
