// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type { Service } from '../types';

export interface IndexedService extends Service {
  haystack: string;
}

export function buildIndex(services: Service[]): IndexedService[] {
  return services.map((s) => ({
    ...s,
    haystack: [s.name, s.provider, s.suburb, s.state, s.postcode, s.address].join(' ').toLowerCase(),
  }));
}

export function search(
  index: IndexedService[],
  query: string,
  filters: { state?: string; rating?: string; type?: string },
): IndexedService[] {
  const q = query.trim().toLowerCase();
  const terms = q ? q.split(/\s+/).filter((t) => t.length >= 2) : [];
  const result: IndexedService[] = [];
  for (const s of index) {
    if (filters.state && s.state !== filters.state) continue;
    if (filters.rating && s.rating !== filters.rating) continue;
    if (filters.type && !s.types.includes(filters.type)) continue;
    if (terms.length) {
      let match = true;
      for (const t of terms) {
        if (!s.haystack.includes(t)) {
          match = false;
          break;
        }
      }
      if (!match) continue;
    }
    result.push(s);
  }
  return result;
}

export function sortServices(
  rows: Service[],
  key: 'rating' | 'name' | 'suburb' | 'state' | 'places' | 'provider',
  dir: 1 | -1,
): Service[] {
  const rank = (r: string): number => {
    switch (r) {
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
  };
  const out = [...rows];
  out.sort((a, b) => {
    let av: number | string = 0;
    let bv: number | string = 0;
    switch (key) {
      case 'rating':
        av = rank(a.rating);
        bv = rank(b.rating);
        break;
      case 'name':
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
        break;
      case 'suburb':
        av = a.suburb.toLowerCase();
        bv = b.suburb.toLowerCase();
        break;
      case 'state':
        av = a.state;
        bv = b.state;
        break;
      case 'places':
        av = a.places;
        bv = b.places;
        break;
      case 'provider':
        av = a.provider.toLowerCase();
        bv = b.provider.toLowerCase();
        break;
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
  return out;
}

export function expandService(w: import('../types').ServiceWire): Service {
  return {
    san: w.a,
    pan: w.p,
    name: w.n,
    provider: w.pr,
    address: w.ad,
    suburb: w.sb,
    state: w.st,
    postcode: w.pc,
    phone: w.ph,
    types: w.tp,
    places: w.pl,
    rating: w.r,
    qa: w.qa,
    prevRating: w.pv,
    prevQa: w.pq,
    issued: w.i,
    prevIssued: w.pi,
    closed: w.c === 1,
  };
}
