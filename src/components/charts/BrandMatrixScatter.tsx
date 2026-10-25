"use client";

import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import { BrandMatrixRow } from "@/lib/aggregations";
import { buildOrderedColorMap } from "@/lib/colors";

export function BrandMatrixScatter({
  data,
  formatValue,
  formatCurrency,
}: {
  data: BrandMatrixRow[];
  formatValue: (v: number) => string;
  formatCurrency: (v: number) => string;
}) {
  const colorFor = buildOrderedColorMap(data.map((d) => d.brand));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 20, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid stroke="var(--gridline)" />
        <XAxis
          type="number"
          dataKey="sessions"
          name="Sessions"
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--axis)" }}
          tickLine={false}
          tickFormatter={formatValue}
          label={{ value: "Sessions", position: "insideBottom", offset: -4, fill: "var(--text-secondary)", fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="revenue"
          name="Revenue"
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--axis)" }}
          tickLine={false}
          tickFormatter={formatCurrency}
          width={64}
        />
        <ZAxis type="number" dataKey="campaigns" range={[80, 400]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload || payload.length === 0) return null;
            const d = payload[0].payload as BrandMatrixRow;
            return (
              <div
                className="rounded-lg border px-3 py-2 text-sm shadow-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
              >
                <div className="mb-1 font-semibold">{d.brand}</div>
                <div className="tabular text-xs text-muted-foreground">Sessions: {formatValue(d.sessions)}</div>
                <div className="tabular text-xs text-muted-foreground">Revenue: {formatCurrency(d.revenue)}</div>
                <div className="tabular text-xs text-muted-foreground">Campaigns: {d.campaigns}</div>
              </div>
            );
          }}
        />
        <Scatter data={data} shape="circle">
          {data.map((d) => (
            <Cell key={d.brand} fill={colorFor(d.brand)} />
          ))}
          <LabelList
            dataKey="brand"
            position="top"
            style={{ fontSize: 11, fill: "var(--text-secondary)", fontWeight: 500 }}
          />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
