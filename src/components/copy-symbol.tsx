"use client";

import { CopyIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { copyableAmount, copyText } from "@/lib/clipboard";

function googleSearchUrl(symbol: string): string {
  return `https://www.google.com/search?${new URLSearchParams({ q: symbol }).toString()}`;
}

export function CopySymbol({
  symbol,
  badge = true,
  search = false,
}: {
  symbol: string;
  badge?: boolean;
  search?: boolean;
}) {
  async function onCopy() {
    try {
      await copyText(symbol);
      toast.success(`Copied ${symbol}`);
    } catch {
      toast.error("Unable to copy the symbol");
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      {badge ? <Badge variant="secondary">{symbol}</Badge> : <span>{symbol}</span>}
      <CopyButton label={`Copy ${symbol}`} hint="Copy symbol" onCopy={() => void onCopy()} />
      {search ? <GoogleSearchLink symbol={symbol} /> : null}
    </span>
  );
}

export function CopyAmount({
  value,
  display,
}: {
  value: number;
  display: string;
}) {
  const copied = copyableAmount(value);

  async function onCopy() {
    try {
      await copyText(copied);
      toast.success(`Copied ${copied}`);
    } catch {
      toast.error("Unable to copy the amount");
    }
  }

  return (
    <span className="inline-flex items-center justify-end gap-1">
      <span>{display}</span>
      <CopyButton label={`Copy ${copied}`} hint="Copy number" onCopy={() => void onCopy()} />
    </span>
  );
}

function CopyButton({
  label,
  hint,
  onCopy,
}: {
  label: string;
  hint: string;
  onCopy: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button type="button" variant="ghost" size="icon-xs" onClick={onCopy} />}
      >
        <CopyIcon />
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

function GoogleSearchLink({ symbol }: { symbol: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <a
            href={googleSearchUrl(symbol)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          />
        }
      >
        <SearchIcon />
        <span className="sr-only">Search {symbol} on Google</span>
      </TooltipTrigger>
      <TooltipContent>Search Google</TooltipContent>
    </Tooltip>
  );
}
