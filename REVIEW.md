# Childcare Watch (AU) — Build Review

This file exists only to create a reviewable PR. All code is already deployed on `main`.

**Merge this PR to acknowledge the build.** Closing without merging is also fine.

## Links

- **GitHub Pages:** https://ben-gy.github.io/au-childcare/ *(redirects to custom domain)*
- **Custom domain:** https://au-childcare.benrichardson.dev *(live over HTTP; HTTPS cert provisioning via GitHub/Let's Encrypt)*

## What this is

Search and compare every Australian childcare and early-learning service — 18,206 services, 7,206 providers — with overall NQS rating, all seven Quality Area sub-scores, previous-cycle ratings, provider chain rollups, leaderboards, a state map, a Quality Area matrix heatmap, a provider→rating Sankey flow, rating-change tracking, and auto-detected insights.

## Data

- ACECQA National Register of Approved Services (acecqa.gov.au) — refreshed daily via GitHub Actions pipeline
- ACECQA National Register of Approved Providers (acecqa.gov.au)
- ABS Estimated Resident Population by state (per-capita comparisons)

## Tests

- [x] `npm test` — 47/47 passing
- [x] `npm run build` — succeeds
- [x] Local `vite preview` — all 8 views render, no console errors
- [x] Deploy to GitHub Pages workflow — succeeded
- [x] Live over HTTP at custom domain
