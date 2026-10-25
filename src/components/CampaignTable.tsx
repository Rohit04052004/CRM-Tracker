"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { CampaignRow } from "@/lib/aggregations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SortKey = keyof Pick<
  CampaignRow,
  "campaignId" | "received" | "blocked" | "opens" | "openPct" | "sessions" | "revenue" | "revenuePerSession"
>;

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "campaignId", label: "Campaign / Cohort Identifier" },
  { key: "received", label: "Receives", align: "right" },
  { key: "blocked", label: "Blocks", align: "right" },
  { key: "opens", label: "Opens", align: "right" },
  { key: "openPct", label: "Open %", align: "right" },
  { key: "sessions", label: "Sessions", align: "right" },
  { key: "revenue", label: "Revenue", align: "right" },
  { key: "revenuePerSession", label: "RPS", align: "right" },
];

export function CampaignTable({
  rows,
  formatValue,
  formatCurrency,
}: {
  rows: CampaignRow[];
  formatValue: (v: number) => string;
  formatCurrency: (v: number) => string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="max-h-[520px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={cn("tabular cursor-pointer select-none", col.align === "right" && "text-right")}
                onClick={() => toggleSort(col.key)}
              >
                <span className={cn("inline-flex items-center gap-1", col.align === "right" && "flex-row-reverse")}>
                  {col.label}
                  {sortKey === col.key ? (
                    sortDir === "asc" ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    )
                  ) : (
                    <ArrowUpDown className="size-3 opacity-30" />
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.campaignId}</TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {formatValue(r.received)}
              </TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {formatValue(r.blocked)}
              </TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {formatValue(r.opens)}
              </TableCell>
              <TableCell className="tabular text-right font-semibold">{r.openPct.toFixed(1)}%</TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {formatValue(r.sessions)}
              </TableCell>
              <TableCell className="tabular text-right font-semibold">
                {formatCurrency(r.revenue)}
              </TableCell>
              <TableCell className="tabular text-right text-muted-foreground">
                {formatCurrency(r.revenuePerSession)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
