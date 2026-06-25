# Site Plan: Childcare Watch (AU)

## Overview
- **Name:** Childcare Watch (AU)
- **Repo name:** au-childcare
- **Tagline:** Search and compare every Australian childcare and early-learning service — National Quality Standard ratings, sub-scores across all seven Quality Areas, provider history, and per-LGA leaderboards.

## Target Audience
Australian parents and carers picking a childcare service, plus journalists, councillors, and policy researchers tracking the National Quality Framework. Specifically: a parent on a phone in the evening typing the name of their suburb, wanting to know which services nearby are *Exceeding NQS*, what the previous rating cycle said, and whether the provider runs other services that rate well.

## Value Proposition
Childcare ratings are public but scattered across `acecqa.gov.au` (a slow, search-only UI with one row per click) and the federal `startingblocks.gov.au` (consumer-friendly but locked to one suburb at a time). Nowhere can a parent see *every service in their LGA ranked by quality*, or *every service run by a chain provider on one page*. This site does both, plus surfaces previous-cycle ratings so trend stories are visible.

## Data Sources
| Source | URL | What it provides | Update frequency | Auth required? |
|--------|-----|-------------------|-----------------|----------------|
| ACECQA National Register — Services | https://www.acecqa.gov.au/sites/default/files/national-registers/services/Education-services-au-export.csv | All ~31,600 approved childcare/early-learning services, with overall and Quality Area sub-ratings, previous-cycle ratings, address, type, approved places, hours of operation | Daily | No |
| ACECQA National Register — Providers | https://www.acecqa.gov.au/sites/default/files/national-registers/providers/Approved-providers-au-export.csv | ~10,900 approved providers, links services to chains | Daily | No |
| ABS Estimated Resident Population by LGA | https://www.abs.gov.au/statistics/people/population/regional-population/2024-25/32180DS0002_2024-25.xlsx | Population per LGA for per-capita and places-per-1000-children analysis | Annual | No |

## Key Features
1. **Type-ahead suburb / service / provider search** — instant filter on a 30k-row dataset using a prebuilt search index, hash-routable for shareable links.
2. **LGA leaderboards** — services in any LGA ranked by overall rating, with "% Exceeding NQS" and "% Working Towards" headline figures.
3. **Provider chain page** — every service run by a single provider on one page, with a small-multiples chart of Quality Area scores.
4. **State / LGA map** — choropleth of "% of services Exceeding NQS" by LGA, plus toggle for "places per 1,000 children".
5. **Quality Area matrix view** — heatmap of services × the 7 Quality Areas, colour-coded by rating; reveals services strong everywhere vs strong in one area.
6. **Rating-change view** — services whose previous-cycle rating differed from current, sorted by direction and magnitude of change.
7. **Auto-detected insights** — providers with all-Exceeding services, LGAs with zero Working-Towards services, suburb clusters of low-rated services, services rated *Significant Improvement Required*.
8. **Glossary tooltips** on every NQS term (Quality Area, NQS, Exceeding, etc.) plus an About modal explaining the National Quality Framework.

## Target Audience (detailed)
Two primary personas:
- **Parent**, evening, phone, anxious, knows the name of their suburb but not "Quality Area 5", just wants a clear ranked list and a sense of which provider chains run well-rated services nearby.
- **Researcher / councillor**, desktop, wants to compare LGAs, see whether a provider chain is consistently strong or has one rogue service, and cite an authoritative-feeling source.

The site has to feel calm and trustworthy — not a data-tool aesthetic. Closer to a government-portal feel than a terminal-monitoring feel.

## Style Direction
**Tone:** calm, trustworthy, civic.
**Colour palette:** soft warm off-white background (#fbfaf7), navy primary (#1e3a5f), warm coral accent for "Exceeding" (#d97757 muted), neutral greys for borders. Rating colours: Excellent = deep teal, Exceeding = warm green, Meeting = warm blue, Working Towards = amber, Significant Improvement Required = warm red. No harsh blacks or pure whites.
**UI density:** balanced — not as dense as a data tool, not as airy as a marketing site. Like a well-designed council search page.
**Dark/light theme:** light. This is for parents, not analysts.
**Reference sites for tone:** startingblocks.gov.au, fuelaustralia.org.

## Technical Architecture
- **Stack:** Vanilla TypeScript + Vite
- **Data strategy:** pipeline — collect ACECQA CSVs + ABS LGA population once, aggregate to per-LGA and per-provider JSON, ship to `public/data/`
- **Key libraries:** Leaflet for the LGA choropleth (with GeoJSON of Australian LGA boundaries from the ABS); otherwise hand-rolled SVG charts and search

## Layout
Single-page app with top nav switching between views. Header (52px): site title + nav tabs + search box (always visible on desktop, opens as overlay on mobile). Main content fills the remaining viewport with a max-width of 1600px. Sticky footer with data attribution and "Built by benrichardson.dev".

Below 768px: nav becomes a horizontal scroll strip; tables compact to card rows; map fills full width.

## Pages/Views
1. **Home / search** — search box + summary stats + leaderboard preview
2. **Services list** — full filterable table of all ~31,600 services
3. **LGA leaderboards** — ranked LGAs with click-to-drill-down
4. **Provider chains** — providers with 5+ services, ranked by average rating
5. **Map** — Leaflet choropleth of LGA-level rating distribution
6. **Quality Area matrix** — heatmap view
7. **Rating changes** — services that moved between cycles
8. **Insights** — auto-generated anomaly cards
9. **About** — modal: what NQF is, where the data comes from, caveats

Drill-down: clicking any service opens a side panel with all 7 Quality Area ratings, previous-cycle comparison, the operating hours grid, and a "see all services from this provider" link.

## Visualization Strategy
- **Leaderboard bar charts** — services per LGA, with stacked colour for each rating tier. Adds: ranking insight, headline ordering.
- **LGA choropleth map** — % Exceeding NQS by LGA, with toggle to "places per 1,000 children under 5". Adds: geographic context, identifies cold spots / hot spots.
- **Quality Area matrix heatmap** — rows = services (top N by rating), columns = Quality Areas 1–7, cell colour = rating. Adds: cross-area strength visualisation.
- **Provider chain small-multiples** — for each provider with >5 services, a small bar chart of overall ratings across their services. Adds: chain quality consistency story.
- **Sankey-style flow** — providers (left) → ratings (right), width = service count. Aggregated to top 30 providers + 5 rating tiers. Adds: chain → outcome story, identifies which chains skew which way.
- **Rating-change scatter** — previous rating vs current rating, jittered. Adds: trend insight.
- **Sortable services table** — always available as the data-dense fallback view.

Minimum 5 view tabs satisfied: Search/Table, Leaderboards, Map, Matrix, Flow, Insights, Changes.
