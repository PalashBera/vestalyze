import { Spinner } from "@/components/ui/spinner";

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center">
      <Spinner className="size-4" />
    </div>
  );
}
