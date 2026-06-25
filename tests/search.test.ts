import { describe, it, expect } from 'vitest';
import { buildIndex, search, sortServices, expandService } from '../src/utils/search';
import type { Service, ServiceWire } from '../src/types';

const sample: Service[] = [
  {
    san: 'SE-1',
    pan: 'PR-1',
    name: 'Sunrise Early Learning',
    provider: 'Bright Futures Pty Ltd',
    address: '1 King St',
    suburb: 'Newtown',
    state: 'NSW',
    postcode: '2042',
    phone: '02 9000 0001',
    types: ['Long Day Care'],
    places: 80,
    rating: 'Exceeding NQS',
    qa: ['Exceeding NQS', 'Meeting NQS', 'Meeting NQS', 'Meeting NQS', 'Exceeding NQS', 'Meeting NQS', 'Meeting NQS'],
    prevRating: 'Meeting NQS',
    prevQa: [],
    issued: '2024-05-10',
    prevIssued: '2020-03-01',
    closed: false,
  },
  {
    san: 'SE-2',
    pan: 'PR-1',
    name: 'Sunrise OSHC',
    provider: 'Bright Futures Pty Ltd',
    address: '5 Queen St',
    suburb: 'Newtown',
    state: 'NSW',
    postcode: '2042',
    phone: '',
    types: ['OSHC (Before/After)', 'OSHC (Vacation)'],
    places: 60,
    rating: 'Meeting NQS',
    qa: [],
    prevRating: '',
    prevQa: [],
    issued: '',
    prevIssued: '',
    closed: false,
  },
  {
    san: 'SE-3',
    pan: 'PR-2',
    name: 'Little Pelicans Centre',
    provider: 'Pelican Group',
    address: '99 Beach Rd',
    suburb: 'Brunswick',
    state: 'VIC',
    postcode: '3056',
    phone: '',
    types: ['Long Day Care'],
    places: 40,
    rating: 'Working Towards NQS',
    qa: [],
    prevRating: '',
    prevQa: [],
    issued: '',
    prevIssued: '',
    closed: false,
  },
];

describe('buildIndex', () => {
  it('builds a lowercase haystack for each service', () => {
    const idx = buildIndex(sample);
    expect(idx[0].haystack).toContain('newtown');
    expect(idx[0].haystack).toContain('bright futures');
    expect(idx[0].haystack).toContain('2042');
  });
});

describe('search', () => {
  const idx = buildIndex(sample);

  it('returns everything when query is empty and no filters set', () => {
    expect(search(idx, '', {}).length).toBe(3);
  });

  it('matches partial text in any field', () => {
    const r = search(idx, 'pelican', {});
    expect(r.length).toBe(1);
    expect(r[0].san).toBe('SE-3');
  });

  it('matches across multiple terms (AND)', () => {
    const r = search(idx, 'sunrise newtown', {});
    expect(r.length).toBe(2);
  });

  it('filters by state', () => {
    const r = search(idx, '', { state: 'VIC' });
    expect(r.length).toBe(1);
    expect(r[0].san).toBe('SE-3');
  });

  it('filters by rating', () => {
    const r = search(idx, '', { rating: 'Exceeding NQS' });
    expect(r.length).toBe(1);
    expect(r[0].san).toBe('SE-1');
  });

  it('filters by service type', () => {
    const r = search(idx, '', { type: 'OSHC (Vacation)' });
    expect(r.length).toBe(1);
    expect(r[0].san).toBe('SE-2');
  });

  it('returns empty when no matches', () => {
    expect(search(idx, 'nothinghere', {})).toEqual([]);
  });

  it('ignores 1-char query tokens', () => {
    // "a" should be dropped; "newtown" still matches
    const r = search(idx, 'a newtown', {});
    expect(r.length).toBe(2);
  });
});

describe('sortServices', () => {
  it('sorts by rating descending (highest rating first)', () => {
    const r = sortServices(sample, 'rating', -1);
    expect(r[0].rating).toBe('Exceeding NQS');
    expect(r[r.length - 1].rating).toBe('Working Towards NQS');
  });

  it('sorts by places descending', () => {
    const r = sortServices(sample, 'places', -1);
    expect(r[0].places).toBe(80);
    expect(r[r.length - 1].places).toBe(40);
  });

  it('sorts by name ascending', () => {
    const r = sortServices(sample, 'name', 1);
    expect(r[0].name).toBe('Little Pelicans Centre');
  });

  it('sorts by suburb', () => {
    const r = sortServices(sample, 'suburb', 1);
    expect(r[0].suburb).toBe('Brunswick');
  });
});

describe('expandService', () => {
  it('expands the wire format', () => {
    const w: ServiceWire = {
      a: 'SE-9', p: 'PR-9', n: 'Test', pr: 'Provider', ad: 'street', sb: 'town', st: 'TAS',
      pc: '7000', ph: '', tp: ['Long Day Care'], pl: 30, r: 'Meeting NQS', qa: [],
      pv: '', pq: [], i: '', pi: '', c: 0,
    };
    const s = expandService(w);
    expect(s.san).toBe('SE-9');
    expect(s.places).toBe(30);
    expect(s.closed).toBe(false);
  });
  it('treats c=1 as closed', () => {
    const w: ServiceWire = {
      a: 'SE-9', p: 'PR-9', n: 'Test', pr: 'Provider', ad: '', sb: '', st: '',
      pc: '', ph: '', tp: [], pl: 0, r: '', qa: [], pv: '', pq: [], i: '', pi: '', c: 1,
    };
    expect(expandService(w).closed).toBe(true);
  });
});
