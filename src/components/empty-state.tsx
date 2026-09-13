import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  actionLabel,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("border border-dashed py-12", className)}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action || (href && actionLabel) ? (
        <EmptyContent>
          {action ?? (
            <Button nativeButton={false} render={<Link href={href!} />}>
              {actionLabel}
            </Button>
          )}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
