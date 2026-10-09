"use client";

import { LayoutDashboardIcon } from "lucide-react";
import { AllocationChart } from "@/components/allocation-chart";
import { EmptyState } from "@/components/empty-state";
import { ExposureTable } from "@/components/exposure-table";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { StatCard } from "@/components/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import type { PortfolioOverview } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

const DESCRIPTION = "Invested amount and look-through company exposure across your mutual funds and ETFs.";

function DashboardBody({ data }: { data: PortfolioOverview }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Portfolio overview" description={DESCRIPTION} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total invested" value={formatMoney(data.totalInvestedInr)} hint="Mutual funds and ETFs" />
        <StatCard label="Mutual funds" value={formatMoney(data.mutualFundInvestedInr)} />
        <StatCard label="ETFs" value={formatMoney(data.etfInvestedInr)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <AllocationChart title="Investment type" description="Mutual funds and ETFs" data={data.typeAllocation} />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top company exposure</CardTitle>
            <CardDescription>Look-through allocations from mutual funds and ETFs.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topHoldings.length > 0 ? (
              <ExposureTable rows={data.topHoldings} />
            ) : (
              <EmptyState
                title="No company exposure yet"
                description="Sync a fund URL to fill this table with look-through company exposure."
                href="/investments"
                actionLabel="Open investments"
              />
            )}
          </CardContent>
        </Card>
      </div>
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
      <div className="flex flex-col gap-6">
        <PageHeader title="Portfolio overview" description={DESCRIPTION} />
        <EmptyState
          icon={LayoutDashboardIcon}
          title="Nothing here yet"
          description="Add a mutual fund or ETF and your consolidated exposure will appear here."
          href="/onboarding"
          actionLabel="Add your first holding"
        />
      </div>
    );
  }

  return <DashboardBody data={data} />;
}
