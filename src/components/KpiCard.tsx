import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  sublines,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  sublines: { label: string; value: string }[];
}) {
  return (
    <Card size="sm" className="card-hover h-full">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-3.5" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
        </div>
        <div className="tabular text-3xl font-bold tracking-tight">{value}</div>
        <div className="tabular flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {sublines.map((s) => (
            <span key={s.label}>
              {s.label}: <span className="font-medium text-foreground">{s.value}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
