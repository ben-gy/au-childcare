// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
export function formatNumber(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-AU', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

export function formatPercent(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(decimals)}%`;
}

export function ratingClass(rating: string): string {
  switch (rating) {
    case 'Excellent':
      return 'rating-excellent';
    case 'Exceeding NQS':
      return 'rating-exceeding';
    case 'Meeting NQS':
      return 'rating-meeting';
    case 'Working Towards NQS':
      return 'rating-working';
    case 'Significant Improvement Required':
      return 'rating-sir';
    default:
      return 'rating-other';
  }
}

export function ratingScore(rating: string): number {
  switch (rating) {
    case 'Excellent':
      return 5;
    case 'Exceeding NQS':
      return 4;
    case 'Meeting NQS':
      return 3;
    case 'Working Towards NQS':
      return 2;
    case 'Significant Improvement Required':
      return 1;
    default:
      return 0;
  }
}

export function ratingColor(rating: string): string {
  switch (rating) {
    case 'Excellent':
      return '#0d7a6c';
    case 'Exceeding NQS':
      return '#3a9d70';
    case 'Meeting NQS':
      return '#5b8aa6';
    case 'Working Towards NQS':
      return '#d8901a';
    case 'Significant Improvement Required':
      return '#b3431f';
    default:
      return '#9ba3ad';
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function titleCase(s: string): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bNqs\b/g, 'NQS')
    .replace(/\bOshc\b/g, 'OSHC')
    .replace(/\bAcecqa\b/g, 'ACECQA')
    .replace(/\bMc\w/g, (s) => s[0] + s[1] + s[2].toUpperCase())
    .replace(/'\w/g, (s) => s.toLowerCase());
}
