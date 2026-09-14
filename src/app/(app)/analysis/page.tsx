"use client";

import { TargetIcon } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { CopySymbol } from "@/components/copy-symbol";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { DesktopTable, RecordList, RecordListItem } from "@/components/record-list";
import { StockAnalysisForm } from "@/components/stock-analysis-form";
import { TruncatedName } from "@/components/truncated-name";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAsync } from "@/hooks/use-async";
import { api } from "@/lib/api/client";
import { targetPrice } from "@/lib/finance/trades";
import { formatDateOnly, formatPercent, formatPrice } from "@/lib/format";

function price(amount: number): string {
  return formatPrice(amount, "INR");
}

function HintHead({
  label,
  hint,
  className,
}: {
  label: string;
  hint: string;
  className?: string;
}) {
  return (
    <TableHead className={className}>
      <Tooltip>
        <TooltipTrigger render={<span className="cursor-default" />}>{label}</TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
    </TableHead>
  );
}

export default function AnalysisPage() {
  const { data, error, loading, reload } = useAsync(() => api.analysis.list());

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

  const entries = data.entries;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stock Analysis"
        description="Price targets you are tracking. Enter the return you want and the target price follows."
        actions={<StockAnalysisForm onSaved={() => void reload()} />}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={TargetIcon}
          title="No analysis yet"
          description="Add a stock with the return you are aiming for to see the price it has to reach."
          action={<StockAnalysisForm onSaved={() => void reload()} />}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <RecordList>
              {entries.map((entry) => (
                <RecordListItem
                  key={entry.id}
                  title={<TruncatedName name={entry.name} />}
                  subtitle={<CopySymbol symbol={entry.symbol} badge={false} />}
                  actions={
                    <div className="flex gap-1">
                      <StockAnalysisForm entry={entry} onSaved={() => void reload()} />
                      <ConfirmDeleteButton
                        title="Delete this analysis?"
                        description={`This removes the ${entry.symbol} price target from your watchlist.`}
                        successMessage="Analysis deleted"
                        errorMessage="Unable to delete the analysis"
                        onConfirm={async () => {
                          await api.analysis.remove(entry.id);
                          await reload();
                        }}
                      />
                    </div>
                  }
                  fields={[
                    { label: "Bought", value: formatDateOnly(entry.buyDate) },
                    { label: "Buy", value: price(entry.buyPrice) },
                    { label: "Target %", value: formatPercent(entry.targetReturnPercentage) },
                    { label: "Target", value: price(targetPrice(entry)) },
                  ]}
                />
              ))}
            </RecordList>

            <DesktopTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <HintHead label="Bought" hint="Buy date" />
                    <HintHead label="Buy" hint="Buying price" className="text-right" />
                    <HintHead label="Target %" hint="Target return" className="text-right" />
                    <HintHead label="Target" hint="Target price" className="text-right" />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        <TruncatedName name={entry.name} />
                      </TableCell>
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
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <StockAnalysisForm entry={entry} onSaved={() => void reload()} />
                          <ConfirmDeleteButton
                            title="Delete this analysis?"
                            description={`This removes the ${entry.symbol} price target from your watchlist.`}
                            successMessage="Analysis deleted"
                            errorMessage="Unable to delete the analysis"
                            onConfirm={async () => {
                              await api.analysis.remove(entry.id);
                              await reload();
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DesktopTable>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
