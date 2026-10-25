import { CrmRecord } from "./types";

export type DashboardFilters = {
  cohort: string; // "All" or a specific audience cohort
  brand: string; // "All" or a specific brand/category
};

export const DEFAULT_FILTERS: DashboardFilters = {
  cohort: "All",
  brand: "All",
};

export function filterRecords(records: CrmRecord[], filters: DashboardFilters): CrmRecord[] {
  return records.filter((r) => {
    if (filters.cohort !== "All" && r.cohort !== filters.cohort) return false;
    if (filters.brand !== "All" && r.brand !== filters.brand) return false;
    return true;
  });
}

function sumBy(records: CrmRecord[], key: keyof CrmRecord): number {
  return records.reduce((s, r) => s + (typeof r[key] === "number" ? (r[key] as number) : 0), 0);
}

const MONTH_ORDER = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// `date` is either a real ISO yyyy-mm-dd (from a mapped column) or a short
// "7-Oct" label parsed from the campaign identifier (no year available) —
// this gives both a comparable sort key so heatmap columns read chronologically
// instead of in first-seen order.
function dateLabelSortKey(label: string): number {
  const iso = Date.parse(label);
  if (!isNaN(iso)) return iso;

  const match = /^(\d{1,2})-([A-Za-z]{3})/.exec(label);
  if (match) {
    const day = Number(match[1]);
    const month = MONTH_ORDER.indexOf(match[2].toLowerCase());
    return month * 100 + day;
  }
  return 0;
}

export type KpiStats = {
  dispatched: number;
  received: number;
  blocked: number;
  capped: number;
  opens: number;
  sessions: number;
  revenue: number;
  deliveryRate: number; // received / dispatched
  blockRate: number; // blocked / dispatched
  openRate: number; // opens / received
  openToSessionRate: number; // sessions / opens
  revenuePerSession: number; // revenue / sessions
};

export function kpiStats(records: CrmRecord[]): KpiStats {
  const dispatched = sumBy(records, "dispatched");
  const received = sumBy(records, "received");
  const blocked = sumBy(records, "blocked");
  const capped = sumBy(records, "capped");
  const opens = sumBy(records, "opens");
  const sessions = sumBy(records, "sessions");
  const revenue = sumBy(records, "revenue");

  return {
    dispatched,
    received,
    blocked,
    capped,
    opens,
    sessions,
    revenue,
    deliveryRate: dispatched === 0 ? 0 : (received / dispatched) * 100,
    blockRate: dispatched === 0 ? 0 : (blocked / dispatched) * 100,
    openRate: received === 0 ? 0 : (opens / received) * 100,
    openToSessionRate: opens === 0 ? 0 : (sessions / opens) * 100,
    revenuePerSession: sessions === 0 ? 0 : revenue / sessions,
  };
}

export type FunnelStage = { stage: string; volume: number; convPct: number | null };

export function funnelStages(records: CrmRecord[]): FunnelStage[] {
  const stats = kpiStats(records);
  return [
    { stage: "Dispatched", volume: stats.dispatched, convPct: null },
    {
      stage: "Received",
      volume: stats.received,
      convPct: stats.dispatched === 0 ? 0 : (stats.received / stats.dispatched) * 100,
    },
    {
      stage: "Opened",
      volume: stats.opens,
      convPct: stats.received === 0 ? 0 : (stats.opens / stats.received) * 100,
    },
    {
      stage: "Sessions",
      volume: stats.sessions,
      convPct: stats.opens === 0 ? 0 : (stats.sessions / stats.opens) * 100,
    },
  ];
}

export type DeliverabilityRow = {
  cohort: string;
  received: number;
  blocked: number;
  capped: number;
  total: number;
  receivedPct: number;
  blockedPct: number;
  cappedPct: number;
};

export function deliverabilityByCohort(records: CrmRecord[]): DeliverabilityRow[] {
  const cohorts = Array.from(new Set(records.map((r) => r.cohort)));
  return cohorts
    .map((cohort) => {
      const rows = records.filter((r) => r.cohort === cohort);
      const received = sumBy(rows, "received");
      const blocked = sumBy(rows, "blocked");
      const capped = sumBy(rows, "capped");
      const total = received + blocked + capped;
      return {
        cohort,
        received,
        blocked,
        capped,
        total,
        receivedPct: total === 0 ? 0 : (received / total) * 100,
        blockedPct: total === 0 ? 0 : (blocked / total) * 100,
        cappedPct: total === 0 ? 0 : (capped / total) * 100,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export type BrandMatrixRow = {
  brand: string;
  sessions: number;
  revenue: number;
  campaigns: number;
  revenuePerSession: number;
};

export function brandMatrix(records: CrmRecord[]): BrandMatrixRow[] {
  const brands = Array.from(new Set(records.map((r) => r.brand)));
  return brands
    .map((brand) => {
      const rows = records.filter((r) => r.brand === brand);
      const sessions = sumBy(rows, "sessions");
      const revenue = sumBy(rows, "revenue");
      return {
        brand,
        sessions,
        revenue,
        campaigns: rows.length,
        revenuePerSession: sessions === 0 ? 0 : revenue / sessions,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export type HeatmapCell = { slotTime: string; date: string; openRate: number; count: number };

// Open-rate heatmap keyed by release slot time x date — mirrors the
// "Notification Release Time Heatmap" panel: rows are the distinct release
// times seen in the data, columns are the distinct dates/date-labels.
export function releaseTimeHeatmap(records: CrmRecord[]): {
  slotTimes: string[];
  dates: string[];
  cells: HeatmapCell[];
} {
  const withSlot = records.filter((r) => r.slotTime && r.date);
  const slotTimes = Array.from(new Set(withSlot.map((r) => r.slotTime as string))).sort();
  const dates = Array.from(new Set(withSlot.map((r) => r.date as string))).sort(
    (a, b) => dateLabelSortKey(a) - dateLabelSortKey(b)
  );

  const cells: HeatmapCell[] = [];
  for (const slotTime of slotTimes) {
    for (const date of dates) {
      const rows = withSlot.filter((r) => r.slotTime === slotTime && r.date === date);
      const received = sumBy(rows, "received");
      const opens = sumBy(rows, "opens");
      cells.push({
        slotTime,
        date,
        openRate: received === 0 ? 0 : (opens / received) * 100,
        count: rows.length,
      });
    }
  }

  return { slotTimes, dates, cells };
}

export type CampaignRow = {
  id: string;
  campaignId: string;
  received: number;
  blocked: number;
  opens: number;
  openPct: number;
  sessions: number;
  revenue: number;
  revenuePerSession: number;
};

export function campaignRows(records: CrmRecord[]): CampaignRow[] {
  return records
    .map((r) => ({
      id: r.id,
      campaignId: r.campaignId,
      received: r.received,
      blocked: r.blocked,
      opens: r.opens,
      openPct: r.received === 0 ? 0 : (r.opens / r.received) * 100,
      sessions: r.sessions,
      revenue: r.revenue,
      revenuePerSession: r.sessions === 0 ? 0 : r.revenue / r.sessions,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
