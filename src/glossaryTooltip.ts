import { GLOSSARY } from './glossary';
import { escapeHtml } from './utils/format';

let tooltipEl: HTMLDivElement | null = null;

function ensureTooltip(): HTMLDivElement {
  if (tooltipEl) return tooltipEl;
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'glossary-tooltip';
  tooltipEl.setAttribute('role', 'tooltip');
  tooltipEl.hidden = true;
  document.body.appendChild(tooltipEl);
  return tooltipEl;
}

function hide() {
  if (tooltipEl) tooltipEl.hidden = true;
}

function position(el: HTMLElement, tip: HTMLDivElement) {
  const r = el.getBoundingClientRect();
  tip.style.visibility = 'hidden';
  tip.hidden = false;
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  const margin = 8;
  let top = r.bottom + window.scrollY + margin;
  let left = r.left + window.scrollX + r.width / 2 - tw / 2;
  if (left < margin) left = margin;
  if (left + tw > window.innerWidth - margin) left = window.innerWidth - tw - margin;
  // If it would overflow below, position above
  if (top + th > window.innerHeight + window.scrollY - margin) {
    top = r.top + window.scrollY - th - margin;
  }
  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
  tip.style.visibility = '';
}

export function installGlossary(root: HTMLElement = document.body): void {
  root.addEventListener('click', (ev) => {
    const target = (ev.target as HTMLElement)?.closest('.glossary-link') as HTMLElement | null;
    if (!target) {
      hide();
      return;
    }
    ev.preventDefault();
    const term = target.dataset.term || target.textContent || '';
    const def = GLOSSARY[term];
    const tip = ensureTooltip();
    if (!def) {
      tip.innerHTML = `<strong>${escapeHtml(term)}</strong><p>No definition available.</p>`;
    } else {
      tip.innerHTML = `<strong>${escapeHtml(term)}</strong><p>${escapeHtml(def)}</p>`;
    }
    position(target, tip);
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') hide();
  });
}

export function tag(term: string, label?: string): string {
  return `<span class="glossary-link" data-term="${escapeHtml(term)}" tabindex="0">${escapeHtml(label || term)}<span class="glossary-icon" aria-hidden="true">i</span></span>`;
}
