"use client";

import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export function CopySymbol({
  symbol,
  badge = true,
}: {
  symbol: string;
  badge?: boolean;
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
      <Tooltip>
        <TooltipTrigger
          render={
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => void onCopy()} />
          }
        >
          <CopyIcon />
          <span className="sr-only">Copy {symbol}</span>
        </TooltipTrigger>
        <TooltipContent>Copy symbol</TooltipContent>
      </Tooltip>
    </span>
  );
}
