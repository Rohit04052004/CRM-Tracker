"use client";

import { DashboardFilters } from "@/lib/aggregations";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/Combobox";

export function FilterBar({
  filters,
  onChange,
  cohorts,
  brands,
}: {
  filters: DashboardFilters;
  onChange: (f: DashboardFilters) => void;
  cohorts: string[];
  brands: string[];
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap gap-2">
        <Combobox
          value={filters.cohort}
          onChange={(v) => onChange({ ...filters, cohort: v })}
          allLabel="All audience cohorts"
          options={cohorts}
          placeholder="Search cohorts..."
        />
        <Combobox
          value={filters.brand}
          onChange={(v) => onChange({ ...filters, brand: v })}
          allLabel="All brands/categories"
          options={brands}
          placeholder="Search brands..."
        />
      </CardContent>
    </Card>
  );
}
