import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-border-subtle/60 animate-shimmer relative overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}
