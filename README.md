# Childcare Watch (AU)

**Search and compare every Australian childcare and early-learning service — National Quality Standard ratings, sub-scores across all seven Quality Areas, provider chains, and per-LGA leaderboards.**

🔗 **Live:** [https://au-childcare.benrichardson.dev](https://au-childcare.benrichardson.dev)

## What is this?

Childcare Watch is an unofficial, parent-first tool for searching, comparing, and understanding every approved early-learning and childcare service in Australia. It surfaces National Quality Standard (NQS) ratings, the seven Quality Area sub-scores, previous rating cycles, and provider chain rollups — all on one page, with no logins and no ads.

Childcare ratings are public but scattered. The official ACECQA register only lets you click one service at a time, and the federal Starting Blocks site is locked to a single suburb. This site lets a parent see *every service in their LGA ranked by quality*, see *every service run by a chain provider on one page*, and trace *which services changed rating between cycles*.

The data is refreshed daily from the ACECQA National Registers — the authoritative source operated by the Australian Children's Education and Care Quality Authority.

## Who is this for?

- **Parents and carers** picking a childcare service — search by suburb or postcode, see ratings ranked, drill into any service for the seven Quality Area sub-scores.
- **Journalists and researchers** following early-childhood policy — provider chain rollups, rating change tracking, state-level comparisons, auto-detected anomalies.
- **Councillors and policy analysts** monitoring local service quality — per-suburb leaderboards, places-per-1000-children comparisons.

## Data Sources

| Source | What it provides | Update frequency |
|--------|-------------------|-----------------|
| [ACECQA National Register — Services](https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-au-export.csv) | All approved childcare/early-learning services with overall and Quality Area sub-ratings, previous-cycle ratings, address, type, approved places | Daily |
| [ACECQA National Register — Providers](https://www.acecqa.gov.au/sites/default/files/national-registers/providers/Approved-providers-au-export.csv) | Approved providers (chains), used to link services together | Daily |
| [ABS Estimated Resident Population](https://www.abs.gov.au/statistics/people/population/regional-population) | Population per state for per-capita comparisons | Annual |

## Features

- **Type-ahead suburb / service / provider search** over 18,000+ services
- **Overview** with national KPIs, state-level rating distribution, and headline insights
- **Leaderboards** ranking suburbs and providers by % Exceeding / % Working Towards / size
- **Map** of state-level performance with selectable metric (% Exceeding, % WT, places per 1,000 children, total services)
- **Quality Area matrix** heatmap revealing which services are strong everywhere vs strong in one area
- **Provider → rating flow** Sankey diagram showing which large chains skew toward Exceeding vs Working Towards
- **Rating changes** between cycles — see services that improved or dropped
- **Auto-detected insights** — providers rating Exceeding across every service, suburbs with high WT concentration, services flagged Significant Improvement Required
- **Drill-down side panel** for every service showing all seven Quality Areas, previous rating cycle, and other services run by the same provider
- **Plain-language glossary tooltips** on every NQF/NQS term, plus an About modal explaining the framework

## Tech Stack

- **Runtime:** Vanilla TypeScript
- **Build:** Vite 6
- **Testing:** Vitest (47 unit tests)
- **Hosting:** GitHub Pages (static, no backend)
- **Data:** GitHub Actions pipeline that pulls ACECQA registers daily, aggregates them, commits JSON to `public/data/`
- **Mapping:** Leaflet with CARTO basemap tiles
- **Charts:** Hand-rolled SVG (stacked bars, mini-bars, Sankey flow, matrix heatmap)

## Local Development

```bash
# Install dependencies
npm install

# Run the data pipeline (fetches ~15MB of CSV, writes JSON)
npm run pipeline

# Start dev server
npm run dev

# Run tests
npm test

# Production build
npm run build

# Preview production build
npm run preview
```

## How it works

A scheduled GitHub Action runs the data pipeline daily:

1. `pipeline/collect.mjs` downloads the ACECQA Services + Providers CSVs.
2. `pipeline/aggregate.mjs` parses them, normalises the rating values, computes per-state and per-suburb rollups, runs anomaly detection, and writes 8 JSON files into `public/data/`.
3. The frontend loads those JSON files on demand and indexes the service list in memory for instant search.

The whole site is a static bundle — no server, no database, no API keys.

## license

[GNU Affero General Public License v3.0 or later](./LICENSE), with an attribution
requirement added under section 7(b) — see
[ADDITIONAL-TERMS.md](./ADDITIONAL-TERMS.md).

In short: you may run, modify, redistribute and even sell this, but if you
distribute it — or run a modified version where other people can reach it — you
have to publish your source under the same licence and keep the attribution. A
separate commercial licence without those obligations is available on request:
<hi@ben.gy>.

Third-party components keep their own licences — see
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
