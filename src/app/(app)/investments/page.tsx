"use client";

import Link from "next/link";
import { InvestmentForm } from "@/components/investment-form";
import { PageHeader } from "@/components/page-header";
import { useSettings } from "@/components/settings-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { countryLabel, formatPercent, typeLabel } from "@/lib/format";
import { WalletIcon } from "lucide-react";

export default function InvestmentsPage() {
  const { moneyNative } = useSettings();
  const { data, error, loading, reload } = useAsync(() => api.investments.list());

  if (loading) {
    return <Skeleton className="h-80" />;
  }

  if (error || !data) {
    return (
      <Alert>
        <AlertTitle>Unable to load investments</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Investments"
        description="Every mutual fund, ETF, and direct stock with invested amount and current value."
        actions={<InvestmentForm onCreated={() => void reload()} />}
      />
      {data.investments.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WalletIcon />
            </EmptyMedia>
            <EmptyTitle>No investments yet</EmptyTitle>
            <EmptyDescription>Add a fund, ETF, or stock to start look-through analysis.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Return</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.investments.map((item) => {
                  const ret =
                    item.investedAmount > 0
                      ? ((item.currentValue - item.investedAmount) / item.investedAmount) * 100
                      : 0;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Button
                          variant="link"
                          className="h-auto px-0"
                          nativeButton={false}
                          render={<Link href={`/investments/${item.id}`} />}
                        >
                          {item.name}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{typeLabel(item.type)}</Badge>
                      </TableCell>
                      <TableCell>{countryLabel(item.country)}</TableCell>
                      <TableCell className="text-right">
                        {moneyNative(item.investedAmount, item.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {moneyNative(item.currentValue, item.currency)}
                      </TableCell>
                      <TableCell className={ret >= 0 ? "text-right text-gain" : "text-right text-destructive"}>
                        {formatPercent(ret)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
