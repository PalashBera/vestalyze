import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[0.68rem] font-medium tracking-[0.18em] text-muted-foreground uppercase backdrop-blur",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "mx-auto max-w-2xl items-center text-center" : "max-w-2xl",
        className,
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-heading text-3xl leading-[1.12] tracking-tight text-balance sm:text-4xl md:text-[2.6rem]">
        {title}
      </h2>
      {description ? (
        <p className="max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("reveal flex scroll-mt-24 flex-col gap-10 md:gap-14", className)}>
      {children}
    </section>
  );
}

export function AppWindow({
  label,
  children,
  className,
  bodyClassName,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-2xl shadow-foreground/10 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border/70 bg-muted/40 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="ml-3 truncate rounded-md bg-background/60 px-2.5 py-1 font-mono text-[0.7rem] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className={cn("p-4 md:p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
