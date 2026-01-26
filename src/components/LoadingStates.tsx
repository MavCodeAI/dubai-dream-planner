import { Skeleton } from '@/components/ui/skeleton';

export function ItinerarySkeleton() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Day cards skeleton */}
        {[1, 2, 3].map((day) => (
          <div key={day} className="bg-card rounded-2xl border border-border overflow-hidden shadow-md">
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="px-5 pb-5 border-t border-border">
              <div className="flex gap-2 py-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
              <div className="space-y-3">
                {[1, 2].map((activity) => (
                  <div key={activity} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DaySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((activity) => (
        <div key={activity} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TripsSkeleton() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((trip) => (
            <div key={trip} className="bg-card rounded-2xl border border-border p-6 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Skeleton className="w-4 h-4" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-3 w-56" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
