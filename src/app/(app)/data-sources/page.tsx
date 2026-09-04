"use client";

import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function DataSourcesPage() {
  const sources = useAsync(() => api.ops.dataSources());
  const logs = useAsync(() => api.ops.logs());

  async function refresh(id: string) {
    await api.ops.refreshSource(id);
    toast.success("Refresh started");
    void sources.reload();
    void logs.reload();
  }

  if (sources.loading || logs.loading) {
    return <Skeleton className="h-80" />;
  }

  if (sources.error || logs.error || !sources.data || !logs.data) {
    return (
      <Alert>
        <AlertTitle>Unable to load data sources</AlertTitle>
        <AlertDescription>{sources.error ?? logs.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data sources"
        description="Scraping status for public fund and ETF holdings. Refresh records a job; a real extractor can replace this later."
      />
      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
          <CardDescription>Each extractor stays independent so a site change does not break the rest.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last scraped</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.data.dataSources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{source.name}</span>
                      <span className="text-xs text-muted-foreground">{source.url}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{source.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={source.status === "fresh" ? "secondary" : "outline"}>{source.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(source.lastScrapedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => void refresh(source.id)}>
                      Refresh
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Scraping logs</CardTitle>
          <CardDescription>Background job history for holdings collection.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Records</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.startedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{log.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{log.recordsProcessed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
