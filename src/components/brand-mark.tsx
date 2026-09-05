import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-heading font-bold tracking-tight bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent",
        className,
      )}
    >
      {APP_NAME}
    </span>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <BrandWordmark className="text-2xl" />
    </span>
  );
}

export function SidebarBrand() {
  return (
    <div className="px-1 py-1">
      <BrandWordmark className="text-2xl" />
    </div>
  );
}
