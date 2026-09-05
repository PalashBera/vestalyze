"use client";

import { ExposureTable } from "@/components/exposure-table";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import type { StockExposure } from "@/lib/api/types";
import { placeholderExposures } from "@/lib/placeholder/portfolio";

function ExposureBody({ rows, preview = false }: { rows: StockExposure[]; preview?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Consolidated stock exposure"
        description="Direct stock investments combined with look-through holdings from mutual funds and ETFs."
      />
      <Card>
        <CardHeader>
          <CardTitle>All companies</CardTitle>
          <CardDescription>Click a column header to sort. Open a company for the contributing funds.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ExposureTable rows={rows} disableLinks={preview} />
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
      <PlaceholderPreview>
        <ExposureBody rows={placeholderExposures} preview />
      </PlaceholderPreview>
    );
  }

  return <ExposureBody rows={data.exposures} />;
}
