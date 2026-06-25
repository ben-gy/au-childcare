import { describe, it, expect } from 'vitest';
import { GLOSSARY, getGlossary } from '../src/glossary';

describe('glossary', () => {
  it('has definitions for the five NQS rating tiers', () => {
    expect(getGlossary('Excellent')).toBeTruthy();
    expect(getGlossary('Exceeding NQS')).toBeTruthy();
    expect(getGlossary('Meeting NQS')).toBeTruthy();
    expect(getGlossary('Working Towards NQS')).toBeTruthy();
    expect(getGlossary('Significant Improvement Required')).toBeTruthy();
  });

  it('has definitions for all seven Quality Areas', () => {
    for (let i = 1; i <= 7; i++) {
      const def = getGlossary(`Quality Area ${i}`);
      expect(def, `Quality Area ${i}`).toBeTruthy();
      expect(def!.length).toBeGreaterThan(20);
    }
  });

  it('defines core abbreviations', () => {
    expect(getGlossary('NQF')).toBeTruthy();
    expect(getGlossary('NQS')).toBeTruthy();
    expect(getGlossary('ACECQA')).toBeTruthy();
    expect(getGlossary('OSHC')).toBeTruthy();
  });

  it('returns undefined for unknown terms', () => {
    expect(getGlossary('not-a-term')).toBeUndefined();
  });

  it('all glossary entries are non-empty', () => {
    for (const [k, v] of Object.entries(GLOSSARY)) {
      expect(v, `entry "${k}"`).toBeTruthy();
      expect(v.length, `entry "${k}" too short`).toBeGreaterThan(10);
    }
  });
});
