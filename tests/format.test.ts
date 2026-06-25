import { describe, it, expect } from 'vitest';
import { formatNumber, formatPercent, ratingClass, ratingScore, ratingColor, escapeHtml, titleCase } from '../src/utils/format';

describe('formatNumber', () => {
  it('inserts thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
  it('handles negatives', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
  });
  it('respects decimals', () => {
    expect(formatNumber(1234.5, 1)).toBe('1,234.5');
  });
  it('returns em-dash for non-finite', () => {
    expect(formatNumber(NaN)).toBe('—');
    expect(formatNumber(Infinity)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('formats a percentage to default 1 decimal', () => {
    expect(formatPercent(42.357)).toBe('42.4%');
  });
  it('respects decimals=0', () => {
    expect(formatPercent(42.6, 0)).toBe('43%');
  });
  it('returns em-dash for non-finite', () => {
    expect(formatPercent(NaN)).toBe('—');
  });
});

describe('ratingClass', () => {
  it('maps known ratings to CSS classes', () => {
    expect(ratingClass('Excellent')).toBe('rating-excellent');
    expect(ratingClass('Exceeding NQS')).toBe('rating-exceeding');
    expect(ratingClass('Meeting NQS')).toBe('rating-meeting');
    expect(ratingClass('Working Towards NQS')).toBe('rating-working');
    expect(ratingClass('Significant Improvement Required')).toBe('rating-sir');
  });
  it('falls back for unknown ratings', () => {
    expect(ratingClass('Provisional')).toBe('rating-other');
    expect(ratingClass('')).toBe('rating-other');
  });
});

describe('ratingScore', () => {
  it('orders ratings highest to lowest', () => {
    expect(ratingScore('Excellent')).toBeGreaterThan(ratingScore('Exceeding NQS'));
    expect(ratingScore('Exceeding NQS')).toBeGreaterThan(ratingScore('Meeting NQS'));
    expect(ratingScore('Meeting NQS')).toBeGreaterThan(ratingScore('Working Towards NQS'));
    expect(ratingScore('Working Towards NQS')).toBeGreaterThan(ratingScore('Significant Improvement Required'));
  });
  it('returns 0 for unknown ratings', () => {
    expect(ratingScore('something else')).toBe(0);
  });
});

describe('ratingColor', () => {
  it('returns a colour for every known rating', () => {
    for (const r of ['Excellent', 'Exceeding NQS', 'Meeting NQS', 'Working Towards NQS', 'Significant Improvement Required']) {
      expect(ratingColor(r)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
  it('returns the fallback for unknown ratings', () => {
    expect(ratingColor('???')).toBe('#9ba3ad');
  });
});

describe('escapeHtml', () => {
  it('escapes the dangerous five characters', () => {
    expect(escapeHtml(`<a href="x" class='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; class=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });
  it('leaves benign strings alone', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('titleCase', () => {
  it('capitalises words', () => {
    expect(titleCase('hello world')).toBe('Hello World');
  });
  it('preserves NQS and OSHC acronyms', () => {
    expect(titleCase('exceeding nqs')).toBe('Exceeding NQS');
    expect(titleCase('oshc service')).toBe('OSHC Service');
  });
});
