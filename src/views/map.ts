import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { AppData } from '../data';
import type { StateRow } from '../types';
import { formatNumber, formatPercent } from '../utils/format';
import { tag } from '../glossaryTooltip';

// Approximate state centroids (lon, lat) and bounding boxes are unnecessary —
// we render Australia at fixed zoom and place markers per state.
const STATE_CENTROIDS: Record<string, [number, number]> = {
  NSW: [-32.5, 147.0],
  VIC: [-37.0, 144.5],
  QLD: [-22.5, 144.0],
  WA: [-26.0, 121.0],
  SA: [-30.5, 135.5],
  TAS: [-42.0, 146.5],
  ACT: [-35.5, 149.0],
  NT: [-19.5, 133.5],
};

type Metric = 'pctExceedingPlus' | 'pctWorkingTowards' | 'placesPer1000' | 'services';

let metric: Metric = 'pctExceedingPlus';
let mapInstance: L.Map | null = null;
let markerLayer: L.LayerGroup | null = null;

function paint(app: AppData) {
  if (!mapInstance || !markerLayer) return;
  markerLayer.clearLayers();
  const states = Object.values(app.byState).filter((s) => s.services > 0);
  const values = states.map((s) => s[metric] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const scale = (v: number) => (max === min ? 0.5 : (v - min) / (max - min));

  for (const s of states) {
    const v = s[metric] as number;
    const t = scale(v);
    const radius = 18 + t * 32;
    const isInverse = metric === 'pctWorkingTowards';
    // Hue from green (good) to red (bad)
    const hue = isInverse ? (1 - t) * 140 : t * 140;
    const color = `hsl(${hue}, 55%, 40%)`;
    const m = L.circleMarker([s.code === 'NSW' || s.code === 'VIC' ? STATE_CENTROIDS[s.code][0] : STATE_CENTROIDS[s.code][0], STATE_CENTROIDS[s.code][1]], {
      radius,
      color: '#1e3a5f',
      weight: 2,
      fillColor: color,
      fillOpacity: 0.7,
    }).addTo(markerLayer);
    m.bindTooltip(stateTooltip(s), { permanent: false, direction: 'top', className: 'state-tooltip' });
    m.bindPopup(stateTooltip(s), { className: 'state-popup' });
  }
}

function stateTooltip(s: StateRow): string {
  return `
    <strong>${s.name} (${s.code})</strong><br/>
    ${formatNumber(s.services)} services · ${formatNumber(s.places)} places<br/>
    ${formatPercent(s.pctExceedingPlus, 1)} Exceeding+ · ${formatPercent(s.pctWorkingTowards, 1)} WT<br/>
    ${formatNumber(s.placesPer1000, 1)} places per 1,000 children
  `;
}

export function mountMap(el: HTMLElement, app: AppData): void {
  el.innerHTML = `
    <div class="view-header">
      <h2>Map · how each state compares</h2>
      <p class="view-sub">Each marker is a state or territory, sized and coloured by the metric you select. Click a marker for the numbers behind it. Per-capita figures use ABS child-population estimates.</p>
    </div>
    <div class="map-controls">
      <label>Metric:</label>
      <select id="metric-select">
        <option value="pctExceedingPlus">% rated ${tag('Exceeding NQS')} or above</option>
        <option value="pctWorkingTowards">% rated ${tag('Working Towards NQS', 'Working Towards')}</option>
        <option value="placesPer1000">${tag('Approved Places', 'Places')} per 1,000 children (0–12)</option>
        <option value="services">Total services</option>
      </select>
    </div>
    <div id="map" class="map-container"></div>
    <div class="map-legend">
      <span>Marker size and colour vary with the selected metric. Greener = better outcome (except for "Working Towards", where redder = more services flagged).</span>
    </div>
  `;

  // Set the select's HTML — we need to strip tag()'s span wrapping because <option> can't contain markup
  const sel = el.querySelector<HTMLSelectElement>('#metric-select')!;
  // Replace innerHTML with plain text options
  sel.innerHTML = `
    <option value="pctExceedingPlus">% rated Exceeding NQS or above</option>
    <option value="pctWorkingTowards">% rated Working Towards</option>
    <option value="placesPer1000">Places per 1,000 children (0–12)</option>
    <option value="services">Total services</option>
  `;
  sel.value = metric;
  sel.addEventListener('change', () => {
    metric = sel.value as Metric;
    paint(app);
  });

  const mapEl = el.querySelector<HTMLDivElement>('#map')!;
  // Defer to next frame so the container has a real size
  setTimeout(() => {
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
    }
    mapInstance = L.map(mapEl, {
      center: [-26.0, 134.0],
      zoom: 4,
      minZoom: 3,
      maxZoom: 7,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapInstance);
    markerLayer = L.layerGroup().addTo(mapInstance);
    paint(app);
  }, 50);
}
