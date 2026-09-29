import { useEffect, useRef, useState } from 'react';
import { Basket, Grid2x2, Volleyball, BookOpen, Settings } from './lib/icons.jsx';
import { settings } from './lib/db.js';
import { registerAnnouncer } from './lib/announce.js';
import { applyPlatform } from './lib/platform.js';
import ProjectsView from './features/ProjectsView.jsx';
import ProjectDetail from './features/ProjectDetail.jsx';
import ChartsView from './features/ChartsView.jsx';
import ChartReader from './features/ChartReader.jsx';
import YarnView from './features/YarnView.jsx';
import PatternsView from './features/PatternsView.jsx';
import PatternViewer from './features/PatternViewer.jsx';
import SettingsView from './features/SettingsView.jsx';
import { cn } from './lib/utils.js';

const TABS = [
  { id: 'projects', label: 'Projects', icon: Basket },
  { id: 'charts', label: 'Charts', icon: Grid2x2 },
  { id: 'yarn', label: 'Yarn', icon: Volleyball },
  { id: 'patterns', label: 'Patterns', icon: BookOpen },
  { id: 'more', label: 'More', icon: Settings },
];

const SUBTITLES = {
  projects: 'What you’re making now',
  'project-detail': 'Count along as you go',
  charts: 'Mosaic charts, row by row',
  'chart-reader': 'One row at a time',
  yarn: 'Your yarn stash',
  patterns: 'Your pattern library',
  'pattern-viewer': 'Reading a pattern',
  more: 'Make it yours',
};

export function applyTheme(id) {
  if (id === 'hearth') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', id);
  settings.set('theme', id);
  const bg = getComputedStyle(document.body).backgroundColor;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

export default function App() {
  const [route, setRoute] = useState({ view: 'projects', id: null });
  const announcerRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    registerAnnouncer(announcerRef.current);
    const saved = settings.get('theme');
    const preferDark = matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (preferDark ? 'night' : 'hearth'));
    applyPlatform(settings.get('platform', 'auto'));
    document.documentElement.style.setProperty('--font-scale', String(settings.get('fontScale', 1)));
  }, []);

  const navigate = (view, id = null) => {
    setRoute({ view, id });
    mainRef.current?.focus();
  };

  const activeTab =
    route.view.startsWith('project') ? 'projects' :
    route.view.startsWith('chart') ? 'charts' :
    route.view.startsWith('pattern') ? 'patterns' : route.view;

  return (
    <div className="app-shell mx-auto max-w-2xl pb-24">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <header className="px-4 pt-4 pb-1 text-center">
        <h1 className="text-2xl font-bold">
          <span aria-hidden="true">🧶</span> Hearth &amp; Hook
        </h1>
        <p className="text-sm text-muted-foreground">{SUBTITLES[route.view] || ''}</p>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="px-4 py-3 outline-none">
        {route.view === 'projects' && <ProjectsView navigate={navigate} />}
        {route.view === 'project-detail' && <ProjectDetail id={route.id} navigate={navigate} />}
        {route.view === 'charts' && <ChartsView navigate={navigate} />}
        {route.view === 'chart-reader' && <ChartReader id={route.id} navigate={navigate} />}
        {route.view === 'yarn' && <YarnView />}
        {route.view === 'patterns' && <PatternsView navigate={navigate} />}
        {route.view === 'pattern-viewer' && <PatternViewer id={route.id} navigate={navigate} />}
        {route.view === 'more' && <SettingsView navigate={navigate} />}
      </main>

      <nav aria-label="Main" className="tab-bar fixed inset-x-0 bottom-0 z-40 flex border-t bg-card pb-[env(safe-area-inset-bottom,0px)]">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const current = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={current ? 'page' : undefined}
              onClick={() => navigate(tab.id)}
              className={cn(
                'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 border-t-3 border-transparent text-xs',
                current ? '-mt-px border-primary font-bold text-foreground' : 'text-muted-foreground'
              )}
            >
              <span className="tab-icon inline-flex items-center justify-center">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div ref={announcerRef} className="sr-only" aria-live="polite" />
    </div>
  );
}
