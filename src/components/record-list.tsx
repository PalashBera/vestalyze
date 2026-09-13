import Link from "next/link";

export function RecordList({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col gap-3 md:hidden">{children}</ul>;
}

export function RecordListItem({
  title,
  subtitle,
  href,
  actions,
  fields,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  href?: string;
  actions?: React.ReactNode;
  fields: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <li className="rounded-xl border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {href ? (
            <Link href={href} className="font-medium underline-offset-2 hover:underline">
              {title}
            </Link>
          ) : (
            <p className="font-medium">{title}</p>
          )}
          {subtitle ? <div className="mt-0.5 text-sm text-muted-foreground">{subtitle}</div> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {fields.length > 0 ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {fields.map((field) => (
            <div key={field.label} className="min-w-0">
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="break-words font-medium">{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  );
}

export function DesktopTable({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:block">{children}</div>;
}
