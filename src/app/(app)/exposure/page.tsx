"use client";

import { ExposureTable } from "@/components/exposure-table";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";

export default function ExposurePage() {
  const { data, error, loading } = useAsync(() => api.portfolio.exposure());

  if (loading) {
    return <Skeleton className="h-80" />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load exposure</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Consolidated stock exposure"
        description="Direct stock investments combined with look-through holdings from mutual funds and ETFs."
      />
      <Card>
        <CardHeader>
          <CardTitle>All companies</CardTitle>
          <CardDescription>Click a company to see the funds and ETFs contributing to that exposure.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ExposureTable rows={data.exposures} />
        </CardContent>
      </Card>
    </div>
  );
}
