// Wire format from public/data/services.json — keys are minimised to keep payload small.
export interface ServiceWire {
  a: string;       // service approval number
  p: string;       // provider approval number
  n: string;       // service name
  pr: string;      // provider legal name
  ad: string;      // address (street)
  sb: string;      // suburb
  st: string;      // state code
  pc: string;      // postcode
  ph: string;      // phone
  tp: string[];    // service types
  pl: number;      // approved places
  r: string;       // current overall rating
  qa: string[];    // 7 quality area ratings
  pv: string;      // previous overall rating
  pq: string[];    // 7 previous quality area ratings
  i: string;       // ratings issued date
  pi: string;      // previous ratings issued date
  c: 0 | 1;        // temporarily closed flag
}

// Expanded for in-memory use
export interface Service {
  san: string;
  pan: string;
  name: string;
  provider: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  phone: string;
  types: string[];
  places: number;
  rating: string;
  qa: string[];
  prevRating: string;
  prevQa: string[];
  issued: string;
  prevIssued: string;
  closed: boolean;
}

export interface Provider {
  pan: string;
  name: string;
  services: number;
  places: number;
  states: string[];
  ratings: Record<string, number>;
  avgScore: number;
  ratedCount: number;
}

export interface SuburbGroup {
  key: string;
  suburb: string;
  state: string;
  services: number;
  places: number;
  ratings: Record<string, number>;
  ratedCount: number;
  pctExceedingPlus: number;
  pctWorkingTowards: number;
}

export interface StateRow {
  code: string;
  name: string;
  services: number;
  places: number;
  ratings: Record<string, number>;
  ratedCount: number;
  placesPer1000: number;
  pctExceedingPlus: number;
  pctWorkingTowards: number;
}

export interface Insight {
  severity: 'info' | 'warn' | 'alert';
  title: string;
  detail: string;
  providers?: { pan: string; name: string; services: number }[];
  suburbs?: { suburb: string; state: string; services: number; pct?: number }[];
  sample?: Array<Record<string, unknown>>;
}

export interface ChangeRow {
  san: string;
  name: string;
  provider: string;
  suburb: string;
  state: string;
  prev: string;
  now: string;
  delta: number;
}

export interface QaMatrixRow {
  san: string;
  name: string;
  suburb: string;
  state: string;
  qa: string[];
}

export interface Summary {
  generated: string;
  totalServices: number;
  totalProviders: number;
  totalPlaces: number;
  byRating: Record<string, number>;
  byType: Record<string, number>;
  statePopChildren012: Record<string, number>;
}

export type Rating =
  | 'Excellent'
  | 'Exceeding NQS'
  | 'Meeting NQS'
  | 'Working Towards NQS'
  | 'Significant Improvement Required';

export const RATING_ORDER: Rating[] = [
  'Excellent',
  'Exceeding NQS',
  'Meeting NQS',
  'Working Towards NQS',
  'Significant Improvement Required',
];

export const RATING_SHORT: Record<string, string> = {
  Excellent: 'EXC',
  'Exceeding NQS': 'EXC NQS',
  'Meeting NQS': 'MEET',
  'Working Towards NQS': 'WT',
  'Significant Improvement Required': 'SIR',
};

export const QUALITY_AREAS = [
  { n: 1, name: 'Educational program and practice' },
  { n: 2, name: 'Children’s health and safety' },
  { n: 3, name: 'Physical environment' },
  { n: 4, name: 'Staffing arrangements' },
  { n: 5, name: 'Relationships with children' },
  { n: 6, name: 'Collaborative partnerships with families and communities' },
  { n: 7, name: 'Governance and leadership' },
] as const;
