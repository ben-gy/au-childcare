import type { Service } from '../types';
import type { AppData } from '../data';
import { escapeHtml, formatNumber, ratingClass } from '../utils/format';
import { QUALITY_AREAS } from '../types';
import { tag } from '../glossaryTooltip';

let panel: HTMLDivElement | null = null;

function ensurePanel(): HTMLDivElement {
  if (panel) return panel;
  panel = document.createElement('div');
  panel.className = 'drilldown';
  panel.hidden = true;
  document.body.appendChild(panel);
  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel && !panel.hidden) close();
  });
  return panel;
}

function close() {
  if (panel) panel.hidden = true;
  if (location.hash.startsWith('#service=')) {
    history.replaceState(null, '', '#/search');
  }
}

export function openDrilldown(svc: Service, app: AppData): void {
  const el = ensurePanel();
  const provider = app.providers.find((p) => p.pan === svc.pan);
  const sameProvider = provider
    ? app.services.filter((s) => s.pan === svc.pan && s.san !== svc.san).slice(0, 30)
    : [];
  const qaRows = QUALITY_AREAS.map((qa, i) => {
    const now = svc.qa[i] || 'Not rated';
    const prev = svc.prevQa[i] || '';
    return `
      <tr>
        <td><span class="qa-number">${qa.n}</span> ${tag(`Quality Area ${qa.n}`, qa.name)}</td>
        <td><span class="rating-chip ${ratingClass(now)}">${escapeHtml(now)}</span></td>
        <td>${prev ? `<span class="rating-chip subtle ${ratingClass(prev)}">${escapeHtml(prev)}</span>` : '<span class="muted">—</span>'}</td>
      </tr>
    `;
  }).join('');

  el.innerHTML = `
    <div class="drilldown-card" role="dialog" aria-labelledby="dd-title">
      <div class="drilldown-head">
        <button class="drilldown-close" aria-label="Close" type="button">×</button>
        <h2 id="dd-title">${escapeHtml(svc.name)}</h2>
        <div class="drilldown-meta">
          <span class="rating-chip large ${ratingClass(svc.rating)}">${escapeHtml(svc.rating || 'Not yet rated')}</span>
          ${svc.prevRating && svc.prevRating !== svc.rating ? `<span class="prev-rating">Previous: <span class="rating-chip subtle ${ratingClass(svc.prevRating)}">${escapeHtml(svc.prevRating)}</span></span>` : ''}
        </div>
        <div class="drilldown-sub">
          <strong>${escapeHtml(svc.provider)}</strong> · ${escapeHtml(svc.address)}, ${escapeHtml(svc.suburb)} ${escapeHtml(svc.state)} ${escapeHtml(svc.postcode)}
        </div>
      </div>

      <div class="drilldown-body">
        <section>
          <div class="kv-grid">
            <div><dt>Approved places</dt><dd>${formatNumber(svc.places)}</dd></div>
            <div><dt>Service types</dt><dd>${svc.types.map((t) => `<span class="type-pill">${escapeHtml(t)}</span>`).join(' ') || '—'}</dd></div>
            <div><dt>Current rating issued</dt><dd>${escapeHtml(svc.issued || '—')}</dd></div>
            <div><dt>Previous rating issued</dt><dd>${escapeHtml(svc.prevIssued || '—')}</dd></div>
            <div><dt>Approval number</dt><dd class="mono">${escapeHtml(svc.san)}</dd></div>
            <div><dt>Phone</dt><dd>${escapeHtml(svc.phone || '—')}</dd></div>
          </div>
        </section>

        <section>
          <h3>${tag('Quality Area', 'Quality Area ratings')}</h3>
          <table class="qa-table">
            <thead><tr><th>Area</th><th>Current</th><th>Previous cycle</th></tr></thead>
            <tbody>${qaRows}</tbody>
          </table>
        </section>

        ${provider ? `
        <section>
          <h3>About the provider</h3>
          <p>${escapeHtml(provider.name)} operates <strong>${formatNumber(provider.services)}</strong> approved services across ${provider.states.length} state${provider.states.length === 1 ? '' : 's'} (${provider.states.join(', ')}), with ${formatNumber(provider.places)} approved places in total.</p>
          ${sameProvider.length ? `
            <p class="muted">Other services run by this provider:</p>
            <ul class="provider-services">
              ${sameProvider.map((s) => `<li><a href="#service=${escapeHtml(s.san)}" data-san="${escapeHtml(s.san)}"><span class="rating-chip small ${ratingClass(s.rating)}">${escapeHtml(s.rating || '—')}</span> ${escapeHtml(s.name)} — ${escapeHtml(s.suburb)}, ${escapeHtml(s.state)}</a></li>`).join('')}
            </ul>
          ` : ''}
        </section>
        ` : ''}
      </div>
    </div>
  `;

  el.hidden = false;
  el.scrollTop = 0;

  el.querySelector<HTMLButtonElement>('.drilldown-close')?.addEventListener('click', close);
  el.querySelectorAll<HTMLAnchorElement>('a[data-san]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const san = a.dataset.san!;
      const next = app.services.find((s) => s.san === san);
      if (next) openDrilldown(next, app);
    });
  });

  // Update URL hash so the drilldown is shareable
  if (location.hash !== `#service=${svc.san}`) {
    history.replaceState(null, '', `#service=${svc.san}`);
  }
}
