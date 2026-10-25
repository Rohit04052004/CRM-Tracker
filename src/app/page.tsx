"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_FILTERS,
  brandMatrix,
  campaignRows,
  deliverabilityByCohort,
  filterRecords,
  funnelStages,
  kpiStats,
  releaseTimeHeatmap,
} from "@/lib/aggregations";
import { useData } from "@/lib/data-context";
import { formatCompactNumber, formatINR } from "@/lib/format";
import { UploadPanel } from "@/components/UploadPanel";
import { FilterBar } from "@/components/Filters";
import { ChartCard } from "@/components/ChartCard";
import { KpiCard } from "@/components/KpiCard";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { DeliverabilityChart } from "@/components/charts/DeliverabilityChart";
import { BrandMatrixScatter } from "@/components/charts/BrandMatrixScatter";
import { HeatmapTable } from "@/components/HeatmapTable";
import { CampaignTable } from "@/components/CampaignTable";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, Send, MailOpen, Wallet } from "lucide-react";

export default function Home() {
  const { records, setRecords, isImporting } = useData();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const hasData = records.length > 0;

  const cohorts = useMemo(() => Array.from(new Set(records.map((r) => r.cohort))).sort(), [records]);
  const brands = useMemo(() => Array.from(new Set(records.map((r) => r.brand))).sort(), [records]);

  const filtered = useMemo(() => filterRecords(records, filters), [records, filters]);

  const stats = useMemo(() => kpiStats(filtered), [filtered]);
  const funnel = useMemo(() => funnelStages(filtered), [filtered]);
  const deliverability = useMemo(() => deliverabilityByCohort(filtered), [filtered]);
  const matrix = useMemo(() => brandMatrix(filtered), [filtered]);
  const heatmap = useMemo(() => releaseTimeHeatmap(filtered), [filtered]);
  const rows = useMemo(() => campaignRows(filtered), [filtered]);

  function handleImport(newRecords: typeof records) {
    setRecords(newRecords);
    setFilters(DEFAULT_FILTERS);
  }

  function handleClear() {
    setRecords([]);
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-8 px-6 py-10 sm:px-10">
      <UploadPanel onImport={handleImport} onClear={handleClear} hasData={hasData} />

      {!hasData && (
        <Card className="animate-in fade-in-0 duration-500">
          <CardContent className="flex flex-col items-center gap-3 p-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="size-8" />
            </span>
            <p className="text-lg font-medium">
              No data yet — upload a CRM campaign export above to see the dashboard.
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Expected columns: campaign/cohort identifier, receives, blocks, opens, sessions, revenue.
              Dispatched, audience cohort, brand/category, date and slot time are optional — they&apos;re
              parsed from the identifier when not provided.
            </p>
          </CardContent>
        </Card>
      )}

      {hasData && isImporting && <DashboardSkeleton cardCount={4} />}

      {hasData && !isImporting && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-1 space-y-8 duration-500">
          <FilterBar filters={filters} onChange={setFilters} cohorts={cohorts} brands={brands} />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="Total Dispatched"
              value={formatCompactNumber(stats.dispatched)}
              icon={Send}
              sublines={[
                { label: "Recv", value: formatCompactNumber(stats.received) },
                { label: "Blk", value: formatCompactNumber(stats.blocked) },
              ]}
            />
            <KpiCard
              label="Delivery Rate"
              value={`${stats.deliveryRate.toFixed(1)}%`}
              icon={UploadCloud}
              sublines={[{ label: "Block Rate", value: `${stats.blockRate.toFixed(1)}%` }]}
            />
            <KpiCard
              label="Open Rate"
              value={`${stats.openRate.toFixed(2)}%`}
              icon={MailOpen}
              sublines={[{ label: "Open-to-Sess Conv", value: `${stats.openToSessionRate.toFixed(0)}%` }]}
            />
            <KpiCard
              label="Total CRM Revenue"
              value={formatINR(stats.revenue)}
              icon={Wallet}
              sublines={[{ label: "Rev/Session", value: `₹${stats.revenuePerSession.toFixed(2)}` }]}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="CRM Funnel: Dispatch to Revenue"
              subtitle="Volume and stage-over-stage conversion"
            >
              <FunnelChart data={funnel} formatValue={formatCompactNumber} />
              <div className="tabular mt-2 flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                <span className="font-medium">Revenue</span>
                <span className="flex items-center gap-4">
                  <span className="font-semibold">{formatINR(stats.revenue)}</span>
                  <span className="text-muted-foreground">
                    ₹{stats.revenuePerSession.toFixed(2)}/Session
                  </span>
                </span>
              </div>
            </ChartCard>

            <ChartCard
              title="Deliverability & Fatigue Health"
              subtitle="Received / Blocked / Capped mix by audience cohort"
            >
              <DeliverabilityChart data={deliverability} />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Brand & Category Performance Matrix"
              subtitle="Revenue vs. sessions, bubble size = campaign count"
            >
              <BrandMatrixScatter data={matrix} formatValue={formatCompactNumber} formatCurrency={formatINR} />
            </ChartCard>

            <ChartCard
              title="Notification Release Time Heatmap"
              subtitle="Open rate by release slot time and date"
            >
              <HeatmapTable slotTimes={heatmap.slotTimes} dates={heatmap.dates} cells={heatmap.cells} />
            </ChartCard>
          </div>

          <ChartCard title="Campaign Drill-Down Summary" subtitle="Click a column to sort">
            <CampaignTable rows={rows} formatValue={formatCompactNumber} formatCurrency={formatINR} />
          </ChartCard>
        </div>
      )}
    </main>
  );
}
