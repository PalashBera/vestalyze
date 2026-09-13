"use client";

import { TargetIcon } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { DesktopTable, RecordList, RecordListItem } from "@/components/record-list";
import { StockAnalysisForm } from "@/components/stock-analysis-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { targetPrice } from "@/lib/finance/trades";
import { formatDateOnly, formatPercent, formatPrice } from "@/lib/format";

function price(amount: number): string {
  return formatPrice(amount, "INR");
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
                  title={entry.name}
                  subtitle={entry.symbol}
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
                    { label: "Buy date", value: formatDateOnly(entry.buyDate) },
                    { label: "Buying price", value: price(entry.buyPrice) },
                    { label: "Target return", value: formatPercent(entry.targetReturnPercentage) },
                    { label: "Target price", value: price(targetPrice(entry)) },
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
                    <TableHead>Buy date</TableHead>
                    <TableHead className="text-right">Buying price</TableHead>
                    <TableHead className="text-right">Target return %</TableHead>
                    <TableHead className="text-right">Target price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{entry.symbol}</Badge>
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
