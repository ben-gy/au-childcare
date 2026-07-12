import './style.css';
import { loadData, type AppData } from './data';
import { installGlossary } from './glossaryTooltip';
import { mountSearch } from './views/search';
import { mountOverview } from './views/overview';
import { mountLeaderboards } from './views/leaderboards';
import { mountMap } from './views/map';
import { mountMatrix } from './views/matrix';
import { mountFlow } from './views/flow';
import { mountChanges } from './views/changes';
import { mountInsights } from './views/insights';
import { openDrilldown } from './views/drilldown';

type ViewId = 'overview' | 'search' | 'leaderboards' | 'map' | 'matrix' | 'flow' | 'changes' | 'insights';

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'search', label: 'Search services' },
  { id: 'leaderboards', label: 'Leaderboards' },
  { id: 'map', label: 'Map' },
  { id: 'matrix', label: 'Quality Area matrix' },
  { id: 'flow', label: 'Provider flow' },
  { id: 'changes', label: 'Rating changes' },
  { id: 'insights', label: 'Insights' },
];

let appData: AppData | null = null;
let currentView: ViewId = 'overview';
const root = document.getElementById('app')!;

function renderShell() {
  root.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <div class="brand">
          <div class="brand-logo">CW</div>
          <div class="brand-text">
            <strong>Childcare Watch (AU)</strong>
            <span>Every NQF-approved early-learning service</span>
          </div>
        </div>
        <nav class="nav" id="nav"></nav>
        <button class="about-btn" id="about-btn" aria-label="About this site">? About</button>
      </div>
    </header>
    <main class="main-content" id="main"></main>
    <footer class="site-footer">
      <div class="footer-inner">
        <div>Data: <a href="https://www.acecqa.gov.au/resources/national-registers" target="_blank" rel="noopener">ACECQA National Registers</a>, refreshed daily. Population: <a href="https://www.abs.gov.au/statistics/people/population/regional-population" target="_blank" rel="noopener">ABS Regional Population</a>.</div>
        <div>Built by <a href="https://benrichardson.dev/" target="_blank" rel="noopener">benrichardson.dev</a> · <a href="https://hub.benrichardson.dev" target="_blank" rel="noopener">more tools &amp; sites</a></div>
      </div>
    </footer>
  `;

  const nav = document.getElementById('nav')!;
  nav.innerHTML = VIEWS.map((v) => `<button data-view="${v.id}">${v.label}</button>`).join('');
  nav.querySelectorAll<HTMLButtonElement>('button').forEach((b) => {
    b.addEventListener('click', () => {
      const v = b.dataset.view as ViewId;
      navigate(v);
    });
  });
  document.getElementById('about-btn')!.addEventListener('click', openAbout);
}

function highlightNav() {
  document.querySelectorAll<HTMLButtonElement>('#nav button').forEach((b) => {
    if (b.dataset.view === currentView) b.classList.add('active');
    else b.classList.remove('active');
  });
}

function navigate(view: ViewId) {
  currentView = view;
  // Sync hash if needed
  if (view !== 'search' && !location.hash.startsWith('#service=')) {
    history.replaceState(null, '', `#/${view}`);
  } else if (view === 'search' && !location.hash.startsWith('#/search')) {
    history.replaceState(null, '', '#/search');
  }
  render();
}

function render() {
  if (!appData) return;
  highlightNav();
  const main = document.getElementById('main')!;
  main.innerHTML = '';
  switch (currentView) {
    case 'overview':
      mountOverview(main, appData, (v: string) => navigate(v as ViewId));
      break;
    case 'search':
      mountSearch(main, appData);
      break;
    case 'leaderboards':
      mountLeaderboards(main, appData);
      break;
    case 'map':
      mountMap(main, appData);
      break;
    case 'matrix':
      mountMatrix(main, appData);
      break;
    case 'flow':
      mountFlow(main, appData);
      break;
    case 'changes':
      mountChanges(main, appData);
      break;
    case 'insights':
      mountInsights(main, appData);
      break;
  }
}

function readInitialHash() {
  // #service=SE-00012345 → opens drilldown, view stays as previous
  if (location.hash.startsWith('#service=')) {
    const san = location.hash.slice('#service='.length);
    if (appData) {
      const s = appData.services.find((x) => x.san === san);
      if (s) {
        currentView = 'search';
        render();
        openDrilldown(s, appData);
        return;
      }
    }
  }
  const m = /^#\/?([a-z]+)/.exec(location.hash);
  if (m) {
    const v = m[1] as ViewId;
    if (VIEWS.some((x) => x.id === v)) currentView = v;
  }
}

window.addEventListener('hashchange', () => {
  if (location.hash.startsWith('#/search')) {
    if (currentView !== 'search') {
      currentView = 'search';
      render();
    }
  }
});

function openAbout() {
  let modal = document.getElementById('about-modal') as HTMLDivElement | null;
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'about-modal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAbout();
    });
  }
  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-labelledby="about-title">
      <button class="modal-close" type="button" aria-label="Close">×</button>
      <h2 id="about-title">About Childcare Watch</h2>
      <p>Childcare Watch is an unofficial, parent-first tool for searching, comparing, and understanding every approved early-learning and childcare service in Australia. It surfaces National Quality Standard ratings, the seven Quality Area sub-scores, previous rating cycles, and provider chain rollups — all on one page, with no logins and no ads.</p>

      <h3>Where the data comes from</h3>
      <p>The headline data is the daily-refreshed <a href="https://www.acecqa.gov.au/resources/national-registers" target="_blank" rel="noopener">ACECQA National Registers</a> — the official record of every approved service and provider operating under the <strong>National Quality Framework</strong>. Population figures for the per-capita comparisons come from the ABS Estimated Resident Population.</p>

      <h3>What the ratings mean</h3>
      <ul>
        <li><strong>Excellent</strong> — the top tier, awarded only on application by ACECQA to already-Exceeding services. Fewer than 30 services hold it at any one time.</li>
        <li><strong>Exceeding NQS</strong> — exceeds the standard in all seven Quality Areas; ratings reflect embedded, critically-reflective practice.</li>
        <li><strong>Meeting NQS</strong> — meets the standard in all seven Quality Areas.</li>
        <li><strong>Working Towards NQS</strong> — does not yet meet the standard in one or more Quality Areas.</li>
        <li><strong>Significant Improvement Required</strong> — regulators have identified a significant risk to children's safety, health or wellbeing.</li>
      </ul>

      <h3>Caveats</h3>
      <ul>
        <li>Ratings are point-in-time. A service rated three years ago has the rating from that assessment cycle.</li>
        <li>"Not yet rated" services have current service approval but haven't completed their first NQS assessment.</li>
        <li>The data does not include unapproved services (informal care, family arrangements, etc.).</li>
        <li>For binding decisions about a child's placement, always confirm directly with the service and the relevant state/territory regulator.</li>
      </ul>

      <h3>How this site is built</h3>
      <p>The full source is a small static site (Vanilla TypeScript + Vite) hosted on GitHub Pages. The data pipeline runs daily, pulls the ACECQA registers, aggregates them, and writes JSON for the frontend to load on demand. Site author: <a href="https://benrichardson.dev/" target="_blank" rel="noopener">Ben Richardson</a>.</p>
    </div>
  `;
  modal.hidden = false;
  modal.querySelector<HTMLButtonElement>('.modal-close')?.addEventListener('click', closeAbout);
  document.addEventListener('keydown', escClose);
}

function escClose(e: KeyboardEvent) {
  if (e.key === 'Escape') closeAbout();
}

function closeAbout() {
  const modal = document.getElementById('about-modal') as HTMLDivElement | null;
  if (modal) modal.hidden = true;
  document.removeEventListener('keydown', escClose);
}

async function bootstrap() {
  renderShell();
  installGlossary();
  const main = document.getElementById('main')!;
  main.innerHTML = `<div class="loading"><span class="loading-spinner"></span>Loading every Australian childcare service…</div>`;
  try {
    appData = await loadData();
    readInitialHash();
    render();
  } catch (err) {
    main.innerHTML = `<div class="error">Failed to load data. ${err instanceof Error ? err.message : ''}</div>`;
    console.error(err);
  }
}

bootstrap();
