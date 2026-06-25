import type { AppData } from '../data';
import { escapeHtml, formatNumber } from '../utils/format';
import { openDrilldown } from './drilldown';

export function mountInsights(el: HTMLElement, app: AppData): void {
  el.innerHTML = `
    <div class="view-header">
      <h2>Auto-detected insights</h2>
      <p class="view-sub">Patterns surfaced from the data each time it refreshes. Insights are computed in the pipeline so a councillor or journalist can pull a story straight from the headline numbers.</p>
    </div>
    <div class="insight-list">
      ${app.insights.map(renderInsight).join('')}
    </div>
  `;

  el.querySelectorAll<HTMLLIElement>('li[data-san]').forEach((li) => {
    li.addEventListener('click', () => {
      const san = li.dataset.san!;
      const s = app.services.find((x) => x.san === san);
      if (s) openDrilldown(s, app);
    });
  });
}

function renderInsight(ins: AppData['insights'][number]): string {
  let body = '';
  if (ins.providers) {
    body = `
      <ul class="insight-items">
        ${ins.providers.map((p) => `<li><strong>${escapeHtml(p.name)}</strong> — ${formatNumber(p.services)} services</li>`).join('')}
      </ul>
    `;
  } else if (ins.suburbs) {
    body = `
      <ul class="insight-items">
        ${ins.suburbs.map((s) => `<li><strong>${escapeHtml(s.suburb)}, ${s.state}</strong> — ${formatNumber(s.services)} services${s.pct != null ? ` · ${s.pct}% Working Towards` : ''}</li>`).join('')}
      </ul>
    `;
  } else if (ins.sample) {
    body = `
      <ul class="insight-items">
        ${ins.sample.map((s: Record<string, unknown>) => {
          const san = s.san as string | undefined;
          const name = s.name as string;
          const suburb = s.suburb as string;
          const state = s.state as string;
          const places = s.places as number | undefined;
          const prev = s.prev as string | undefined;
          const now = s.now as string | undefined;
          const meta: string[] = [];
          if (places != null) meta.push(`${formatNumber(places)} places`);
          if (prev && now) meta.push(`${prev} → ${now}`);
          meta.push(`${suburb}, ${state}`);
          return `<li${san ? ` data-san="${escapeHtml(san)}" class="clickable"` : ''}><strong>${escapeHtml(name)}</strong> · ${meta.map(escapeHtml).join(' · ')}</li>`;
        }).join('')}
      </ul>
    `;
  }
  return `
    <article class="insight-card insight-${ins.severity}">
      <header><span class="insight-badge">${ins.severity.toUpperCase()}</span><h3>${escapeHtml(ins.title)}</h3></header>
      <p>${escapeHtml(ins.detail)}</p>
      ${body}
    </article>
  `;
}
