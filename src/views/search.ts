import type { AppData } from '../data';
import { buildIndex, search, sortServices, type IndexedService } from '../utils/search';
import { escapeHtml, formatNumber, ratingClass, ratingColor } from '../utils/format';
import { tag } from '../glossaryTooltip';
import { openDrilldown } from './drilldown';
import { RATING_ORDER } from '../types';

type SortKey = 'rating' | 'name' | 'suburb' | 'state' | 'places' | 'provider';

let state = {
  q: '',
  stateFilter: '',
  ratingFilter: '',
  typeFilter: '',
  sort: 'rating' as SortKey,
  dir: -1 as 1 | -1,
  limit: 200,
};

let index: IndexedService[] = [];
let app: AppData;
let mount: HTMLElement;

function header(): string {
  const types = Array.from(new Set(app.services.flatMap((s) => s.types))).sort();
  return `
    <div class="search-bar">
      <input id="qbox" class="qbox" type="search" placeholder="Search service, provider, suburb, postcode..." value="${escapeHtml(state.q)}" autocomplete="off" />
      <select id="state-filter" class="filter">
        <option value="">All states</option>
        ${['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map((c) => `<option value="${c}"${state.stateFilter === c ? ' selected' : ''}>${c}</option>`).join('')}
      </select>
      <select id="rating-filter" class="filter">
        <option value="">All ratings</option>
        ${RATING_ORDER.map((r) => `<option value="${r}"${state.ratingFilter === r ? ' selected' : ''}>${r}</option>`).join('')}
      </select>
      <select id="type-filter" class="filter">
        <option value="">All service types</option>
        ${types.map((t) => `<option value="${escapeHtml(t)}"${state.typeFilter === t ? ' selected' : ''}>${escapeHtml(t)}</option>`).join('')}
      </select>
    </div>
  `;
}

function row(s: IndexedService): string {
  const qaCells = s.qa
    .map((q, i) => `<span class="qa-pill ${ratingClass(q)}" data-tip="Quality Area ${i + 1}: ${escapeHtml(q || 'Not rated')}" aria-label="Quality Area ${i + 1}: ${escapeHtml(q || 'Not rated')}">${i + 1}</span>`)
    .join('');
  return `
    <tr data-san="${escapeHtml(s.san)}">
      <td class="rating-cell"><span class="rating-chip ${ratingClass(s.rating)}">${escapeHtml(s.rating || 'Not yet rated')}</span></td>
      <td class="name-cell"><strong>${escapeHtml(s.name)}</strong><div class="provider-line">${escapeHtml(s.provider)}</div></td>
      <td>${escapeHtml(s.suburb)}, ${escapeHtml(s.state)}<div class="postcode-line">${escapeHtml(s.postcode)}</div></td>
      <td class="num">${formatNumber(s.places)}</td>
      <td class="qa-row">${qaCells}</td>
      <td class="types-cell">${s.types.map((t) => `<span class="type-pill">${escapeHtml(t)}</span>`).join('')}</td>
    </tr>
  `;
}

function render() {
  const filtered = search(index, state.q, {
    state: state.stateFilter || undefined,
    rating: state.ratingFilter || undefined,
    type: state.typeFilter || undefined,
  });
  const sorted = sortServices(filtered, state.sort, state.dir) as IndexedService[];
  const total = sorted.length;
  const shown = Math.min(total, state.limit);
  const rows = sorted.slice(0, shown);

  const arrow = (k: SortKey) => (state.sort === k ? (state.dir === 1 ? ' ▲' : ' ▼') : '');

  mount.innerHTML = `
    <div class="view-header">
      <h2>Services</h2>
      <p class="view-sub">Every Australian ${tag('NQF', 'NQF')}-approved early-learning and childcare service — search by name, suburb, or postcode. Click any row to see all seven ${tag('Quality Area', 'Quality Areas')}, the previous rating cycle, and where else the provider operates.</p>
    </div>
    ${header()}
    <div class="result-summary">${formatNumber(total)} services match · showing first ${formatNumber(shown)}</div>
    <div class="table-scroll">
      <table class="services-table">
        <thead>
          <tr>
            <th data-sort="rating">Rating${arrow('rating')}</th>
            <th data-sort="name">Service / Provider${arrow('name')}</th>
            <th data-sort="suburb">Location${arrow('suburb')}</th>
            <th data-sort="places" class="num">Places${arrow('places')}</th>
            <th>Quality Areas 1–7</th>
            <th>Service types</th>
          </tr>
        </thead>
        <tbody>${rows.map(row).join('') || '<tr><td colspan="6" class="empty-cell">No services match your filters.</td></tr>'}</tbody>
      </table>
    </div>
    <div class="legend">
      ${RATING_ORDER.map((r) => `<span class="legend-item"><span class="legend-dot" style="background:${ratingColor(r)}"></span>${escapeHtml(r)}</span>`).join('')}
    </div>
  `;

  // Sync URL hash so search state is shareable
  syncHash();

  // Wire events
  const qbox = mount.querySelector<HTMLInputElement>('#qbox');
  if (qbox) {
    let t: number | undefined;
    qbox.addEventListener('input', () => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        state.q = qbox.value;
        render();
      }, 200);
    });
    // Restore focus after re-render
    if (document.activeElement?.tagName !== 'INPUT') {
      // do nothing; only focus on first render handled in mountView
    }
  }
  mount.querySelector<HTMLSelectElement>('#state-filter')?.addEventListener('change', (e) => {
    state.stateFilter = (e.target as HTMLSelectElement).value;
    render();
  });
  mount.querySelector<HTMLSelectElement>('#rating-filter')?.addEventListener('change', (e) => {
    state.ratingFilter = (e.target as HTMLSelectElement).value;
    render();
  });
  mount.querySelector<HTMLSelectElement>('#type-filter')?.addEventListener('change', (e) => {
    state.typeFilter = (e.target as HTMLSelectElement).value;
    render();
  });
  mount.querySelectorAll<HTMLTableCellElement>('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort as SortKey;
      if (state.sort === k) state.dir = (state.dir * -1) as 1 | -1;
      else {
        state.sort = k;
        state.dir = k === 'rating' || k === 'places' ? -1 : 1;
      }
      render();
    });
  });
  mount.querySelectorAll<HTMLTableRowElement>('tbody tr[data-san]').forEach((tr) => {
    tr.addEventListener('click', () => {
      const san = tr.dataset.san!;
      const s = app.services.find((x) => x.san === san);
      if (s) openDrilldown(s, app);
    });
  });
}

function syncHash() {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.stateFilter) params.set('state', state.stateFilter);
  if (state.ratingFilter) params.set('rating', state.ratingFilter);
  if (state.typeFilter) params.set('type', state.typeFilter);
  const next = params.toString();
  const base = '#/search';
  const nextHash = next ? `${base}?${next}` : base;
  if (location.hash !== nextHash) {
    history.replaceState(null, '', nextHash);
  }
}

function readHash() {
  const m = /^#\/search\??(.*)$/.exec(location.hash);
  if (!m) return;
  const params = new URLSearchParams(m[1] || '');
  state.q = params.get('q') || '';
  state.stateFilter = params.get('state') || '';
  state.ratingFilter = params.get('rating') || '';
  state.typeFilter = params.get('type') || '';
}

export function mountSearch(el: HTMLElement, data: AppData): void {
  mount = el;
  app = data;
  if (!index.length) index = buildIndex(data.services);
  readHash();
  render();
  // Autofocus search box on first mount
  setTimeout(() => mount.querySelector<HTMLInputElement>('#qbox')?.focus(), 50);
}
