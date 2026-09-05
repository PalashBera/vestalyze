import { APP_NAME, APP_SHORT_NAME, APP_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        className="fill-background"
        style={{ fontSize: "13px", fontWeight: 700, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {APP_SHORT_NAME}
      </text>
    </svg>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark className="size-7" />
      <span className="font-heading text-sm font-medium tracking-tight">{APP_NAME}</span>
    </span>
  );
}

export function SidebarBrand() {
  return (
    <div className="rounded-xl bg-sidebar-accent px-3 py-3 ring-1 ring-sidebar-border/80">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary shadow-sm">
          <svg viewBox="0 0 32 32" className="size-10" aria-hidden>
            <rect width="32" height="32" rx="8" className="fill-sidebar-primary" />
            <text
              x="16"
              y="21"
              textAnchor="middle"
              className="fill-sidebar-primary-foreground"
              style={{ fontSize: "13px", fontWeight: 700, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
            >
              {APP_SHORT_NAME}
            </text>
          </svg>
        </span>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold tracking-tight">{APP_NAME}</p>
          <p className="truncate text-xs text-muted-foreground">{APP_TAGLINE}</p>
        </div>
      </div>
    </div>
  );
}
