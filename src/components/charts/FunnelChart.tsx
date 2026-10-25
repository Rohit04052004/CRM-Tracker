"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell,
} from "recharts";
import { FunnelStage } from "@/lib/aggregations";
import { SERIES_COLORS } from "@/lib/colors";

function ConvLabel(labelProps: unknown) {
  const props = labelProps as { x?: unknown; y?: unknown; height?: unknown; value?: unknown };
  const x = Number(props.x);
  const y = Number(props.y);
  const height = Number(props.height);
  const value = props.value === undefined || props.value === null ? undefined : Number(props.value);
  if (value === undefined || Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(height)) return null;
  return (
    <text
      x={x + 10}
      y={y + height / 2}
      dy={4}
      fontSize={12}
      fontWeight={600}
      fill="var(--text-primary)"
    >
      {value.toFixed(1)}% of prior stage
    </text>
  );
}

export function FunnelChart({
  data,
  formatValue,
}: {
  data: FunnelStage[];
  formatValue: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        barCategoryGap={18}
      >
        <CartesianGrid horizontal={false} stroke="var(--gridline)" />
        <XAxis
          type="number"
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatValue}
        />
        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fill: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}
          axisLine={{ stroke: "var(--axis)" }}
          tickLine={false}
          width={90}
        />
        <Tooltip
          formatter={(value) => formatValue(Number(value))}
          contentStyle={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        />
        <Bar dataKey="volume" radius={[0, 6, 6, 0]} barSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
          ))}
          <LabelList dataKey="convPct" content={ConvLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
