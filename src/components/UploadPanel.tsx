"use client";

import { useRef, useState } from "react";
import { CrmRecord } from "@/lib/types";
import {
  ALL_FIELDS,
  FieldKey,
  OPTIONAL_FIELDS,
  RawRow,
  REQUIRED_FIELDS,
  autoMapHeaders,
  mapRowsToRecords,
  parseWorkbook,
} from "@/lib/importData";
import { parsePdfTable } from "@/lib/parsePdfTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, FileSpreadsheet, FileText, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ProgressPhase = "reading" | "parsing" | null;

// FileReader (unlike File.arrayBuffer()) reports real byte progress, which is
// the only part of this pipeline we can measure — parsing has no granular
// progress API, so that phase is shown as an indeterminate bar instead.
function readFileWithProgress(file: File, onProgress: (pct: number) => void): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

const FIELD_LABELS: Record<FieldKey, string> = {
  campaignId: "campaign / cohort identifier",
  dispatched: "dispatched",
  received: "receives",
  blocked: "blocks",
  capped: "capped",
  opens: "opens",
  sessions: "sessions",
  revenue: "revenue",
  cohort: "audience cohort",
  brand: "brand / category",
  date: "date",
  slotTime: "slot time",
};

const UNMAPPED = "__unmapped__";

export function UploadPanel({
  onImport,
  onClear,
  hasData,
}: {
  onImport: (records: CrmRecord[]) => void;
  onClear: () => void;
  hasData: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progressPhase, setProgressPhase] = useState<ProgressPhase>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setUploadingName(file.name);
    setProgressPhase("reading");
    setProgress(0);
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    try {
      const buffer = await readFileWithProgress(file, setProgress);
      setProgressPhase("parsing");
      setProgress(null);

      const { headers, rows } = isPdf ? await parsePdfTable(buffer) : parseWorkbook(buffer);
      if (headers.length === 0) {
        setError(
          isPdf
            ? "Couldn't find a table in that PDF — it may be a scanned image with no text layer, or the layout isn't a clean grid."
            : "Couldn't find any columns in that file."
        );
        return;
      }
      setFileName(file.name);
      setHeaders(headers);
      setRows(rows);
      setMapping(autoMapHeaders(headers));
    } catch {
      setError(
        isPdf
          ? "Couldn't read that PDF's table layout. Try exporting it as Excel or CSV instead."
          : "Couldn't read that file. Try an .xlsx, .xls, or .csv export."
      );
    } finally {
      setProgressPhase(null);
      setProgress(null);
      setUploadingName(null);
    }
  }

  function handleImport() {
    const { records, skipped } = mapRowsToRecords(rows, mapping);
    if (records.length === 0) {
      setError("No valid rows after mapping — check the required fields below.");
      return;
    }
    setResult({ imported: records.length, skipped });
    onImport(records);
  }

  function reset() {
    setFileName(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setError(null);
    setResult(null);
  }

  const missingRequired = REQUIRED_FIELDS.filter((f) => !mapping[f]);
  const hasFile = headers.length > 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {progressPhase ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center">
            <UploadCloud className="size-8 animate-pulse text-primary" />
            <div className="text-sm font-medium">{uploadingName}</div>
            <div className="w-full max-w-xs">
              <Progress value={progress} />
            </div>
            <div className="text-xs text-muted-foreground">
              {progressPhase === "reading"
                ? progress !== null
                  ? `Reading file… ${progress}%`
                  : "Reading file…"
                : "Parsing columns…"}
            </div>
          </div>
        ) : !hasFile ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
            )}
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <div className="text-sm font-medium">Drag & drop your CRM export here</div>
            <div className="text-xs text-muted-foreground">or click to browse — .xlsx, .xls, .csv, .pdf</div>
            <div className="text-xs text-muted-foreground">
              PDF support is best-effort — works for clean table exports, not scanned images
            </div>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
            {fileName?.toLowerCase().endsWith(".pdf") ? (
              <FileText className="size-5 text-muted-foreground" />
            ) : (
              <FileSpreadsheet className="size-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{fileName}</span>
            <span className="text-sm text-muted-foreground">{rows.length.toLocaleString()} rows</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={reset}>
              <X data-icon="inline-start" />
              Choose a different file
            </Button>
            {hasData && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear data
              </Button>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--status-critical)" }}>
            <AlertCircle className="size-4" />
            {error}
          </div>
        )}

        {hasFile && (
          <div>
            <div className="mb-2 text-sm font-medium">Map your columns</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {ALL_FIELDS.map((field) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">
                    {FIELD_LABELS[field]}
                    {REQUIRED_FIELDS.includes(field) && (
                      <span style={{ color: "var(--status-critical)" }}> *</span>
                    )}
                  </label>
                  <Select
                    value={mapping[field] ?? UNMAPPED}
                    onValueChange={(v) =>
                      setMapping((m) => ({ ...m, [field]: v === UNMAPPED ? undefined : v }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(v: string) => (v === UNMAPPED ? "—" : v)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNMAPPED}>
                        {OPTIONAL_FIELDS.includes(field) ? "— none, best-effort —" : "— select —"}
                      </SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <Button
              className="mt-4"
              onClick={handleImport}
              disabled={missingRequired.length > 0}
              style={{ background: "var(--status-good)", color: "#fff" }}
            >
              Import {rows.length.toLocaleString()} rows
            </Button>
            {missingRequired.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Still need: {missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}
              </div>
            )}
            <div className="mt-2 text-xs text-muted-foreground">
              Unmapped optional fields (dispatched, cohort, brand, date, slot time) are best-effort parsed
              from the campaign/cohort identifier when it follows a
              <code className="mx-1 rounded bg-muted px-1 py-0.5">day_Mon_HHMM_..._cohort_brand</code>
              pattern.
            </div>
            {result && (
              <div
                className="mt-2 flex items-center gap-1.5 text-xs"
                style={{ color: "var(--success-text)" }}
              >
                <CheckCircle2 className="size-3.5" />
                Imported {result.imported.toLocaleString()} rows
                {result.skipped > 0 &&
                  ` · skipped ${result.skipped.toLocaleString()} (missing/invalid fields)`}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
