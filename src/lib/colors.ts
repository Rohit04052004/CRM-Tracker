export const SERIES_COLORS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
];

// Every chart compares the same two series — the prior year vs. the current
// year — so these two colors are used consistently across all charts, while
// category colors (channel, brand) are reserved for small identity accents.
export const YEAR_PREV_COLOR = "var(--series-2)"; // orange
export const YEAR_CURR_COLOR = "var(--series-1)"; // blue

export function buildOrderedColorMap(orderedNames: string[]) {
  const map = new Map<string, string>();
  orderedNames.slice(0, SERIES_COLORS.length).forEach((name, i) => {
    map.set(name, SERIES_COLORS[i]);
  });
  return (name: string) => map.get(name) ?? "var(--text-muted)";
}

export function stripChannelPrefix(channel: string) {
  return channel.replace(/^\d+\./, "");
}
