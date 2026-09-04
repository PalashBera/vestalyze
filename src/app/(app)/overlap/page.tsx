"use client";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import { formatPercent } from "@/lib/format";

export default function OverlapPage() {
  const { data, error, loading } = useAsync(() => api.portfolio.overlap());

  if (loading) {
    return <Skeleton className="h-80" />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load overlap</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fund overlap"
        description="Shared underlying stocks between the mutual funds and ETFs you hold."
      />
      {data.overlaps.map((overlap) => (
        <Card key={`${overlap.fundAId}-${overlap.fundBId}`}>
          <CardHeader>
            <CardTitle>
              {overlap.fundAName} × {overlap.fundBName}
            </CardTitle>
            <CardDescription>Overlap score {formatPercent(overlap.overlapScore)}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Fund A</TableHead>
                  <TableHead className="text-right">Fund B</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overlap.overlappingSecurities.map((item) => (
                  <TableRow key={item.securityId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        <Badge variant="secondary">{item.ticker}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(item.allocationA)}</TableCell>
                    <TableCell className="text-right">{formatPercent(item.allocationB)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
