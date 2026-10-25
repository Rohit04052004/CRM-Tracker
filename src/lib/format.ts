// Indian numbering system: thousand (K), lakh (1,00,000 = L), crore
// (1,00,00,000 = Cr) — used throughout the dashboard instead of the
// Western million/billion convention.
export function formatCompactNumber(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_00_00_000) return `${(v / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${(v / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatINR(v: number) {
  return `₹${formatCompactNumber(v)}`;
}
