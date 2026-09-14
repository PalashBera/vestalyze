"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "cn";

const NAME_LIMIT = 30;

export function TruncatedName({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const truncated = name.length > NAME_LIMIT;
  const display = truncated ? `${name.slice(0, NAME_LIMIT)}...` : name;

  if (!truncated) {
    return <span className={className}>{display}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className={cn("cursor-default whitespace-nowrap", className)} />}
      >
        {display}
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}
