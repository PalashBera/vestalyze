"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
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
import type { UrlExtractionRecord } from "@/lib/api/types";

export default function DataSourcesPage() {
  const sources = useAsync(() => api.ops.dataSources());
  const logs = useAsync(() => api.ops.logs());
  const history = useAsync(() => api.ops.extractions());
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [result, setResult] = useState<UrlExtractionRecord | null>(null);

  async function refresh(id: string) {
    await api.ops.refreshSource(id);
    toast.success("Refresh started");
    void sources.reload();
    void logs.reload();
  }

  async function extract(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setExtractError(null);
    try {
      const payload = await api.ops.extract(url.trim());
      setResult(payload.extraction);
      toast.success("Content extracted");
      void history.reload();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to extract that URL.";
      setExtractError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Data sources"
        description="Paste any public page to extract title and text. Fund source refresh stays a stub until crawling is tuned."
      />
      <Card>
        <CardHeader>
          <CardTitle>Extract a URL</CardTitle>
          <CardDescription>
            Public http(s) pages only. Private hosts, credentials, and non-text files are rejected.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void extract(event)}>
            <Field className="flex-1">
              <FieldLabel htmlFor="extract-url">URL</FieldLabel>
              <Input
                id="extract-url"
                type="url"
                name="url"
                placeholder="https://example.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                required
                maxLength={2048}
                autoComplete="off"
              />
            </Field>
            <Button type="submit" disabled={pending || !url.trim()}>
              {pending ? <Spinner /> : "Extract"}
            </Button>
          </form>
          {extractError ? (
            <Alert>
              <AlertTitle>Extraction failed</AlertTitle>
              <AlertDescription>{extractError}</AlertDescription>
            </Alert>
          ) : null}
          {result ? (
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex flex-col gap-1">
                <p className="font-medium">{result.title || "Untitled page"}</p>
                <p className="text-xs text-muted-foreground">{result.finalUrl}</p>
              </div>
              {result.description ? (
                <p className="text-sm text-muted-foreground">{result.description}</p>
              ) : null}
              <p className="max-h-80 overflow-auto whitespace-pre-wrap text-sm">{result.text || "No text found."}</p>
            </div>
          ) : null}
          {history.loading ? <Skeleton className="h-24" /> : null}
          {history.data && history.data.extractions.length > 0 ? (
            <FieldGroup>
              <p className="text-sm font-medium">Recent extractions</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.data.extractions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.title || "Untitled"}</TableCell>
                        <TableCell className="max-w-64 truncate text-muted-foreground">{item.url}</TableCell>
                        <TableCell>{new Date(item.extractedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </FieldGroup>
          ) : null}
        </CardContent>
      </Card>
      {sources.loading || logs.loading ? <Skeleton className="h-80" /> : null}
      {sources.error || logs.error ? (
        <Alert>
          <AlertTitle>Unable to load data sources</AlertTitle>
          <AlertDescription>{sources.error ?? logs.error}</AlertDescription>
        </Alert>
      ) : null}
      {sources.data && logs.data ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}
