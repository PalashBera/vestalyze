import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="relative rounded-xl">
      <div
        className="pointer-events-none select-none rounded-xl blur-[1.5px]"
        aria-hidden
      >
        {children}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-background/35" />
      <div className="pointer-events-none fixed inset-x-0 top-1/2 z-40 flex -translate-y-1/2 justify-center px-4">
        <Card className="pointer-events-auto w-full max-w-75 shadow-lg">
          <CardHeader>
            <CardTitle className="text-balance">{title}</CardTitle>
            <CardDescription className="text-pretty">
              {description}
            </CardDescription>
          </CardHeader>
          {hideAction ? null : (
            <CardContent>
              <Button
                className="w-full"
                nativeButton={false}
                render={<Link href={href} />}
              >
                {actionLabel}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
