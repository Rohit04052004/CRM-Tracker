"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { DeliverabilityRow } from "@/lib/aggregations";

const RECEIVED_COLOR = "var(--status-good)";
const BLOCKED_COLOR = "var(--status-critical)";
const CAPPED_COLOR = "var(--status-warning)";

export function DeliverabilityChart({ data }: { data: DeliverabilityRow[] }) {
  // Real cohort lists can run 15-20+ distinct values — a fixed-height chart
  // would cram them into unreadable slivers, so the chart grows with the data.
  const height = Math.max(240, data.length * 32);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        stackOffset="expand"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        barCategoryGap="25%"
      >
        <CartesianGrid horizontal={false} stroke="var(--gridline)" />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="cohort"
          tick={{ fill: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}
          axisLine={{ stroke: "var(--axis)" }}
          tickLine={false}
          width={90}
        />
        <Tooltip
          formatter={(value, name) => [`${(Number(value) * 100).toFixed(1)}%`, String(name)]}
          contentStyle={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
        <Bar dataKey="receivedPct" name="Received" stackId="a" fill={RECEIVED_COLOR} maxBarSize={24} />
        <Bar dataKey="blockedPct" name="Blocked" stackId="a" fill={BLOCKED_COLOR} maxBarSize={24} />
        <Bar
          dataKey="cappedPct"
          name="Capped"
          stackId="a"
          fill={CAPPED_COLOR}
          radius={[0, 4, 4, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
