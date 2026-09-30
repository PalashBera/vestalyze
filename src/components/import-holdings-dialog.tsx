"use client";

import { useState, type ChangeEvent, type ClipboardEvent } from "react";
import { FileUpIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import type { Investment } from "@/lib/api/types";
import { isBotChallengePage, parseFundPage, type FundPage } from "@/lib/extract/holdings";
import { formatDateOnly, formatPercent } from "@/lib/format";

const MAX_PAGE_CHARS = 10_000_000;
const PREVIEW_ROWS = 5;

type Preview = { page: FundPage } | { error: string };

/** Parses in the browser, so the page never has to be fetched by the server. */
function readPage(sources: string[]): Preview | null {
  const candidates = sources.filter((source) => source.trim());
  if (candidates.length === 0) {
    return null;
  }
  if (candidates.some((source) => source.length > MAX_PAGE_CHARS)) {
    return { error: "That is too large to be a saved fund page." };
  }
  for (const source of candidates) {
    const page = parseFundPage(source);
    if (page.holdings.length > 0) {
      return { page };
    }
  }
  if (candidates.some(isBotChallengePage)) {
    return {
      error:
        "This is the site's bot check, not the fund page. Wait until the fund page has loaded, then save or copy it again.",
    };
  }
  return {
    error:
      "No holdings found. Make sure it is the fund page with its holdings section, and use the whole page, not a part of it.",
  };
}

export function ImportHoldingsButton({
  investment,
  onImported,
}: {
  investment: Investment;
  onImported: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pending, setPending] = useState(false);

  if (investment.type === "stock") {
    return null;
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setPreview(null);
    }
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (file.size > MAX_PAGE_CHARS) {
      setPreview({ error: "That file is too large to be a saved fund page." });
      return;
    }
    setPreview(readPage([await file.text()]));
  }

  // Page sources run to hundreds of KB; parse the clipboard instead of
  // rendering all of it in the textarea.
  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    setPreview(
      readPage([event.clipboardData.getData("text/plain"), event.clipboardData.getData("text/html")]),
    );
  }

  const page = preview && "page" in preview ? preview.page : null;
  const weightTotal = page?.holdings.reduce((sum, row) => sum + row.allocationPercentage, 0) ?? 0;

  async function save() {
    if (!page) {
      return;
    }
    setPending(true);
    try {
      const result = await api.investments.importHoldings(investment.id, {
        holdings: page.holdings,
        holdingDate: page.holdingDate,
      });
      toast.success(`Imported ${result.recordsProcessed} holdings`);
      onOpenChange(false);
      await onImported();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import holdings");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>
        <FileUpIcon data-icon="inline-start" />
        Import page
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import from your browser</DialogTitle>
          <DialogDescription>
            For fund sites that block sync.{" "}
            {investment.sourceUrl ? (
              <a
                href={investment.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Open the fund page
              </a>
            ) : (
              "Open the fund page"
            )}{" "}
            in your browser, let it finish loading, then hand that page to Vestalyze below.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup key={String(open)}>
          <Field>
            <FieldLabel htmlFor="import-file">Saved page</FieldLabel>
            <Input
              id="import-file"
              type="file"
              accept=".html,.htm,text/html"
              onChange={(event) => void onFile(event)}
            />
            <FieldDescription>
              Press ⌘S (Ctrl+S on Windows) on the fund page, save it as a webpage, then choose the .html
              file.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="import-source">Or paste the page source</FieldLabel>
            <Textarea id="import-source" placeholder="Paste here" onPaste={onPaste} />
            <FieldDescription>
              Open View Source (⌥⌘U, or Ctrl+U on Windows), select all, copy, and paste here.
            </FieldDescription>
          </Field>
        </FieldGroup>
        {page ? (
          <Alert>
            <AlertTitle>
              {page.holdings.length} holdings found · as of {formatDateOnly(page.holdingDate)}
            </AlertTitle>
            <AlertDescription>
              <p>
                {page.title || "Untitled page"} · weights add up to {formatPercent(weightTotal)}
              </p>
              <ul className="flex flex-col gap-1">
                {page.holdings.slice(0, PREVIEW_ROWS).map((row) => (
                  <li key={row.name} className="flex justify-between gap-3">
                    <span className="truncate">{row.name}</span>
                    <span className="shrink-0 tabular-nums">
                      {formatPercent(row.allocationPercentage, 2)}
                    </span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : preview && "error" in preview ? (
          <Alert variant="destructive">
            <AlertTitle>Nothing to import</AlertTitle>
            <AlertDescription>{preview.error}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button type="button" disabled={!page || pending} onClick={() => void save()}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {page ? `Save ${page.holdings.length} holdings` : "Save holdings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
