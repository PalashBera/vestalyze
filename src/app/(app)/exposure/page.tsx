"use client";

import { LayersIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ExposureTable } from "@/components/exposure-table";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import type { StockExposure } from "@/lib/api/types";

function ExposureBody({ rows }: { rows: StockExposure[] }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Consolidated stock exposure"
        description="Look-through holdings from mutual funds and ETFs."
      />
      <Card>
        <CardHeader>
          <CardTitle>All companies</CardTitle>
          <CardDescription>Click a column header to sort. Open a company for the contributing funds.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExposureTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExposurePage() {
  const { data, error, loading } = useAsync(() => api.portfolio.exposure());

  if (loading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load exposure</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (data.exposures.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Consolidated stock exposure"
          description="Look-through holdings from mutual funds and ETFs."
        />
        <EmptyState
          icon={LayersIcon}
          title="No exposure yet"
          description="Add a holding, then sync its fund URL to see every company you own across funds and ETFs."
          href="/investments"
          actionLabel="Open investments"
        />
      </div>
    );
  }

  return <ExposureBody rows={data.exposures} />;
}
