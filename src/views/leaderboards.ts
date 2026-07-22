// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { AppData } from '../data';
import { escapeHtml, formatNumber, formatPercent, ratingColor } from '../utils/format';
import { tag } from '../glossaryTooltip';
import { RATING_ORDER } from '../types';

type Mode = 'suburb-exc' | 'suburb-wt' | 'suburb-size' | 'provider-exc' | 'provider-size';

let mode: Mode = 'suburb-exc';

function bar(counts: Record<string, number>, total: number, width = 200): string {
  let x = 0;
  const segments: string[] = [];
  for (const r of RATING_ORDER) {
    const c = counts[r] || 0;
    if (!c) continue;
    const w = (c / total) * width;
    const tip = escapeHtml(`${r}: ${formatNumber(c)} (${formatPercent((c / total) * 100, 0)})`);
    segments.push(`<rect x="${x}" y="0" width="${w}" height="10" fill="${ratingColor(r)}" data-tip="${tip}" aria-label="${tip}"></rect>`);
    x += w;
  }
  return `<svg viewBox="0 0 ${width} 10" class="mini-bar" preserveAspectRatio="none">${segments.join('')}</svg>`;
}

function suburbTable(app: AppData, key: 'pctExceedingPlus' | 'pctWorkingTowards' | 'services', desc = true) {
  const min = 5; // minimum services to qualify
  const rows = app.suburbs
    .filter((s) => s.services >= min && s.ratedCount >= min)
    .sort((a, b) => {
      const av = a[key] as number;
      const bv = b[key] as number;
      return desc ? bv - av : av - bv;
    })
    .slice(0, 50);
  return `
    <table class="lb-table">
      <thead>
        <tr>
          <th class="rank">#</th>
          <th>Suburb</th>
          <th class="num">Services</th>
          <th class="num">${tag('Approved Places', 'Places')}</th>
          <th class="num">% ${tag('Exceeding NQS')}+</th>
          <th class="num">% ${tag('Working Towards NQS', 'WT')}</th>
          <th>Rating mix</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((s, i) => `
          <tr data-suburb="${escapeHtml(s.suburb)}|${s.state}">
            <td class="rank">${i + 1}</td>
            <td><strong>${escapeHtml(s.suburb)}</strong>, ${s.state}</td>
            <td class="num">${formatNumber(s.services)}</td>
            <td class="num">${formatNumber(s.places)}</td>
            <td class="num">${formatPercent(s.pctExceedingPlus, 1)}</td>
            <td class="num">${formatPercent(s.pctWorkingTowards, 1)}</td>
            <td>${bar(s.ratings, s.ratedCount || 1)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function providerTable(app: AppData, key: 'avgScore' | 'services', desc = true) {
  const min = 5;
  const rows = [...app.providers]
    .filter((p) => p.services >= min && p.ratedCount >= min)
    .sort((a, b) => {
      const av = a[key] as number;
      const bv = b[key] as number;
      return desc ? bv - av : av - bv;
    })
    .slice(0, 50);
  return `
    <table class="lb-table">
      <thead>
        <tr>
          <th class="rank">#</th>
          <th>Provider</th>
          <th>States</th>
          <th class="num">Services</th>
          <th class="num">Places</th>
          <th class="num">Avg score</th>
          <th>Rating mix</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((p, i) => `
          <tr>
            <td class="rank">${i + 1}</td>
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td>${p.states.join(', ')}</td>
            <td class="num">${formatNumber(p.services)}</td>
            <td class="num">${formatNumber(p.places)}</td>
            <td class="num">${p.avgScore.toFixed(2)}</td>
            <td>${bar(p.ratings, p.ratedCount || 1)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

export function mountLeaderboards(el: HTMLElement, app: AppData): void {
  el.innerHTML = `
    <div class="view-header">
      <h2>Leaderboards</h2>
      <p class="view-sub">Suburbs and providers ranked. Suburbs need at least 5 rated services to qualify; providers need at least 5 rated services across their chain.</p>
    </div>

    <div class="tabbar">
      <button data-mode="suburb-exc" class="${mode === 'suburb-exc' ? 'active' : ''}">Suburbs · highest % Exceeding</button>
      <button data-mode="suburb-wt" class="${mode === 'suburb-wt' ? 'active' : ''}">Suburbs · highest % Working Towards</button>
      <button data-mode="suburb-size" class="${mode === 'suburb-size' ? 'active' : ''}">Suburbs · most services</button>
      <button data-mode="provider-exc" class="${mode === 'provider-exc' ? 'active' : ''}">Providers · highest avg score</button>
      <button data-mode="provider-size" class="${mode === 'provider-size' ? 'active' : ''}">Providers · most services</button>
    </div>

    <div class="lb-body">
      ${mode === 'suburb-exc' ? suburbTable(app, 'pctExceedingPlus', true) : ''}
      ${mode === 'suburb-wt' ? suburbTable(app, 'pctWorkingTowards', true) : ''}
      ${mode === 'suburb-size' ? suburbTable(app, 'services', true) : ''}
      ${mode === 'provider-exc' ? providerTable(app, 'avgScore', true) : ''}
      ${mode === 'provider-size' ? providerTable(app, 'services', true) : ''}
    </div>
  `;

  el.querySelectorAll<HTMLButtonElement>('.tabbar button').forEach((b) => {
    b.addEventListener('click', () => {
      mode = b.dataset.mode as Mode;
      mountLeaderboards(el, app);
    });
  });
  el.querySelectorAll<HTMLTableRowElement>('tbody tr[data-suburb]').forEach((tr) => {
    tr.addEventListener('click', () => {
      const [sb, st] = (tr.dataset.suburb || '').split('|');
      location.hash = `#/search?q=${encodeURIComponent(sb)}&state=${st}`;
    });
  });
}
