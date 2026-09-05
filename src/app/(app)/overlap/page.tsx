"use client";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/page-loader";
import { PlaceholderPreview } from "@/components/placeholder-preview";
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
import { placeholderOverlaps } from "@/lib/placeholder/portfolio";

export default function OverlapPage() {
  const { data, error, loading } = useAsync(() => api.portfolio.overlap());

  if (loading) {
    return <PageLoader />;
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
      {data.overlaps.length === 0 ? (
        <PlaceholderPreview description="Add at least two funds or ETFs with shared holdings to see overlap. Sample pairs below.">
          <div className="flex flex-col gap-4">
            {placeholderOverlaps.map((overlap) => (
              <Card key={`${overlap.fundAId}-${overlap.fundBId}`}>
                <CardHeader>
                  <CardTitle>
                    {overlap.fundAName} × {overlap.fundBName}
                  </CardTitle>
                  <CardDescription>Overlap score {formatPercent(overlap.overlapScore)}</CardDescription>
                </CardHeader>
                <CardContent>
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
                          <TableCell>{item.name}</TableCell>
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
        </PlaceholderPreview>
      ) : null}
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
                    <TableCell>{item.name}</TableCell>
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
