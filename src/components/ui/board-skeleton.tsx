import { Skeleton } from "./skeleton";

export function BoardSkeleton() {
  return (
    <div className="flex gap-3 p-6 overflow-x-auto">
      {[1, 2, 3].map((col) => (
        <div key={col} className="shrink-0 w-[300px] md:w-72">
          <Skeleton className="h-8 w-32 mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="rounded-xl border border-outline-variant/20 bg-surface-container p-4 space-y-2"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
