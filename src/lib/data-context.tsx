"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CrmRecord } from "./types";

type DataContextValue = {
  records: CrmRecord[];
  setRecords: (records: CrmRecord[]) => void;
  updatedAt: Date | null;
  isImporting: boolean;
};

const DataContext = createContext<DataContextValue | null>(null);

// How long the skeleton stays up after an import, regardless of how fast the
// real aggregation/render finished — long enough to read as intentional
// instead of a flicker, short enough not to feel sluggish.
const MIN_SKELETON_MS = 500;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecordsState] = useState<CrmRecord[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setRecords = useCallback((next: CrmRecord[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (next.length > 0) {
      setIsImporting(true);
      timeoutRef.current = setTimeout(() => setIsImporting(false), MIN_SKELETON_MS);
    } else {
      setIsImporting(false);
    }

    setRecordsState(next);
    setUpdatedAt(new Date());
  }, []);

  return (
    <DataContext.Provider value={{ records, setRecords, updatedAt, isImporting }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
