// Sankey-style flow: top providers (left) → ratings (right).
// Width of each ribbon = number of services rated in that tier.

import type { AppData } from '../data';
import { RATING_ORDER } from '../types';
import { escapeHtml, formatNumber, ratingColor } from '../utils/format';
import { tag } from '../glossaryTooltip';

export function mountFlow(el: HTMLElement, app: AppData): void {
  const top = [...app.providers]
    .filter((p) => p.ratedCount >= 8)
    .sort((a, b) => b.services - a.services)
    .slice(0, 25);

  const width = 980;
  const height = 640;
  const leftX = 220;
  const rightX = width - 160;
  const ribbonGap = 6;
  const nodeWidth = 16;
  const totalLeftHeight = height - 40;
  const totalProviderServices = top.reduce((acc, p) => acc + p.ratedCount, 0);
  const px = totalLeftHeight / totalProviderServices;

  // Compute left node positions
  let yL = 20;
  const lefts = top.map((p) => {
    const h = p.ratedCount * px;
    const node = { p, y: yL, h };
    yL += h + ribbonGap;
    return node;
  });

  // Compute right node positions
  const rightTotals: Record<string, number> = {};
  for (const p of top) {
    for (const r of RATING_ORDER) {
      rightTotals[r] = (rightTotals[r] || 0) + (p.ratings[r] || 0);
    }
  }
  const grandTotal = Object.values(rightTotals).reduce((a, b) => a + b, 0) || 1;
  const ratingPx = totalLeftHeight / grandTotal;
  let yR = 20;
  const rights: Record<string, { y: number; h: number; consumed: number }> = {};
  for (const r of RATING_ORDER) {
    const h = (rightTotals[r] || 0) * ratingPx;
    rights[r] = { y: yR, h, consumed: 0 };
    yR += h + ribbonGap;
  }

  const ribbons: string[] = [];
  for (const node of lefts) {
    let usedY = node.y;
    for (const r of RATING_ORDER) {
      const count = node.p.ratings[r] || 0;
      if (!count) continue;
      const h = count * px;
      const startY1 = usedY;
      const startY2 = usedY + h;
      const rh = count * ratingPx;
      const endY1 = rights[r].y + rights[r].consumed;
      const endY2 = endY1 + rh;
      rights[r].consumed += rh;

      const path = [
        `M${leftX},${startY1}`,
        `C${(leftX + rightX) / 2},${startY1} ${(leftX + rightX) / 2},${endY1} ${rightX},${endY1}`,
        `L${rightX},${endY2}`,
        `C${(leftX + rightX) / 2},${endY2} ${(leftX + rightX) / 2},${startY2} ${leftX},${startY2}`,
        'Z',
      ].join(' ');

      ribbons.push(`<path d="${path}" fill="${ratingColor(r)}" fill-opacity="0.55" stroke="${ratingColor(r)}" stroke-opacity="0.3"><title>${escapeHtml(node.p.name)} — ${escapeHtml(r)}: ${count} services</title></path>`);
      usedY += h;
    }
  }

  const leftLabels = lefts.map((n) => `
    <g>
      <rect x="${leftX - nodeWidth}" y="${n.y}" width="${nodeWidth}" height="${n.h}" fill="#1e3a5f" />
      <text x="${leftX - nodeWidth - 6}" y="${n.y + n.h / 2}" text-anchor="end" alignment-baseline="middle" font-size="11" fill="#1f2937">${escapeHtml(n.p.name.length > 32 ? n.p.name.slice(0, 31) + '…' : n.p.name)} <tspan fill="#6b7280">(${formatNumber(n.p.ratedCount)})</tspan></text>
    </g>
  `).join('');
  const rightLabels = RATING_ORDER.map((r) => {
    const right = rights[r];
    if (right.h <= 0) return '';
    return `
      <g>
        <rect x="${rightX}" y="${right.y}" width="${nodeWidth}" height="${right.h}" fill="${ratingColor(r)}" />
        <text x="${rightX + nodeWidth + 6}" y="${right.y + right.h / 2}" alignment-baseline="middle" font-size="11" fill="#1f2937">${escapeHtml(r)} <tspan fill="#6b7280">(${formatNumber(rightTotals[r])})</tspan></text>
      </g>
    `;
  }).join('');

  el.innerHTML = `
    <div class="view-header">
      <h2>Provider → rating flow</h2>
      <p class="view-sub">The 25 largest provider chains on the left, flowing into the five ${tag('NQS')} rating tiers on the right. Ribbon width = number of rated services flowing into that tier. Reveals which chains skew toward Exceeding vs Working Towards.</p>
    </div>
    <div class="flow-wrap">
      <svg viewBox="0 0 ${width} ${height}" class="flow-svg" role="img" aria-label="Provider to rating flow diagram">
        ${ribbons.join('')}
        ${leftLabels}
        ${rightLabels}
      </svg>
    </div>
  `;
}
