// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import type {
  ServiceWire,
  Service,
  Provider,
  SuburbGroup,
  StateRow,
  Insight,
  ChangeRow,
  QaMatrixRow,
  Summary,
} from './types';
import { expandService } from './utils/search';

export interface AppData {
  services: Service[];
  providers: Provider[];
  suburbs: SuburbGroup[];
  byState: Record<string, StateRow>;
  insights: Insight[];
  changes: ChangeRow[];
  qaMatrix: QaMatrixRow[];
  summary: Summary;
}

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to load ${url}: HTTP ${r.status}`);
  return (await r.json()) as T;
}

export async function loadData(): Promise<AppData> {
  const [summary, servicesWire, providers, byState, suburbs, insights, changes, qaMatrix] = await Promise.all([
    fetchJson<Summary>('data/summary.json'),
    fetchJson<ServiceWire[]>('data/services.json'),
    fetchJson<Provider[]>('data/providers.json'),
    fetchJson<Record<string, StateRow>>('data/by-state.json'),
    fetchJson<SuburbGroup[]>('data/by-suburb.json'),
    fetchJson<Insight[]>('data/insights.json'),
    fetchJson<ChangeRow[]>('data/changes.json'),
    fetchJson<QaMatrixRow[]>('data/qa-matrix.json'),
  ]);
  const services = servicesWire.map(expandService);
  return { services, providers, suburbs, byState, insights, changes, qaMatrix, summary };
}
