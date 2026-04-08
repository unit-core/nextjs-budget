import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Cards row */}
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 shadow-xs">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="mb-4 h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Table area */}
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <Skeleton className="h-9 w-48" />
        <div className="rounded-xl border bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b p-4 last:border-b-0">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1 max-w-48" />
              <Skeleton className="ms-auto h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="px-4 lg:px-6">
        <div className="rounded-xl border bg-card p-6 shadow-xs">
          <Skeleton className="mb-2 h-5 w-36" />
          <Skeleton className="mb-4 h-3 w-56" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
