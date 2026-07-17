import { Skeleton } from "@/components/ui/Skeleton";

export function ApplicationsLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-48" />
      </div>
      <div className="glass rounded-2xl overflow-hidden shadow-glass">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-t border-border-subtle first:border-t-0"
          >
            <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UpcomingLoadingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-4 w-3/5 max-w-md" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 shadow-glass space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function TrainingsLoadingSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden shadow-glass" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between px-5 py-4 border-t border-border-subtle first:border-t-0"
        >
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-2/5" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function DocumentsLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, section) => (
        <div key={section} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="glass rounded-2xl overflow-hidden shadow-glass">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-4 border-t border-border-subtle first:border-t-0"
              >
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnnouncementsLoadingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 shadow-glass space-y-3">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

export function MessagesLoadingSkeleton() {
  return (
    <div
      className="glass rounded-2xl overflow-hidden shadow-glass flex flex-col min-h-[50vh] max-h-[calc(100vh-14rem)]"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <div className="flex-1 px-5 py-4 space-y-4">
        <div className="flex justify-start">
          <Skeleton className="h-14 w-2/5 rounded-xl rounded-bl-sm" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-1/3 rounded-xl rounded-br-sm" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-16 w-1/2 rounded-xl rounded-bl-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border-subtle">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  );
}

export function HelpLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="glass rounded-2xl overflow-hidden shadow-glass">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-5 py-4 border-t border-border-subtle first:border-t-0"
          >
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}

export function SettingsLoadingSkeleton() {
  return (
    <div className="max-w-md space-y-6" aria-hidden="true">
      <div className="glass rounded-2xl p-6 shadow-glass space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="glass rounded-2xl p-6 shadow-glass space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
