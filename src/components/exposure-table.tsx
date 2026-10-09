"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react";
import type { StockExposure } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DesktopTable, RecordList, RecordListItem } from "@/components/record-list";
import { formatMoney, formatPercent } from "@/lib/format";

type SortKey = "company" | "mf" | "etf" | "total" | "weight";

function valueFor(row: StockExposure, key: SortKey): string | number {
  switch (key) {
    case "company":
      return row.security.standardizedName.toLowerCase();
    case "mf":
      return row.mutualFundInvestedInr;
    case "etf":
      return row.etfInvestedInr;
    case "total":
      return row.totalInvestedInr;
    case "weight":
      return row.portfolioPercentage;
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
  disableLinks = false,
}: {
  rows: StockExposure[];
  disableLinks?: boolean;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  function onSort(column: SortKey) {
    if (sortKey === column) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(column);
    setDirection(column === "company" ? "asc" : "desc");
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
    <>
      <RecordList>
        {sorted.map((row) => (
          <RecordListItem
            key={row.security.id}
            title={row.security.standardizedName}
            href={disableLinks ? undefined : `/exposure/${row.security.id}`}
            fields={[
              { label: "Mutual Funds", value: formatMoney(row.mutualFundInvestedInr) },
              { label: "ETFs", value: formatMoney(row.etfInvestedInr) },
              { label: "Total", value: formatMoney(row.totalInvestedInr) },
              { label: "Weight", value: formatPercent(row.portfolioPercentage) },
            ]}
          />
        ))}
      </RecordList>
      <DesktopTable>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Company" column="company" active={sortKey} direction={direction} onSort={onSort} />
              <SortableHead label="Mutual Funds" column="mf" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="ETFs" column="etf" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="Total" column="total" active={sortKey} direction={direction} align="right" onSort={onSort} />
              <SortableHead label="Weight" column="weight" active={sortKey} direction={direction} align="right" onSort={onSort} />
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
                <TableCell className="text-right">{formatMoney(row.mutualFundInvestedInr)}</TableCell>
                <TableCell className="text-right">{formatMoney(row.etfInvestedInr)}</TableCell>
                <TableCell className="text-right font-medium">{formatMoney(row.totalInvestedInr)}</TableCell>
                <TableCell className="text-right">{formatPercent(row.portfolioPercentage)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DesktopTable>
    </>
  );
}
