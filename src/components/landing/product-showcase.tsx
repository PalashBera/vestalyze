"use client";

import { AllocationChart } from "@/components/allocation-chart";
import { ExposureTable } from "@/components/exposure-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { countryLabel, formatPercent, typeLabel } from "@/lib/format";
import {
  placeholderExposures,
  placeholderInvestments,
  placeholderOverlaps,
  placeholderOverview,
} from "@/lib/placeholder/portfolio";

export function LandingProductShowcase() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <AllocationChart
          title="Market split"
          description="India vs United States in one reporting view"
          data={placeholderOverview.marketAllocation}
        />
        <AllocationChart
          title="Vehicle mix"
          description="Mutual funds, ETFs, and direct stocks"
          data={placeholderOverview.typeAllocation}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Look-through company exposure</CardTitle>
          <CardDescription>
            HDFC Bank, Apple, Reliance, Microsoft, NVIDIA, and more — combined across funds and direct lots.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ExposureTable rows={placeholderExposures} disableLinks />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
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
      <Card>
        <CardHeader>
          <CardTitle>Your book</CardTitle>
          <CardDescription>Funds, ETFs, and stocks with invested amount, units, and last holdings sync.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Invested</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead>Last sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderInvestments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{typeLabel(item.type)}</TableCell>
                  <TableCell>{countryLabel(item.country)}</TableCell>
                  <TableCell className="text-right">{item.invested}</TableCell>
                  <TableCell className="text-right">{item.units}</TableCell>
                  <TableCell>{item.lastSync}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
