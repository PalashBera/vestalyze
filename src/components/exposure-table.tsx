"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react";
import type { StockExposure } from "@/lib/api/types";
import { useSettings } from "@/components/settings-provider";
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

type Variant = "consolidated" | "india" | "us";
type SortKey = "company" | "sector" | "india" | "us" | "total" | "weight" | "mf" | "etf" | "direct";

function valueFor(row: StockExposure, key: SortKey): string | number {
  switch (key) {
    case "company":
      return row.security.standardizedName.toLowerCase();
    case "sector":
      return row.security.sector.toLowerCase();
    case "india":
      return row.indiaInvestedInr;
    case "us":
      return row.usInvestedInr;
    case "total":
      return row.totalInvestedInr;
    case "weight":
      return row.portfolioPercentage;
    case "mf":
      return row.mutualFundInvestedInr;
    case "etf":
      return row.etfInvestedInr;
    case "direct":
      return row.directInvestedInr;
    default:
      return 0;
  }
}

function SortableHead({
  label,
  column,
  active,
  direction,
  align = "left",
  onSort,
}: {
  label: string;
  column: SortKey;
  active: SortKey;
  direction: "asc" | "desc";
  align?: "left" | "right";
  onSort: (column: SortKey) => void;
}) {
  const Icon = active === column ? (direction === "asc" ? ArrowUpIcon : ArrowDownIcon) : ArrowUpDownIcon;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={align === "right" ? "ml-auto h-7 px-1.5" : "h-7 px-1.5"}
        onClick={() => onSort(column)}
      >
        {label}
        <Icon className="size-3.5 opacity-70" />
      </Button>
    </TableHead>
  );
}

export function ExposureTable({
  rows,
  variant = "consolidated",
  disableLinks = false,
}: {
  rows: StockExposure[];
  variant?: Variant;
  disableLinks?: boolean;
}) {
  const { money } = useSettings();
  const [sortKey, setSortKey] = useState<SortKey>(variant === "consolidated" ? "total" : "total");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  function onSort(column: SortKey) {
    if (sortKey === column) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(column);
    setDirection(column === "company" || column === "sector" ? "asc" : "desc");
  }

  const sorted = useMemo(() => {
    return [...rows].sort((left, right) => {
      const a = valueFor(left, sortKey);
      const b = valueFor(right, sortKey);
      const compared = typeof a === "string" && typeof b === "string" ? a.localeCompare(b) : Number(a) - Number(b);
      return direction === "asc" ? compared : -compared;
    });
  }, [rows, sortKey, direction]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {variant === "consolidated" ? (
            <>
              <SortableHead label="Company" column="company" active={sortKey} direction={direction} onSort={onSort} />
              <SortableHead label="Category" column="sector" active={sortKey} direction={direction} onSort={onSort} />
              <SortableHead label="India" column="india" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="US" column="us" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="Total" column="total" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="Weight" column="weight" active={sortKey} direction={direction} align="right" onSort={onSort} />
            </>
          ) : variant === "india" ? (
            <>
              <SortableHead label="Company" column="company" active={sortKey} direction={direction} onSort={onSort} />
              <SortableHead label="Mutual Funds" column="mf" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="ETFs" column="etf" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="Direct" column="direct" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="Total" column="total" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="Weight" column="weight" active={sortKey} direction={direction} align="right" onSort={onSort} />
            </>
          ) : (
            <>
              <SortableHead label="Company" column="company" active={sortKey} direction={direction} onSort={onSort} />
              <SortableHead label="Direct" column="direct" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="ETF" column="etf" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="Total" column="total" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="Weight" column="weight" active={sortKey} direction={direction} align="right" onSort={onSort} />
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.security.id}>
            <TableCell>
              {disableLinks ? (
                <span className="font-medium">{row.security.standardizedName}</span>
              ) : (
                <Button
                  variant="link"
                  nativeButton={false}
                  render={<Link href={`/exposure/${row.security.id}`} />}
                  className="h-auto justify-start px-0"
                >
                  {row.security.standardizedName}
                </Button>
              )}
            </TableCell>
            {variant === "consolidated" ? (
              <>
                <TableCell>{row.security.sector}</TableCell>
                <TableCell className="text-right">{money(row.indiaInvestedInr)}</TableCell>
                <TableCell className="text-right">{money(row.usInvestedInr)}</TableCell>
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
