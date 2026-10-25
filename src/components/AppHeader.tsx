"use client";

import { BarChart3 } from "lucide-react";
import { useData } from "@/lib/data-context";
import { ModeToggle } from "@/components/mode-toggle";

export function AppHeader() {
  const { records, updatedAt } = useData();
  const hasData = records.length > 0;

  return (
    <header className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-10">
        <div className="flex items-center gap-4">
          <span className="relative flex size-11 items-center justify-center">
            <span className="absolute inset-0 animate-pulse rounded-2xl bg-primary opacity-40 blur-md" />
            <span className="relative flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <BarChart3 className="size-5" />
            </span>
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Executive CRM Performance Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {hasData
                ? `${records.length.toLocaleString()} campaign/cohort rows from your upload`
                : "Upload your CRM export to see the dashboard"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasData && (
            <div className="flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1.5 text-sm text-muted-foreground">
              <span className="relative flex size-2">
                <span
                  className="absolute inline-flex size-full animate-ping rounded-full opacity-60"
                  style={{ background: "var(--status-good)" }}
                />
                <span
                  className="relative inline-flex size-2 rounded-full"
                  style={{ background: "var(--status-good)" }}
                />
              </span>
              Live{updatedAt && ` · updated ${updatedAt.toLocaleTimeString()}`}
            </div>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
