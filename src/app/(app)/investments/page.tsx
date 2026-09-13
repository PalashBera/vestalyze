"use client";

import Link from "next/link";
import { InvestmentForm, SyncInvestmentButton } from "@/components/investment-form";
import { PageHeader } from "@/components/page-header";
import { useSettings } from "@/components/settings-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoader } from "@/components/page-loader";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { DesktopTable, RecordList, RecordListItem } from "@/components/record-list";
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
import { countryLabel, formatTimestamp, typeLabel } from "@/lib/format";
import { placeholderInvestments } from "@/lib/placeholder/portfolio";

export default function InvestmentsPage() {
  const { moneyNative } = useSettings();
  const { data, error, loading, reload } = useAsync(() => api.investments.list());

  if (loading) {
    return <PageLoader />;
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
        description="Mutual funds, ETFs, and stocks with invested amount and last holdings sync."
        actions={<InvestmentForm onSaved={() => void reload()} />}
      />
      {data.investments.length === 0 ? (
        <PlaceholderPreview description="Add a fund, ETF, or stock — nothing is preloaded. This is how your book will look.">
          <Card>
            <CardContent className="pt-6">
              <RecordList>
                {placeholderInvestments.map((item) => (
                  <RecordListItem
                    key={item.id}
                    title={item.name}
                    subtitle={`${typeLabel(item.type)} · ${countryLabel(item.country)}`}
                    fields={[
                      { label: "Invested", value: item.invested },
                      { label: "Last sync", value: item.lastSync },
                    ]}
                  />
                ))}
              </RecordList>
              <DesktopTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Invested</TableHead>
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
                      <TableCell>{item.lastSync}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </DesktopTable>
            </CardContent>
          </Card>
        </PlaceholderPreview>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <RecordList>
              {data.investments.map((item) => (
                <RecordListItem
                  key={item.id}
                  title={item.name}
                  href={`/investments/${item.id}`}
                  subtitle={`${typeLabel(item.type)} · ${countryLabel(item.country)}`}
                  actions={
                    <div className="flex gap-1">
                      <InvestmentForm investment={item} onSaved={() => void reload()} />
                      <SyncInvestmentButton investment={item} onSynced={() => reload()} />
                    </div>
                  }
                  fields={[
                    { label: "Invested", value: moneyNative(item.investedAmount, item.currency) },
                    { label: "Last sync", value: item.type === "stock" ? "—" : formatTimestamp(item.lastSyncedAt) },
                  ]}
                />
              ))}
            </RecordList>
            <DesktopTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Invested</TableHead>
                  <TableHead>Last sync</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.investments.map((item) => (
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
                    <TableCell>
                      {item.type === "stock" ? "—" : formatTimestamp(item.lastSyncedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <InvestmentForm investment={item} onSaved={() => void reload()} />
                        <SyncInvestmentButton investment={item} onSynced={() => reload()} />
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
