// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
// Aggregate raw ACECQA CSVs into compact JSON files served from public/data/.
//
// Output:
//   public/data/services.json      — compact array of services (all rows)
//   public/data/providers.json     — array of providers with service-count rollup
//   public/data/summary.json       — top-level stats: counts by rating, by state, by service type
//   public/data/by-state.json      — per-state stats (count, % by rating, places)
//   public/data/by-lga.json        — per-LGA stats (synthesised from postcode → LGA mapping; falls back to suburb groups)
//   public/data/insights.json      — auto-detected anomalies
//   public/data/changes.json       — services whose previous rating != current rating

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './csv.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE = join(__dirname, 'cache');
const OUT = join(__dirname, '..', 'public', 'data');

// Approx ABS Estimated Resident Population by State (Jun 2024, 0–4 yr cohort × adjustment for 0–12 incl. school-aged).
// Used for per-capita "places per 1,000 children" comparisons. Hand-curated, stable values.
const STATE_POP_CHILDREN_0_12 = {
  NSW: 1_320_000,
  VIC: 1_080_000,
  QLD: 880_000,
  WA: 440_000,
  SA: 270_000,
  TAS: 80_000,
  ACT: 70_000,
  NT: 50_000,
};

const STATE_FULL = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  ACT: 'Australian Capital Territory',
  NT: 'Northern Territory',
};

const RATINGS = [
  'Excellent',
  'Exceeding NQS',
  'Meeting NQS',
  'Working Towards NQS',
  'Significant Improvement Required',
];

const RATING_RANK = {
  Excellent: 5,
  'Exceeding NQS': 4,
  'Meeting NQS': 3,
  'Working Towards NQS': 2,
  'Significant Improvement Required': 1,
};

function getField(row, ...names) {
  for (const n of names) {
    if (row[n] != null && row[n] !== '') return row[n];
    // Try case-insensitive match
    const k = Object.keys(row).find((x) => x.toLowerCase() === n.toLowerCase());
    if (k && row[k] !== '') return row[k];
  }
  return '';
}

function normaliseRating(raw) {
  if (!raw) return '';
  const v = raw.trim();
  if (RATINGS.includes(v)) return v;
  // Common variants
  if (/^excellent/i.test(v)) return 'Excellent';
  if (/exceeding/i.test(v)) return 'Exceeding NQS';
  if (/meeting/i.test(v)) return 'Meeting NQS';
  if (/working\s*towards/i.test(v)) return 'Working Towards NQS';
  if (/significant\s*improvement/i.test(v)) return 'Significant Improvement Required';
  return v; // pass through "Provisional", "Not yet rated", etc.
}

function detectType(row) {
  // ACECQA CSV has boolean-ish columns for each service type
  const longDay = row['Long Day Care'] || '';
  const psSchool = row['Preschool/Kindergarten - Part of a School'] || '';
  const psStand = row['Preschool/Kindergarten - Stand alone'] || '';
  const oshcAfter = row['Outside school Hours Care - After/Before School'] || '';
  const oshcVac = row['Outside school Hours Care - Vacation Care'] || '';
  const other = row['Other'] || '';
  const yes = (v) => /^(y|yes|true|1)$/i.test(String(v).trim());
  const types = [];
  if (yes(longDay)) types.push('Long Day Care');
  if (yes(psSchool)) types.push('Preschool (School)');
  if (yes(psStand)) types.push('Preschool (Stand-alone)');
  if (yes(oshcAfter)) types.push('OSHC (Before/After)');
  if (yes(oshcVac)) types.push('OSHC (Vacation)');
  if (yes(other)) types.push('Other');
  if (!types.length) {
    // fallback to ServiceType if present
    const st = row['ServiceType'] || row['Service Type'] || '';
    if (st) types.push(st);
  }
  return types;
}

function parseInt0(v) {
  const n = parseInt(String(v).replace(/[, ]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main() {
  await mkdir(OUT, { recursive: true });

  console.log('Reading services.csv ...');
  const servicesCsv = await readFile(join(CACHE, 'services.csv'), 'utf8');
  const servicesRaw = parseCsv(servicesCsv);
  console.log(`  ${servicesRaw.length.toLocaleString()} service rows`);

  console.log('Reading providers.csv ...');
  const providersCsv = await readFile(join(CACHE, 'providers.csv'), 'utf8');
  const providersRaw = parseCsv(providersCsv);
  console.log(`  ${providersRaw.length.toLocaleString()} provider rows`);

  // ─── Services ──────────────────────────────────────────────
  const services = servicesRaw.map((r) => {
    const overall = normaliseRating(getField(r, 'OverallRating', 'Overall Rating'));
    const prevOverall = normaliseRating(getField(r, 'PreviousOverallRating', 'Previous Overall Rating'));
    const qa = [];
    for (let i = 1; i <= 7; i++) {
      qa.push(normaliseRating(getField(r, `QualityArea${i}Rating`, `Quality Area ${i} Rating`)));
    }
    const prevQa = [];
    for (let i = 1; i <= 7; i++) {
      prevQa.push(normaliseRating(getField(r, `PreviousQualityArea${i}Rating`, `Previous Quality Area ${i} Rating`)));
    }
    const types = detectType(r);
    return {
      san: getField(r, 'ServiceApprovalNumber', 'Service Approval Number'),
      pan: getField(r, 'Provider Approval Number', 'ProviderApprovalNumber'),
      name: getField(r, 'ServiceName', 'Service Name'),
      provider: getField(r, 'ProviderLegalName', 'Provider Legal Name'),
      address: getField(r, 'ServiceAddress', 'Service Address'),
      suburb: getField(r, 'Suburb'),
      state: getField(r, 'State'),
      postcode: getField(r, 'Postcode'),
      phone: getField(r, 'Phone'),
      types,
      places: parseInt0(getField(r, 'NumberOfApprovedPlaces', 'Number Of Approved Places')),
      rating: overall,
      qa,
      prevRating: prevOverall,
      prevQa,
      issued: getField(r, 'RatingsIssued', 'Ratings Issued'),
      prevIssued: getField(r, 'PreviousRatingsIssued', 'Previous Ratings Issued'),
      closed: /^(y|yes|true|1)$/i.test(getField(r, 'Temporarily Closed').trim()),
    };
  });

  // ─── Providers ─────────────────────────────────────────────
  // Build provider rollup from services (more reliable than provider CSV joining)
  const providerMap = new Map();
  for (const s of services) {
    const key = s.pan;
    if (!key) continue;
    if (!providerMap.has(key)) {
      providerMap.set(key, {
        pan: key,
        name: s.provider,
        services: 0,
        places: 0,
        states: new Set(),
        ratings: { Excellent: 0, 'Exceeding NQS': 0, 'Meeting NQS': 0, 'Working Towards NQS': 0, 'Significant Improvement Required': 0, Other: 0 },
        ratedCount: 0,
        ratingScoreSum: 0,
      });
    }
    const p = providerMap.get(key);
    p.services++;
    p.places += s.places;
    if (s.state) p.states.add(s.state);
    if (Object.prototype.hasOwnProperty.call(p.ratings, s.rating)) {
      p.ratings[s.rating]++;
      if (RATING_RANK[s.rating]) {
        p.ratingScoreSum += RATING_RANK[s.rating];
        p.ratedCount++;
      }
    } else if (s.rating) {
      p.ratings.Other++;
    }
  }
  const providers = [...providerMap.values()].map((p) => ({
    pan: p.pan,
    name: p.name,
    services: p.services,
    places: p.places,
    states: [...p.states].sort(),
    ratings: p.ratings,
    avgScore: p.ratedCount ? +(p.ratingScoreSum / p.ratedCount).toFixed(2) : 0,
    ratedCount: p.ratedCount,
  }));
  providers.sort((a, b) => b.services - a.services);

  // ─── Summary ───────────────────────────────────────────────
  const byRating = { Excellent: 0, 'Exceeding NQS': 0, 'Meeting NQS': 0, 'Working Towards NQS': 0, 'Significant Improvement Required': 0, Other: 0 };
  const byType = {};
  for (const s of services) {
    if (Object.prototype.hasOwnProperty.call(byRating, s.rating)) byRating[s.rating]++;
    else if (s.rating) byRating.Other++;
    for (const t of s.types) byType[t] = (byType[t] || 0) + 1;
  }
  const totalPlaces = services.reduce((acc, s) => acc + s.places, 0);

  // ─── By state ──────────────────────────────────────────────
  const byState = {};
  for (const code of Object.keys(STATE_FULL)) {
    byState[code] = {
      code,
      name: STATE_FULL[code],
      services: 0,
      places: 0,
      ratings: { Excellent: 0, 'Exceeding NQS': 0, 'Meeting NQS': 0, 'Working Towards NQS': 0, 'Significant Improvement Required': 0, Other: 0 },
      ratedCount: 0,
    };
  }
  for (const s of services) {
    const code = s.state;
    if (!byState[code]) continue;
    byState[code].services++;
    byState[code].places += s.places;
    if (Object.prototype.hasOwnProperty.call(byState[code].ratings, s.rating)) {
      byState[code].ratings[s.rating]++;
      if (RATING_RANK[s.rating]) byState[code].ratedCount++;
    } else if (s.rating) {
      byState[code].ratings.Other++;
    }
  }
  // Compute per-capita
  for (const code of Object.keys(byState)) {
    const pop = STATE_POP_CHILDREN_0_12[code] || 1;
    byState[code].placesPer1000 = +((byState[code].places / pop) * 1000).toFixed(1);
    const rated = byState[code].ratedCount || 1;
    byState[code].pctExceedingPlus = +(((byState[code].ratings['Exceeding NQS'] + byState[code].ratings.Excellent) / rated) * 100).toFixed(1);
    byState[code].pctWorkingTowards = +((byState[code].ratings['Working Towards NQS'] / rated) * 100).toFixed(1);
  }

  // ─── By LGA / suburb group ─────────────────────────────────
  // The ACECQA file doesn't include LGA, only suburb + postcode. We synthesise "geographic groups"
  // by suburb (a useful drill-down level for parents) and surface top groups.
  const suburbMap = new Map();
  for (const s of services) {
    const key = `${s.suburb}|${s.state}`;
    if (!s.suburb) continue;
    if (!suburbMap.has(key)) {
      suburbMap.set(key, {
        key,
        suburb: s.suburb,
        state: s.state,
        services: 0,
        places: 0,
        ratings: { Excellent: 0, 'Exceeding NQS': 0, 'Meeting NQS': 0, 'Working Towards NQS': 0, 'Significant Improvement Required': 0, Other: 0 },
        ratedCount: 0,
      });
    }
    const g = suburbMap.get(key);
    g.services++;
    g.places += s.places;
    if (Object.prototype.hasOwnProperty.call(g.ratings, s.rating)) {
      g.ratings[s.rating]++;
      if (RATING_RANK[s.rating]) g.ratedCount++;
    } else if (s.rating) {
      g.ratings.Other++;
    }
  }
  const suburbs = [...suburbMap.values()].map((g) => ({
    ...g,
    pctExceedingPlus: g.ratedCount ? +(((g.ratings['Exceeding NQS'] + g.ratings.Excellent) / g.ratedCount) * 100).toFixed(1) : 0,
    pctWorkingTowards: g.ratedCount ? +((g.ratings['Working Towards NQS'] / g.ratedCount) * 100).toFixed(1) : 0,
  }));

  // ─── Insights / anomalies ─────────────────────────────────
  const insights = [];

  // 1. Providers with all-Exceeding ratings and 5+ services
  const allExceedingProviders = providers
    .filter((p) => p.services >= 5 && p.ratings['Exceeding NQS'] + p.ratings.Excellent === p.ratedCount && p.ratedCount >= 5)
    .slice(0, 10);
  if (allExceedingProviders.length) {
    insights.push({
      severity: 'info',
      title: 'Provider chains rating Exceeding or Excellent across every service',
      detail: `${allExceedingProviders.length} provider${allExceedingProviders.length === 1 ? '' : 's'} with 5+ services have every rated service at Exceeding NQS or above. Top: ${allExceedingProviders.slice(0, 5).map((p) => p.name).join('; ')}.`,
      providers: allExceedingProviders.map((p) => ({ pan: p.pan, name: p.name, services: p.services })),
    });
  }

  // 2. Services flagged Significant Improvement Required
  const sir = services.filter((s) => s.rating === 'Significant Improvement Required');
  if (sir.length) {
    insights.push({
      severity: 'alert',
      title: 'Services currently rated Significant Improvement Required',
      detail: `${sir.length} service${sir.length === 1 ? '' : 's'} sit at the lowest National Quality Standard rating tier. This is the rating regulators issue when a service is failing multiple Quality Areas.`,
      sample: sir.slice(0, 20).map((s) => ({ san: s.san, name: s.name, suburb: s.suburb, state: s.state })),
    });
  }

  // 3. LGAs / suburb groups with 5+ services and zero Working Towards
  const cleanSuburbs = suburbs.filter((s) => s.services >= 5 && s.ratings['Working Towards NQS'] === 0 && s.ratedCount >= 5);
  cleanSuburbs.sort((a, b) => b.services - a.services);
  if (cleanSuburbs.length) {
    insights.push({
      severity: 'info',
      title: 'Suburbs with 5+ services and zero Working Towards',
      detail: `${cleanSuburbs.length} suburbs have at least 5 rated services and no service rated Working Towards NQS. Top by size: ${cleanSuburbs.slice(0, 6).map((g) => `${g.suburb} (${g.state}) ${g.services}`).join(', ')}.`,
      suburbs: cleanSuburbs.slice(0, 30).map((g) => ({ suburb: g.suburb, state: g.state, services: g.services })),
    });
  }

  // 4. Suburb clusters of low quality (5+ services, ≥40% Working Towards)
  const lowSuburbs = suburbs.filter((s) => s.services >= 5 && s.pctWorkingTowards >= 40);
  lowSuburbs.sort((a, b) => b.pctWorkingTowards - a.pctWorkingTowards);
  if (lowSuburbs.length) {
    insights.push({
      severity: 'warn',
      title: 'Suburbs with high concentrations of Working Towards services',
      detail: `${lowSuburbs.length} suburbs have 40% or more of their rated services sitting at Working Towards NQS. Highest: ${lowSuburbs.slice(0, 5).map((g) => `${g.suburb} (${g.state}) ${g.pctWorkingTowards}%`).join(', ')}.`,
      suburbs: lowSuburbs.slice(0, 30).map((g) => ({ suburb: g.suburb, state: g.state, services: g.services, pct: g.pctWorkingTowards })),
    });
  }

  // 5. Largest single-provider services
  const bigServices = [...services].sort((a, b) => b.places - a.places).slice(0, 10);
  insights.push({
    severity: 'info',
    title: 'Largest approved services by place count',
    detail: `Top-10 services by approved places. Approved places is the regulatory cap on how many children can be on premises at once.`,
    sample: bigServices.map((s) => ({ san: s.san, name: s.name, suburb: s.suburb, state: s.state, places: s.places })),
  });

  // 6. Rating downgrades (previous Exceeding/Excellent → current Working Towards / SIR)
  const downgrades = services.filter((s) =>
    (s.prevRating === 'Exceeding NQS' || s.prevRating === 'Excellent') &&
    (s.rating === 'Working Towards NQS' || s.rating === 'Significant Improvement Required'),
  );
  if (downgrades.length) {
    insights.push({
      severity: 'warn',
      title: 'Services that dropped from Exceeding/Excellent to Working Towards or below',
      detail: `${downgrades.length} service${downgrades.length === 1 ? '' : 's'} dropped two or more tiers between rating cycles.`,
      sample: downgrades.slice(0, 30).map((s) => ({ san: s.san, name: s.name, suburb: s.suburb, state: s.state, prev: s.prevRating, now: s.rating })),
    });
  }

  // 7. Rating upgrades (previous Working Towards / SIR → current Exceeding/Excellent)
  const upgrades = services.filter((s) =>
    (s.prevRating === 'Working Towards NQS' || s.prevRating === 'Significant Improvement Required') &&
    (s.rating === 'Exceeding NQS' || s.rating === 'Excellent'),
  );
  if (upgrades.length) {
    insights.push({
      severity: 'info',
      title: 'Services that climbed from Working Towards or below to Exceeding/Excellent',
      detail: `${upgrades.length} service${upgrades.length === 1 ? '' : 's'} improved two or more tiers between rating cycles.`,
      sample: upgrades.slice(0, 30).map((s) => ({ san: s.san, name: s.name, suburb: s.suburb, state: s.state, prev: s.prevRating, now: s.rating })),
    });
  }

  // ─── Changes view ──────────────────────────────────────────
  const changes = services
    .filter((s) => s.prevRating && s.rating && s.prevRating !== s.rating)
    .map((s) => ({
      san: s.san,
      name: s.name,
      provider: s.provider,
      suburb: s.suburb,
      state: s.state,
      prev: s.prevRating,
      now: s.rating,
      delta: (RATING_RANK[s.rating] || 0) - (RATING_RANK[s.prevRating] || 0),
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  // ─── Quality Area aggregates (for matrix view) ─────────────
  // For the matrix view, sample top-rated and bottom-rated services + a random middle
  const qaMatrixSample = [];
  const ratedServices = services.filter((s) => s.qa.every((q) => RATING_RANK[q] || q === 'Excellent'));
  ratedServices.sort((a, b) => {
    const aScore = a.qa.reduce((acc, q) => acc + (RATING_RANK[q] || 0), 0);
    const bScore = b.qa.reduce((acc, q) => acc + (RATING_RANK[q] || 0), 0);
    return bScore - aScore;
  });
  qaMatrixSample.push(...ratedServices.slice(0, 30)); // top 30
  qaMatrixSample.push(...ratedServices.slice(-30)); // bottom 30
  // Middle slice
  const mid = Math.floor(ratedServices.length / 2);
  qaMatrixSample.push(...ratedServices.slice(Math.max(0, mid - 15), mid + 15));
  // De-dupe
  const seen = new Set();
  const qaMatrix = [];
  for (const s of qaMatrixSample) {
    if (seen.has(s.san)) continue;
    seen.add(s.san);
    qaMatrix.push({ san: s.san, name: s.name, suburb: s.suburb, state: s.state, qa: s.qa });
  }

  // ─── Write outputs ────────────────────────────────────────
  const summary = {
    generated: new Date().toISOString(),
    totalServices: services.length,
    totalProviders: providers.length,
    totalPlaces,
    byRating,
    byType,
    statePopChildren012: STATE_POP_CHILDREN_0_12,
  };

  // Trim the services for the wire format
  const servicesWire = services.map((s) => ({
    a: s.san,
    p: s.pan,
    n: s.name,
    pr: s.provider,
    ad: s.address,
    sb: s.suburb,
    st: s.state,
    pc: s.postcode,
    ph: s.phone,
    tp: s.types,
    pl: s.places,
    r: s.rating,
    qa: s.qa,
    pv: s.prevRating,
    pq: s.prevQa,
    i: s.issued,
    pi: s.prevIssued,
    c: s.closed ? 1 : 0,
  }));

  await writeFile(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  await writeFile(join(OUT, 'services.json'), JSON.stringify(servicesWire));
  await writeFile(join(OUT, 'providers.json'), JSON.stringify(providers));
  await writeFile(join(OUT, 'by-state.json'), JSON.stringify(byState, null, 2));
  await writeFile(join(OUT, 'by-suburb.json'), JSON.stringify(suburbs));
  await writeFile(join(OUT, 'insights.json'), JSON.stringify(insights, null, 2));
  await writeFile(join(OUT, 'changes.json'), JSON.stringify(changes));
  await writeFile(join(OUT, 'qa-matrix.json'), JSON.stringify(qaMatrix));

  console.log(`Wrote ${services.length.toLocaleString()} services, ${providers.length.toLocaleString()} providers, ${suburbs.length.toLocaleString()} suburb groups, ${changes.length.toLocaleString()} rating changes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
