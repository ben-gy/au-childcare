// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { AppData } from '../data';
import { escapeHtml, formatNumber, ratingClass } from '../utils/format';
import { openDrilldown } from './drilldown';

type Mode = 'up' | 'down' | 'all';
let mode: Mode = 'down';

export function mountChanges(el: HTMLElement, app: AppData): void {
  let rows = app.changes;
  if (mode === 'up') rows = rows.filter((c) => c.delta > 0);
  else if (mode === 'down') rows = rows.filter((c) => c.delta < 0);

  // Sort: biggest magnitude first
  rows = [...rows].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const top = rows.slice(0, 200);

  el.innerHTML = `
    <div class="view-header">
      <h2>Rating changes between cycles</h2>
      <p class="view-sub">Services whose current rating differs from their previous rating cycle. ${formatNumber(app.changes.length)} services have changed; ${formatNumber(app.changes.filter((c) => c.delta > 0).length)} improved and ${formatNumber(app.changes.filter((c) => c.delta < 0).length)} dropped.</p>
    </div>
    <div class="tabbar">
      <button data-mode="down" class="${mode === 'down' ? 'active' : ''}">Drops</button>
      <button data-mode="up" class="${mode === 'up' ? 'active' : ''}">Improvements</button>
      <button data-mode="all" class="${mode === 'all' ? 'active' : ''}">All changes</button>
    </div>
    <div class="table-scroll">
      <table class="changes-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Location</th>
            <th>Previous</th>
            <th>Now</th>
            <th class="num">Δ tiers</th>
          </tr>
        </thead>
        <tbody>
          ${top.map((c) => `
            <tr data-san="${escapeHtml(c.san)}">
              <td><strong>${escapeHtml(c.name)}</strong><div class="provider-line">${escapeHtml(c.provider)}</div></td>
              <td>${escapeHtml(c.suburb)}, ${c.state}</td>
              <td><span class="rating-chip subtle ${ratingClass(c.prev)}">${escapeHtml(c.prev)}</span></td>
              <td><span class="rating-chip ${ratingClass(c.now)}">${escapeHtml(c.now)}</span></td>
              <td class="num delta ${c.delta > 0 ? 'positive' : 'negative'}">${c.delta > 0 ? '+' : ''}${c.delta}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="result-summary">Showing ${formatNumber(top.length)} of ${formatNumber(rows.length)} matching changes.</div>
    </div>
  `;

  el.querySelectorAll<HTMLButtonElement>('.tabbar button').forEach((b) => {
    b.addEventListener('click', () => {
      mode = b.dataset.mode as Mode;
      mountChanges(el, app);
    });
  });
  el.querySelectorAll<HTMLTableRowElement>('tbody tr[data-san]').forEach((tr) => {
    tr.addEventListener('click', () => {
      const san = tr.dataset.san!;
      const s = app.services.find((x) => x.san === san);
      if (s) openDrilldown(s, app);
    });
  });
}
