// App shell: navigation, theming, announcements, settings, backup.

import { db, settings } from './db.js';
import { initProjects, showProjects, showProjectDetail } from './projects.js';
import { initYarn, showYarn } from './yarn.js';
import { initCharts, showCharts, showChartReader } from './charts.js';
import { initPatterns, showPatterns } from './patterns.js';
import { testRavelry } from './ravelry.js';

const announcer = document.getElementById('announcer');
export function announce(msg) {
  announcer.textContent = '';
  // Re-set on next frame so repeated identical messages are re-announced.
  requestAnimationFrame(() => { announcer.textContent = msg; });
}

export function openDialog(dlg) {
  dlg.showModal();
}

const SUBTITLES = {
  projects: 'Your works in progress',
  'project-detail': 'Count along as you go',
  'chart-reader': 'One row at a time',
  charts: 'Mosaic charts, row by row',
  yarn: 'Your yarn stash',
  patterns: 'Your pattern library',
  more: 'Make it yours',
};

const views = {
  projects: showProjects,
  'project-detail': showProjectDetail,
  charts: showCharts,
  'chart-reader': showChartReader,
  yarn: showYarn,
  patterns: showPatterns,
  more: () => {},
};

export function switchView(name, detailId = null) {
  document.querySelectorAll('.view').forEach(v => { v.hidden = true; });
  const view = document.getElementById('view-' + name);
  if (view) view.hidden = false;
  document.querySelectorAll('.tab-bar button').forEach(b => {
    const isTabForView = b.dataset.view === name ||
      (name.startsWith('project') && b.dataset.view === 'projects') ||
      (name.startsWith('chart') && b.dataset.view === 'charts');
    if (isTabForView) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  document.getElementById('view-subtitle').textContent = SUBTITLES[name] || '';
  if (views[name]) views[name](detailId);
  document.getElementById('main').focus({ preventScroll: false });
}

// ---------- Theming ----------
const THEMES = [
  { id: 'hearth', label: 'Hearth', dot: '#f6efe6' },
  { id: 'meadow', label: 'Meadow', dot: '#edf1e4' },
  { id: 'lavender', label: 'Lavender', dot: '#efecf5' },
  { id: 'night', label: 'Night', dot: '#211e1a' },
  { id: 'contrast', label: 'High contrast', dot: '#ffffff' },
];

function applyTheme(id) {
  if (id === 'hearth') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', id);
  settings.set('theme', id);
  const surface = getComputedStyle(document.body).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]').setAttribute('content', surface);
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.setAttribute('aria-checked', String(btn.dataset.theme === id));
  });
}

function initTheme() {
  const picker = document.getElementById('theme-picker');
  for (const t of THEMES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-option';
    btn.dataset.theme = t.id;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.innerHTML = `<span class="theme-dot" style="background:${t.dot}" aria-hidden="true"></span>${t.label}`;
    btn.addEventListener('click', () => { applyTheme(t.id); announce(t.label + ' theme applied'); });
    picker.append(btn);
  }
  const saved = settings.get('theme');
  const preferDark = matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (preferDark ? 'night' : 'hearth'));

  const scale = document.getElementById('font-scale');
  scale.value = String(settings.get('fontScale', 1));
  document.documentElement.style.setProperty('--font-scale', scale.value);
  scale.addEventListener('change', () => {
    settings.set('fontScale', Number(scale.value));
    document.documentElement.style.setProperty('--font-scale', scale.value);
  });
}

// ---------- Settings: Ravelry + lookup keys ----------
function initSettings() {
  const ravUser = document.getElementById('rav-user');
  const ravPass = document.getElementById('rav-pass');
  const goupc = document.getElementById('goupc-key');
  ravUser.value = settings.get('ravUser', '');
  ravPass.value = settings.get('ravPass', '');
  goupc.value = settings.get('goupcKey', '');
  ravUser.addEventListener('change', () => settings.set('ravUser', ravUser.value.trim()));
  ravPass.addEventListener('change', () => settings.set('ravPass', ravPass.value.trim()));
  goupc.addEventListener('change', () => settings.set('goupcKey', goupc.value.trim()));

  document.getElementById('btn-rav-test').addEventListener('click', async () => {
    const status = document.getElementById('rav-status');
    status.textContent = 'Checking…';
    try {
      const who = await testRavelry();
      status.textContent = `Connected as ${who} ✓`;
    } catch (err) {
      status.textContent = 'Could not connect: ' + err.message;
    }
  });

  document.getElementById('btn-export').addEventListener('click', async () => {
    const data = await db.exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hearth-and-hook-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    announce('Backup downloaded');
  });

  document.getElementById('btn-import').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        await db.importAll(JSON.parse(await file.text()));
        announce('Backup imported');
        switchView('projects');
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    });
    input.click();
  });
}

// ---------- Boot ----------
document.querySelectorAll('.tab-bar button').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
document.querySelectorAll('.btn-back').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.back));
});
// Generic dialog close buttons
document.querySelectorAll('dialog [data-close]').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('dialog').close('cancel'));
});

initTheme();
initSettings();
initProjects();
initYarn();
initCharts();
initPatterns();
switchView('projects');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is best-effort */ });
}
