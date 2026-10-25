import * as XLSX from "xlsx";
import { CrmRecord } from "./types";

export type RawRow = Record<string, unknown>;

export type FieldKey =
  | "campaignId"
  | "dispatched"
  | "received"
  | "blocked"
  | "capped"
  | "opens"
  | "sessions"
  | "revenue"
  | "cohort"
  | "brand"
  | "date"
  | "slotTime";

export const REQUIRED_FIELDS: FieldKey[] = ["campaignId", "received", "opens", "sessions", "revenue"];
export const OPTIONAL_FIELDS: FieldKey[] = [
  "dispatched",
  "blocked",
  "capped",
  "cohort",
  "brand",
  "date",
  "slotTime",
];
export const ALL_FIELDS: FieldKey[] = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const SYNONYMS: Record<FieldKey, string[]> = {
  campaignId: [
    "campaign cohort identifier",
    "campaign/cohort identifier",
    "cohort identifier",
    "campaign identifier",
    "campaign id",
    "campaign",
    "identifier",
    "notification id",
    "push id",
  ],
  dispatched: ["dispatched", "total dispatched", "sent", "sends", "dispatch"],
  received: ["receives", "received", "delivered", "delivery", "recv"],
  blocked: ["blocks", "blocked", "blk"],
  capped: ["capped", "caps", "cap"],
  opens: ["opens", "opened", "open"],
  sessions: ["sessions", "session"],
  revenue: ["revenue", "crm revenue", "total crm revenue"],
  cohort: ["audience cohort", "cohort", "audience", "segment"],
  brand: ["brand", "category", "brand category", "brand/category"],
  date: ["date", "send date", "load date", "release date"],
  slotTime: ["slot time", "time", "release time", "notification release time", "hour"],
};

function normalize(s: string) {
  return s
    .replace(/^﻿/, "")
    .trim()
    .toLowerCase()
    .replace(/[_\-/]+/g, " ")
    .replace(/\s+/g, " ");
}

export function parseWorkbook(buffer: ArrayBuffer): { headers: string[]; rows: RawRow[] } {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

// Best-effort auto-mapping from sheet headers to our schema fields — tries an
// exact normalized match first, then a substring match, so real-world header
// spellings (e.g. "Open %" vs "opens", "Recv" vs "received") still map.
export function autoMapHeaders(headers: string[]): Partial<Record<FieldKey, string>> {
  const mapping: Partial<Record<FieldKey, string>> = {};
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalize(h) }));
  const used = new Set<string>();

  for (const field of ALL_FIELDS) {
    const candidates = SYNONYMS[field];
    const exact = normalizedHeaders.find((h) => !used.has(h.raw) && candidates.includes(h.norm));
    if (exact) {
      mapping[field] = exact.raw;
      used.add(exact.raw);
    }
  }

  for (const field of ALL_FIELDS) {
    if (mapping[field]) continue;
    const candidates = SYNONYMS[field];
    const fuzzy = normalizedHeaders.find(
      (h) => !used.has(h.raw) && candidates.some((c) => h.norm.includes(c) || c.includes(h.norm))
    );
    if (fuzzy) {
      mapping[field] = fuzzy.raw;
      used.add(fuzzy.raw);
    }
  }

  return mapping;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[,$%\s]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function toDateString(v: unknown): string | null {
  if (v instanceof Date) return v.toISOString().slice(0, 10);

  if (typeof v === "number") {
    if (v >= 10_000_000 && v <= 99_999_999) {
      const s = String(v);
      const dt = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
      if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }
    const parsed = XLSX.SSF.parse_date_code(v);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d).toISOString().slice(0, 10);
  }

  if (typeof v === "string") {
    const digitsOnly = v.trim();
    if (/^\d{8}$/.test(digitsOnly)) return toDateString(Number(digitsOnly));
    const parsed = new Date(v);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }

  return null;
}

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
];

// Real-world campaign identifiers (e.g.
// "10_Oct_0000_BFF_HMM_MCW_SF_FX_T2_MS_Y_2_A" or, when an "EA" segment marks
// an early-access variant, "7_Oct_2000_BFF_EA_VIPPM_MCW_SF") encode
// day/month/release-time, a campaign code, then an audience cohort + brand
// tag inline: `day_Mon_HHMM_<code>_[EA_]<cohort>_<brand>_...`. When a sheet
// doesn't have separate columns for those, we recover them best-effort from
// the identifier so the heatmap/cohort/brand views still work.
export function parseCampaignIdentifier(id: string): {
  dateLabel: string | null;
  slotTime: string | null;
  cohort: string | null;
  brand: string | null;
} {
  const tokens = id.split(/[_\s]+/).filter(Boolean);
  let dateLabel: string | null = null;
  let slotTime: string | null = null;
  let cohort: string | null = null;
  let brand: string | null = null;

  if (/^\d{1,2}$/.test(tokens[0] ?? "") && MONTHS.includes((tokens[1] ?? "").toLowerCase().slice(0, 3))) {
    const day = tokens[0];
    const month = tokens[1].slice(0, 3);
    dateLabel = `${day}-${month[0].toUpperCase()}${month.slice(1).toLowerCase()}`;
  }

  if (/^\d{3,4}$/.test(tokens[2] ?? "")) {
    const padded = tokens[2].padStart(4, "0");
    slotTime = `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
  }

  // tokens[3] is the campaign code (e.g. "BFF"); the cohort normally follows
  // it directly, unless it's preceded by an "EA" early-access marker, in
  // which case the real cohort/brand each shift one token to the right.
  const cohortIdx = (tokens[4] ?? "").toLowerCase() === "ea" ? 5 : 4;
  if (tokens[cohortIdx]) {
    cohort = tokens[cohortIdx];
    brand = tokens[cohortIdx + 1] ?? null;
  }

  return { dateLabel, slotTime, cohort, brand };
}

export function mapRowsToRecords(
  rows: RawRow[],
  mapping: Partial<Record<FieldKey, string>>
): { records: CrmRecord[]; skipped: number } {
  const records: CrmRecord[] = [];
  let skipped = 0;

  rows.forEach((row, idx) => {
    const campaignCol = mapping.campaignId;
    const receivedCol = mapping.received;
    const opensCol = mapping.opens;
    const sessionsCol = mapping.sessions;
    const revenueCol = mapping.revenue;
    if (!campaignCol || !receivedCol || !opensCol || !sessionsCol || !revenueCol) {
      skipped++;
      return;
    }

    const campaignId = String(row[campaignCol] ?? "").trim();
    if (!campaignId) {
      skipped++;
      return;
    }

    const received = toNumber(row[receivedCol]);
    const opens = toNumber(row[opensCol]);
    const sessions = toNumber(row[sessionsCol]);
    const revenue = toNumber(row[revenueCol]);
    const blocked = mapping.blocked ? toNumber(row[mapping.blocked]) : 0;
    const capped = mapping.capped ? toNumber(row[mapping.capped]) : 0;
    const dispatched = mapping.dispatched
      ? toNumber(row[mapping.dispatched])
      : received + blocked + capped;

    const parsed = parseCampaignIdentifier(campaignId);

    const cohortRaw = mapping.cohort ? String(row[mapping.cohort] ?? "").trim() : "";
    const brandRaw = mapping.brand ? String(row[mapping.brand] ?? "").trim() : "";
    const dateRaw = mapping.date ? row[mapping.date] : undefined;

    records.push({
      id: `C${idx.toString().padStart(6, "0")}`,
      campaignId,
      date: mapping.date ? toDateString(dateRaw) : parsed.dateLabel,
      slotTime: mapping.slotTime ? String(row[mapping.slotTime] ?? "").trim() || null : parsed.slotTime,
      cohort: cohortRaw || parsed.cohort || "Unknown",
      brand: brandRaw || parsed.brand || "Unknown",
      dispatched,
      received,
      blocked,
      capped,
      opens,
      sessions,
      revenue,
    });
  });

  return { records, skipped };
}
