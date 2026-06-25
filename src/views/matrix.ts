import type { AppData } from '../data';
import { escapeHtml, ratingColor } from '../utils/format';
import { QUALITY_AREAS, RATING_ORDER } from '../types';
import { tag } from '../glossaryTooltip';

type View = 'top' | 'bottom' | 'mid';
let view: View = 'top';

export function mountMatrix(el: HTMLElement, app: AppData): void {
  // Sort qa-matrix rows by their cumulative QA score
  const score = (qa: string[]) => qa.reduce((acc, q) => {
    const ord = RATING_ORDER.indexOf(q as never);
    return acc + (ord >= 0 ? RATING_ORDER.length - ord : 0);
  }, 0);
  const sorted = [...app.qaMatrix].sort((a, b) => score(b.qa) - score(a.qa));
  let rows = sorted;
  if (view === 'top') rows = sorted.slice(0, 30);
  else if (view === 'bottom') rows = sorted.slice(-30).reverse();
  else {
    const mid = Math.floor(sorted.length / 2);
    rows = sorted.slice(Math.max(0, mid - 15), mid + 15);
  }

  el.innerHTML = `
    <div class="view-header">
      <h2>Quality Area matrix</h2>
      <p class="view-sub">A heatmap of services × the seven ${tag('Quality Area', 'Quality Areas')}. Each cell is the rating awarded for that area. Reveals services that are strong everywhere vs strong in one area; useful for spotting where a service is investing.</p>
    </div>

    <div class="tabbar">
      <button data-view="top" class="${view === 'top' ? 'active' : ''}">Strongest 30</button>
      <button data-view="mid" class="${view === 'mid' ? 'active' : ''}">Middle 30</button>
      <button data-view="bottom" class="${view === 'bottom' ? 'active' : ''}">Weakest 30</button>
    </div>

    <div class="table-scroll">
      <table class="matrix">
        <thead>
          <tr>
            <th class="matrix-name">Service</th>
            ${QUALITY_AREAS.map((q) => `<th title="Quality Area ${q.n}: ${escapeHtml(q.name)}">QA${q.n}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((r) => `
            <tr>
              <td class="matrix-name">
                <strong>${escapeHtml(r.name)}</strong>
                <div class="matrix-sub">${escapeHtml(r.suburb)}, ${escapeHtml(r.state)}</div>
              </td>
              ${r.qa.map((q) => `<td class="matrix-cell" style="background:${ratingColor(q)}" title="${escapeHtml(q || 'Not rated')}"><span>${shortRating(q)}</span></td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="legend">
      ${RATING_ORDER.map((r) => `<span class="legend-item"><span class="legend-dot" style="background:${ratingColor(r)}"></span>${escapeHtml(r)}</span>`).join('')}
    </div>
  `;

  el.querySelectorAll<HTMLButtonElement>('.tabbar button').forEach((b) => {
    b.addEventListener('click', () => {
      view = b.dataset.view as View;
      mountMatrix(el, app);
    });
  });
}

function shortRating(r: string): string {
  switch (r) {
    case 'Excellent':
      return 'E';
    case 'Exceeding NQS':
      return 'EX';
    case 'Meeting NQS':
      return 'M';
    case 'Working Towards NQS':
      return 'WT';
    case 'Significant Improvement Required':
      return 'SI';
    default:
      return '';
  }
}
