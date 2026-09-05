import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderPreview({
  children,
  title = "This is a preview",
  description = "Add your first holdings to replace this sample view with your real look-through exposure.",
  href = "/onboarding",
  actionLabel = "Start onboarding",
  hideAction = false,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  hideAction?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="pointer-events-none select-none rounded-xl blur-[2px]" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/35 p-3 sm:p-4">
        <Card className="w-full max-w-75 shadow-lg">
          <CardHeader>
            <CardTitle className="text-balance">{title}</CardTitle>
            <CardDescription className="text-pretty">{description}</CardDescription>
          </CardHeader>
          {hideAction ? null : (
            <CardContent>
              <Button className="w-full" nativeButton={false} render={<Link href={href} />}>
                {actionLabel}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
