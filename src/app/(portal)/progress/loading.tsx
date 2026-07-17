import { Skeleton } from "@/components/ui";

export default function ProgressLoading() {
  return (
    <div className="grid gap-4 md:gap-6" aria-busy="true" aria-label="Loading progress">
      <Skeleton className="col-span-full h-32 rounded-2xl" />

      <Skeleton className="col-span-full h-40 rounded-2xl" />

      <div className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>

      <div className="col-span-full rounded-2xl p-6 space-y-5">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-3 w-3 rounded-full flex-shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
