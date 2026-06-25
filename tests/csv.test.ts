import { describe, it, expect } from 'vitest';
// @ts-expect-error — plain .mjs file, no declaration needed for tests
import { parseCsv } from '../pipeline/csv.mjs';

describe('parseCsv', () => {
  it('parses a simple header + row', () => {
    const r = parseCsv('a,b,c\n1,2,3\n');
    expect(r).toEqual([{ a: '1', b: '2', c: '3' }]);
  });

  it('handles quoted fields with embedded commas', () => {
    const r = parseCsv('name,address\n"Smith, J","1 King St, Sydney"\n');
    expect(r).toEqual([{ name: 'Smith, J', address: '1 King St, Sydney' }]);
  });

  it('handles quoted fields with embedded newlines (multi-line rows)', () => {
    const r = parseCsv('a,b\n"line1\nline2",x\n');
    expect(r).toEqual([{ a: 'line1\nline2', b: 'x' }]);
  });

  it('handles escaped quotes inside quoted fields', () => {
    const r = parseCsv('a,b\n"she said ""hi""",x\n');
    expect(r).toEqual([{ a: 'she said "hi"', b: 'x' }]);
  });

  it('handles CRLF line endings', () => {
    const r = parseCsv('a,b\r\n1,2\r\n');
    expect(r).toEqual([{ a: '1', b: '2' }]);
  });

  it('handles missing trailing newline', () => {
    const r = parseCsv('a,b\n1,2');
    expect(r).toEqual([{ a: '1', b: '2' }]);
  });

  it('strips BOM from the start of the input', () => {
    const r = parseCsv('﻿a,b\n1,2\n');
    expect(r).toEqual([{ a: '1', b: '2' }]);
  });

  it('returns empty array on empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('skips fully-blank rows', () => {
    const r = parseCsv('a,b\n1,2\n\n3,4\n');
    expect(r).toEqual([{ a: '1', b: '2' }, { a: '3', b: '4' }]);
  });
});
