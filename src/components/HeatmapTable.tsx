import { HeatmapCell } from "@/lib/aggregations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LOW_MAX = 4;
const MEDIUM_MAX = 6;

function tierColor(openRate: number) {
  if (openRate <= LOW_MAX) return "color-mix(in oklch, var(--series-1), transparent 88%)";
  if (openRate <= MEDIUM_MAX) return "color-mix(in oklch, var(--series-1), transparent 60%)";
  return "color-mix(in oklch, var(--series-1), transparent 15%)";
}

export function HeatmapTable({
  slotTimes,
  dates,
  cells,
}: {
  slotTimes: string[];
  dates: string[];
  cells: HeatmapCell[];
}) {
  const cellFor = (slotTime: string, date: string) =>
    cells.find((c) => c.slotTime === slotTime && c.date === date);

  if (slotTimes.length === 0 || dates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No release time / date data found — map the slot time and date columns (or ensure your
        campaign identifiers encode day/month/time) to see this heatmap.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slot Time</TableHead>
            {dates.map((d) => (
              <TableHead key={d} className="tabular text-center">
                {d}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {slotTimes.map((slotTime) => (
            <TableRow key={slotTime}>
              <TableCell className="tabular font-medium">{slotTime}</TableCell>
              {dates.map((date) => {
                const cell = cellFor(slotTime, date);
                return (
                  <TableCell
                    key={date}
                    className="tabular text-center font-medium"
                    style={{ background: cell ? tierColor(cell.openRate) : undefined }}
                  >
                    {cell ? `${cell.openRate.toFixed(1)}%` : "—"}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Engagement:</span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: tierColor(0) }}
          />
          Low: &lt;{LOW_MAX}%
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: tierColor(LOW_MAX + 1) }}
          />
          Medium: {LOW_MAX}–{MEDIUM_MAX}%
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: tierColor(MEDIUM_MAX + 1) }}
          />
          High Peak: &gt;{MEDIUM_MAX}%
        </span>
      </div>
    </div>
  );
}
