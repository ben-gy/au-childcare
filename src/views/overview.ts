// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { AppData } from '../data';
import { formatNumber, formatPercent, ratingColor, escapeHtml } from '../utils/format';
import { tag } from '../glossaryTooltip';
import { RATING_ORDER } from '../types';

function stackedBar(counts: Record<string, number>, total: number, width = 360): string {
  let x = 0;
  const segments: string[] = [];
  for (const r of RATING_ORDER) {
    const c = counts[r] || 0;
    if (!c) continue;
    const w = (c / total) * width;
    const tip = escapeHtml(`${r}: ${formatNumber(c)} (${formatPercent((c / total) * 100, 0)})`);
    segments.push(`<rect x="${x}" y="0" width="${w}" height="14" fill="${ratingColor(r)}" data-tip="${tip}" aria-label="${tip}"></rect>`);
    x += w;
  }
  return `<svg viewBox="0 0 ${width} 14" class="stacked-bar" preserveAspectRatio="none">${segments.join('')}</svg>`;
}

export function mountOverview(el: HTMLElement, app: AppData, navigate: (view: string) => void): void {
  const sum = app.summary;
  const stateRows = Object.values(app.byState).filter((s) => s.services > 0).sort((a, b) => b.services - a.services);

  // Quick "top providers" mini list
  const topProviders = [...app.providers]
    .filter((p) => p.services >= 5)
    .map((p) => {
      const exc = (p.ratings['Excellent'] || 0) + (p.ratings['Exceeding NQS'] || 0);
      const denom = p.ratedCount || 1;
      return { ...p, pctExceedingPlus: (exc / denom) * 100 };
    })
    .filter((p) => p.pctExceedingPlus >= 75)
    .sort((a, b) => b.pctExceedingPlus - a.pctExceedingPlus || b.services - a.services)
    .slice(0, 8);

  // Top suburbs by service density
  const topSuburbs = [...app.suburbs]
    .filter((s) => s.services >= 5)
    .sort((a, b) => b.services - a.services)
    .slice(0, 12);

  // Notable insights — first 3
  const insightCards = app.insights.slice(0, 3).map((ins) => `
    <article class="insight-card insight-${ins.severity}">
      <h3>${escapeHtml(ins.title)}</h3>
      <p>${escapeHtml(ins.detail)}</p>
    </article>
  `).join('');

  el.innerHTML = `
    <div class="view-header">
      <h2>The picture nationally</h2>
      <p class="view-sub">Every approved early-learning and childcare service in Australia, with their current ${tag('NQS')} rating. Updated monthly from the ${tag('ACECQA')} National Registers.</p>
    </div>

    <section class="kpi-grid">
      <div class="kpi">
        <div class="kpi-value">${formatNumber(sum.totalServices)}</div>
        <div class="kpi-label">Approved services</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${formatNumber(sum.totalProviders)}</div>
        <div class="kpi-label">Approved providers</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${formatNumber(sum.totalPlaces)}</div>
        <div class="kpi-label">${tag('Approved Places', 'Approved places')}</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${formatPercent(((sum.byRating['Exceeding NQS'] || 0) + (sum.byRating['Excellent'] || 0)) / sum.totalServices * 100, 1)}</div>
        <div class="kpi-label">Rated ${tag('Exceeding NQS')} or above</div>
      </div>
    </section>

    <section class="card">
      <h3>National rating mix</h3>
      <p class="card-sub">All ${formatNumber(sum.totalServices)} approved services by their current overall rating.</p>
      ${stackedBar(sum.byRating, sum.totalServices, 800)}
      <div class="legend">
        ${RATING_ORDER.map((r) => `<span class="legend-item"><span class="legend-dot" style="background:${ratingColor(r)}"></span>${escapeHtml(r)} <strong>${formatNumber(sum.byRating[r] || 0)}</strong></span>`).join('')}
      </div>
    </section>

    <section class="card">
      <h3>By state</h3>
      <p class="card-sub">Click a state to filter the services list. Hover bars for counts.</p>
      <table class="state-table">
        <thead>
          <tr>
            <th>State</th>
            <th class="num">Services</th>
            <th class="num">${tag('Approved Places', 'Places')}</th>
            <th class="num">Places per 1,000 children</th>
            <th class="num">% ${tag('Exceeding NQS')}+</th>
            <th class="num">% ${tag('Working Towards NQS', 'Working Towards')}</th>
            <th>Rating mix</th>
          </tr>
        </thead>
        <tbody>
          ${stateRows.map((s) => `
            <tr data-state="${s.code}">
              <td><strong>${s.code}</strong> <span class="muted">${escapeHtml(s.name)}</span></td>
              <td class="num">${formatNumber(s.services)}</td>
              <td class="num">${formatNumber(s.places)}</td>
              <td class="num">${formatNumber(s.placesPer1000, 1)}</td>
              <td class="num">${formatPercent(s.pctExceedingPlus, 1)}</td>
              <td class="num">${formatPercent(s.pctWorkingTowards, 1)}</td>
              <td>${stackedBar(s.ratings, s.ratedCount || 1, 200)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    <section class="two-col">
      <div class="card">
        <h3>Providers with the strongest rating mix</h3>
        <p class="card-sub">Providers running ≥5 services where ≥75% are rated Exceeding NQS or above.</p>
        <ol class="rank-list">
          ${topProviders.map((p) => `
            <li>
              <span class="rank-name">${escapeHtml(p.name)}</span>
              <span class="rank-meta">${formatNumber(p.services)} services · ${formatPercent(p.pctExceedingPlus, 0)} Exceeding+</span>
            </li>
          `).join('')}
        </ol>
      </div>
      <div class="card">
        <h3>Suburbs with the most services</h3>
        <p class="card-sub">Hot-spot suburbs by service count.</p>
        <ol class="rank-list">
          ${topSuburbs.map((s) => `
            <li>
              <span class="rank-name">${escapeHtml(s.suburb)}, ${s.state}</span>
              <span class="rank-meta">${formatNumber(s.services)} services · ${formatPercent(s.pctExceedingPlus, 0)} Exceeding+</span>
            </li>
          `).join('')}
        </ol>
      </div>
    </section>

    <section>
      <h3>Auto-detected insights</h3>
      <div class="insight-grid">${insightCards}</div>
      <button class="link-btn" id="see-all-insights">See all ${app.insights.length} insights →</button>
    </section>
  `;

  el.querySelectorAll<HTMLTableRowElement>('tbody tr[data-state]').forEach((tr) => {
    tr.addEventListener('click', () => {
      const code = tr.dataset.state!;
      location.hash = `#/search?state=${code}`;
    });
  });
  el.querySelector<HTMLButtonElement>('#see-all-insights')?.addEventListener('click', () => navigate('insights'));
}
