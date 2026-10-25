import type { RawRow } from "./importData";

type PositionedText = { str: string; x: number; y: number };

// Text items on the same visual line land at (nearly) the same y — this
// tolerance absorbs PDF rounding without merging adjacent table rows.
const ROW_TOLERANCE = 3;

function groupIntoRows(items: PositionedText[]): PositionedText[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: PositionedText[][] = [];
  for (const item of sorted) {
    if (!item.str.trim()) continue;
    const row = rows.find((r) => Math.abs(r[0].y - item.y) <= ROW_TOLERANCE);
    if (row) row.push(item);
    else rows.push([item]);
  }
  rows.forEach((r) => r.sort((a, b) => a.x - b.x));
  return rows;
}

// Uses the header row's x-positions as column boundaries, then buckets every
// other row's text items into whichever column they fall under — the
// standard heuristic for recovering a grid from a PDF's flat text layer.
function assignToColumns(row: PositionedText[], columnStarts: number[]): string[] {
  const cells: string[][] = columnStarts.map(() => []);
  for (const item of row) {
    let colIndex = 0;
    for (let i = 0; i < columnStarts.length; i++) {
      if (columnStarts[i] <= item.x + 0.5) colIndex = i;
    }
    cells[colIndex].push(item.str);
  }
  return cells.map((parts) => parts.join(" ").trim());
}

// Best-effort: extracts a table from a PDF's text layer by treating the
// first line as a header row and clustering every other line's text into
// those column positions. Works well for clean, grid-aligned exports;
// scanned/image-only PDFs have no text layer and will yield no rows.
export async function parsePdfTable(buffer: ArrayBuffer): Promise<{ headers: string[]; rows: RawRow[] }> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const allRows: PositionedText[][] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const items: PositionedText[] = content.items
      .filter((it) => "str" in it)
      .map((it) => {
        const textItem = it as { str: string; transform: number[] };
        return { str: textItem.str, x: textItem.transform[4], y: textItem.transform[5] };
      });
    allRows.push(...groupIntoRows(items));
  }

  if (allRows.length === 0) return { headers: [], rows: [] };

  const headerRow = allRows[0];
  const headers = headerRow.map((item) => item.str.trim()).filter(Boolean);
  const columnStarts = headerRow.map((item) => item.x);
  const headerKey = headers.join("|").toLowerCase();

  const rows: RawRow[] = [];
  for (let i = 1; i < allRows.length; i++) {
    const cells = assignToColumns(allRows[i], columnStarts);
    const rowKey = cells.join("|").toLowerCase();
    if (rowKey === headerKey) continue; // a repeated header row on a later page
    if (cells.every((c) => !c)) continue;

    const rowObj: RawRow = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cells[idx] ?? "";
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}
