import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <div className="space-y-8">
      <Skeleton className="h-16 w-full rounded-xl" />

      <Skeleton className="h-36 w-full rounded-xl" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: cardCount }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
