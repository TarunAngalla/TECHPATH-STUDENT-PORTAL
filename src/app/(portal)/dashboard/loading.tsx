import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="grid gap-4 md:gap-6" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="col-span-full h-36 rounded-2xl" />

      <Skeleton className="col-span-full h-20 rounded-2xl" />

      <div className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>

      <Skeleton className="col-span-full h-24 rounded-2xl" />

      <div className="col-span-full grid md:grid-cols-2 gap-4 md:gap-6">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>

      <div className="col-span-full grid md:grid-cols-2 gap-4 md:gap-6">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
