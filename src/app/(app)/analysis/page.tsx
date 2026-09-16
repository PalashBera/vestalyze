"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  TargetIcon,
} from "lucide-react";
import { AnalysisExportActions } from "@/components/analysis-export-actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { CopyAmount, CopySymbol } from "@/components/copy-symbol";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import {
  DesktopTable,
  RecordList,
  RecordListItem,
} from "@/components/record-list";
import { useSettings } from "@/components/settings-provider";
import { StockAnalysisForm } from "@/components/stock-analysis-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import type { StockAnalysis } from "@/lib/api/types";
import {
  analysisIsOpen,
  sellTargetPrice,
  stopLossPrice,
  targetPrice,
} from "@/lib/finance/trades";
import { formatDateOnly, formatPercent, formatPrice } from "@/lib/format";

const OPEN = "—";

type SortKey =
  | "symbol"
  | "buyDate"
  | "buyPrice"
  | "targetPct"
  | "targetPrice"
  | "stopLoss"
  | "sellTarget"
  | "exitedDate";

type StatusFilter = "all" | "in-progress" | "exited";

function price(amount: number): string {
  return formatPrice(amount, "INR");
}

function SortableHead({
  label,
  hint,
  column,
  active,
  direction,
  align = "left",
  onSort,
}: {
  label: string;
  hint?: string;
  column: SortKey;
  active: SortKey;
  direction: "asc" | "desc";
  align?: "left" | "right";
  onSort: (column: SortKey) => void;
}) {
  const Icon =
    active === column
      ? direction === "asc"
        ? ArrowUpIcon
        : ArrowDownIcon
      : ArrowUpDownIcon;
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={align === "right" ? "ml-auto h-7 px-1.5" : "h-7 px-1.5"}
      onClick={() => onSort(column)}
    >
      {label}
      <Icon data-icon="inline-end" className="opacity-70" />
    </Button>
  );
  return (
    <TableHead
      className={
        align === "right" ? "whitespace-nowrap text-right" : "whitespace-nowrap"
      }
    >
      {hint ? (
        <Tooltip>
          <TooltipTrigger render={button} />
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </TableHead>
  );
}

function sortValue(
  entry: StockAnalysis,
  key: SortKey,
  profit?: number,
  loss?: number,
): string | number | null {
  switch (key) {
    case "symbol":
      return entry.symbol.toLowerCase();
    case "buyDate":
      return entry.buyDate;
    case "buyPrice":
      return entry.buyPrice;
    case "targetPct":
      return entry.targetReturnPercentage;
    case "targetPrice":
      return targetPrice(entry);
    case "stopLoss":
      return loss === undefined ? null : stopLossPrice(entry, loss);
    case "sellTarget":
      return profit === undefined ? null : sellTargetPrice(entry, profit);
    case "exitedDate":
      return entry.exitedDate ?? null;
    default:
      return null;
  }
}

function sortEntries(
  entries: StockAnalysis[],
  key: SortKey,
  direction: "asc" | "desc",
  profit?: number,
  loss?: number,
): StockAnalysis[] {
  return [...entries].sort((left, right) => {
    const a = sortValue(left, key, profit, loss);
    const b = sortValue(right, key, profit, loss);
    if (a === null && b === null) {
      return right.buyDate.localeCompare(left.buyDate);
    }
    if (a === null) {
      return 1;
    }
    if (b === null) {
      return -1;
    }
    const compared =
      typeof a === "string" && typeof b === "string"
        ? a.localeCompare(b)
        : Number(a) - Number(b);
    if (compared !== 0) {
      return direction === "asc" ? compared : -compared;
    }
    return right.buyDate.localeCompare(left.buyDate);
  });
}

function AnalysisRows({
  entries,
  sortKey,
  direction,
  profit,
  loss,
  onSort,
  onSaved,
}: {
  entries: StockAnalysis[];
  sortKey: SortKey;
  direction: "asc" | "desc";
  profit?: number;
  loss?: number;
  onSort: (column: SortKey) => void;
  onSaved: () => void;
}) {
  return (
    <>
      <RecordList>
        {entries.map((entry) => {
          const open = analysisIsOpen(entry);
          const stop = loss === undefined ? undefined : stopLossPrice(entry, loss);
          const sell = profit === undefined ? undefined : sellTargetPrice(entry, profit);
          return (
            <RecordListItem
              key={entry.id}
              title={<CopySymbol symbol={entry.symbol} />}
              subtitle={
                open ? (
                  <Badge variant="outline">In progress</Badge>
                ) : (
                  `Exited ${formatDateOnly(entry.exitedDate)}`
                )
              }
              actions={
                <div className="flex gap-1">
                  <StockAnalysisForm entry={entry} onSaved={onSaved} />
                  <ConfirmDeleteButton
                    title="Delete this analysis?"
                    description={`This removes the ${entry.symbol} price target from your watchlist.`}
                    successMessage="Analysis deleted"
                    errorMessage="Unable to delete the analysis"
                    onConfirm={async () => {
                      await api.analysis.remove(entry.id);
                      onSaved();
                    }}
                  />
                </div>
              }
              fields={[
                { label: "Date", value: formatDateOnly(entry.buyDate) },
                { label: "Buy", value: price(entry.buyPrice) },
                {
                  label: "Target %",
                  value: formatPercent(entry.targetReturnPercentage),
                },
                { label: "Target", value: price(targetPrice(entry)) },
                {
                  label: "Stop Loss",
                  value:
                    stop === undefined ? OPEN : (
                      <CopyAmount value={stop} display={price(stop)} />
                    ),
                },
                {
                  label: "Sell Target",
                  value:
                    sell === undefined ? OPEN : (
                      <CopyAmount value={sell} display={price(sell)} />
                    ),
                },
              ]}
            />
          );
        })}
      </RecordList>

      <DesktopTable>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label="Symbol"
                column="symbol"
                active={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <SortableHead
                label="Date"
                hint="Buy date"
                column="buyDate"
                active={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <SortableHead
                label="Buy"
                hint="Buying price"
                column="buyPrice"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Target %"
                hint="Target return"
                column="targetPct"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Target"
                hint="Target price"
                column="targetPrice"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Stop Loss"
                hint="Buying price minus (loss % from Settings × this row's target return)"
                column="stopLoss"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Sell Target"
                hint="Buying price plus (profit % from Settings × this row's target return)"
                column="sellTarget"
                active={sortKey}
                direction={direction}
                align="right"
                onSort={onSort}
              />
              <SortableHead
                label="Exited"
                hint="Exited date. Empty while the thesis is in progress."
                column="exitedDate"
                active={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const open = analysisIsOpen(entry);
              const stop = loss === undefined ? undefined : stopLossPrice(entry, loss);
              const sell = profit === undefined ? undefined : sellTargetPrice(entry, profit);
              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    <CopySymbol symbol={entry.symbol} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateOnly(entry.buyDate)}
                  </TableCell>
                  <TableCell className="text-right">{price(entry.buyPrice)}</TableCell>
                  <TableCell className="text-right">
                    {formatPercent(entry.targetReturnPercentage)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {price(targetPrice(entry))}
                  </TableCell>
                  <TableCell className="text-right">
                    {stop === undefined ? OPEN : <CopyAmount value={stop} display={price(stop)} />}
                  </TableCell>
                  <TableCell className="text-right">
                    {sell === undefined ? OPEN : <CopyAmount value={sell} display={price(sell)} />}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {open ? <Badge variant="outline">In progress</Badge> : formatDateOnly(entry.exitedDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <StockAnalysisForm entry={entry} onSaved={onSaved} />
                      <ConfirmDeleteButton
                        title="Delete this analysis?"
                        description={`This removes the ${entry.symbol} price target from your watchlist.`}
                        successMessage="Analysis deleted"
                        errorMessage="Unable to delete the analysis"
                        onConfirm={async () => {
                          await api.analysis.remove(entry.id);
                          onSaved();
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DesktopTable>
    </>
  );
}

export default function AnalysisPage() {
  const { data, error, loading, reload } = useAsync(() => api.analysis.list());
  const { user } = useSettings();
  const [sortKey, setSortKey] = useState<SortKey>("buyDate");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const profit = user?.targetProfitPercentage;
  const loss = user?.targetLossPercentage;

  const entries = data?.entries ?? [];
  const sorted = useMemo(
    () => sortEntries(entries, sortKey, direction, profit, loss),
    [entries, sortKey, direction, profit, loss],
  );
  const inProgress = useMemo(() => sorted.filter(analysisIsOpen), [sorted]);
  const exited = useMemo(() => sorted.filter((entry) => !analysisIsOpen(entry)), [sorted]);

  function onSort(column: SortKey) {
    if (sortKey === column) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(column);
    setDirection(column === "symbol" ? "asc" : "desc");
  }

  if (loading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load stock analysis</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const tabs: Array<{
    value: StatusFilter;
    label: string;
    rows: StockAnalysis[];
    emptyTitle: string;
    emptyDescription: string;
  }> = [
    {
      value: "all",
      label: "All",
      rows: sorted,
      emptyTitle: "No analysis yet",
      emptyDescription: "Add a stock with the return you are aiming for.",
    },
    {
      value: "in-progress",
      label: "In Progress",
      rows: inProgress,
      emptyTitle: "Nothing in progress",
      emptyDescription: "Rows without an exited date show up here.",
    },
    {
      value: "exited",
      label: "Exited",
      rows: exited,
      emptyTitle: "No exited analysis",
      emptyDescription: "Fill in the exited date when you close a thesis.",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stock Analysis"
        description="Price targets you are tracking. Sell Target and Stop Loss are a share of each row's target return."
        actions={
          <>
            <AnalysisExportActions entries={entries} profit={profit} loss={loss} />
            <StockAnalysisForm onSaved={() => void reload()} />
          </>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={TargetIcon}
          title="No analysis yet"
          description="Add a stock with the return you are aiming for to see the price it has to reach. Leave exited date empty while the thesis is still open."
          action={<StockAnalysisForm onSaved={() => void reload()} />}
        />
      ) : (
        <Card>
          <Tabs defaultValue="all" className="gap-0">
            <CardHeader className="border-b">
              <TabsList className="h-auto w-full flex-wrap sm:w-fit">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="cursor-pointer px-3">
                    {tab.label}
                    <Badge variant="secondary">{tab.rows.length}</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardHeader>
            <CardContent>
              {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-0">
                  {tab.rows.length === 0 ? (
                    <EmptyState
                      icon={TargetIcon}
                      title={tab.emptyTitle}
                      description={tab.emptyDescription}
                      className="border-0 py-10"
                    />
                  ) : (
                    <AnalysisRows
                      entries={tab.rows}
                      sortKey={sortKey}
                      direction={direction}
                      profit={profit}
                      loss={loss}
                      onSort={onSort}
                      onSaved={() => void reload()}
                    />
                  )}
                </TabsContent>
              ))}
            </CardContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}
