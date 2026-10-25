# CRM Performance Dashboard

Live demo: **[abhijeet-crm.vercel.app](https://abhijeet-crm.vercel.app)**

An executive CRM campaign dashboard built with Next.js. Upload a campaign/cohort
export (Excel, CSV, or PDF) and get live dispatch-to-revenue analytics — no
backend, no database, everything runs client-side in the browser.

## Features

- **Upload & column mapping** — drag/drop `.xlsx`/`.xls`/`.csv`/`.pdf`, with
  auto-detected column mapping and manual override.
- **KPI row** — total dispatched, delivery rate, open rate, total CRM revenue
  (₹, Indian lakh/crore formatting).
- **CRM funnel** — Dispatched → Received → Opened → Sessions → Revenue, with
  stage-over-stage conversion.
- **Deliverability & fatigue health** — Received / Blocked / Capped mix per
  audience cohort.
- **Brand & category performance matrix** — revenue vs. sessions bubble chart.
- **Notification release time heatmap** — open rate by release slot time and
  date.
- **Campaign drill-down table** — sortable, full campaign-level detail.

Audience cohort, brand/category, date, and release slot time are parsed
best-effort straight from the campaign/cohort identifier (e.g.
`10_Oct_0000_BFF_HMM_MCW_SF_FX_T2_MS_Y_2_A`) when a sheet doesn't have
separate columns for them.

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/base-ui components · Recharts · `xlsx` / `pdfjs-dist` for parsing.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deployed on Vercel, connected to this repo for automatic deploys on push to `main`.
