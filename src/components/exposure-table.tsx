"use client";

import Link from "next/link";
import type { StockExposure } from "@/lib/api/types";
import { useSettings } from "@/components/settings-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercent } from "@/lib/format";

export function ExposureTable({
  rows,
  variant = "consolidated",
}: {
  rows: StockExposure[];
  variant?: "consolidated" | "india" | "us";
}) {
  const { money } = useSettings();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          {variant === "consolidated" ? (
            <>
              <TableHead className="text-right">India</TableHead>
              <TableHead className="text-right">US</TableHead>
              <TableHead className="hidden text-right md:table-cell">Funds</TableHead>
              <TableHead className="hidden text-right md:table-cell">ETFs</TableHead>
              <TableHead className="hidden text-right md:table-cell">Direct</TableHead>
            </>
          ) : variant === "india" ? (
            <>
              <TableHead className="text-right">Mutual Funds</TableHead>
              <TableHead className="text-right">ETFs</TableHead>
              <TableHead className="text-right">Direct</TableHead>
            </>
          ) : (
            <>
              <TableHead className="text-right">Direct</TableHead>
              <TableHead className="text-right">ETF</TableHead>
            </>
          )}
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Weight</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.security.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Button
                  variant="link"
                  nativeButton={false}
                  render={<Link href={`/exposure/${row.security.id}`} />}
                  className="h-auto justify-start px-0"
                >
                  {row.security.standardizedName}
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{row.security.ticker}</Badge>
                  <span className="text-xs text-muted-foreground">{row.security.sector}</span>
                </div>
              </div>
            </TableCell>
            {variant === "consolidated" ? (
              <>
                <TableCell className="text-right">{money(row.indiaInvestedInr)}</TableCell>
                <TableCell className="text-right">{money(row.usInvestedInr)}</TableCell>
                <TableCell className="hidden text-right md:table-cell">
                  {money(row.mutualFundInvestedInr)}
                </TableCell>
                <TableCell className="hidden text-right md:table-cell">
                  {money(row.etfInvestedInr)}
                </TableCell>
                <TableCell className="hidden text-right md:table-cell">
                  {money(row.directInvestedInr)}
                </TableCell>
              </>
            ) : variant === "india" ? (
              <>
                <TableCell className="text-right">{money(row.mutualFundInvestedInr)}</TableCell>
                <TableCell className="text-right">{money(row.etfInvestedInr)}</TableCell>
                <TableCell className="text-right">{money(row.directInvestedInr)}</TableCell>
              </>
            ) : (
              <>
                <TableCell className="text-right">{money(row.directInvestedInr)}</TableCell>
                <TableCell className="text-right">{money(row.etfInvestedInr)}</TableCell>
              </>
            )}
            <TableCell className="text-right font-medium">{money(row.totalInvestedInr)}</TableCell>
            <TableCell className="text-right">{formatPercent(row.portfolioPercentage)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
