"use client";

import { AllocationChart } from "@/components/allocation-chart";
import { ExposureTable } from "@/components/exposure-table";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useSettings } from "@/components/settings-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import { formatSignedPercent } from "@/lib/format";

export default function DashboardPage() {
  const { money } = useSettings();
  const { data, error, loading } = useAsync(() => api.portfolio.overview());

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load portfolio</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Portfolio overview"
        description="Consolidated invested amount, current value, and look-through exposure across India and the US."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total invested" value={money(data.totalInvestedInr)} hint="All markets, all vehicles" />
        <StatCard label="Current value" value={money(data.totalCurrentInr)} />
        <StatCard
          label="Profit / loss"
          value={money(data.profitLossInr)}
          hint={formatSignedPercent(data.returnPercentage)}
          tone={data.profitLossInr >= 0 ? "gain" : "loss"}
        />
        <StatCard
          label="Overall return"
          value={formatSignedPercent(data.returnPercentage)}
          hint={`FX ${data.fxRate.rate.toFixed(2)} INR / USD`}
          tone={data.returnPercentage >= 0 ? "gain" : "loss"}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <AllocationChart title="Market split" description="India vs United States" data={data.marketAllocation} />
        <AllocationChart title="Investment type" description="Mutual funds, ETFs, and stocks" data={data.typeAllocation} />
        <AllocationChart title="Sector allocation" description="Look-through sector exposure" data={data.sectorAllocation} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Top company exposure</CardTitle>
          <CardDescription>
            Direct holdings plus look-through allocations from mutual funds and ETFs.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ExposureTable rows={data.topHoldings} />
        </CardContent>
      </Card>
    </div>
  );
}
