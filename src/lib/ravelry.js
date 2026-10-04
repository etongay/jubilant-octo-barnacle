// Ravelry integration.
//
// Ravelry offers free per-user API keys ("Basic Auth: read only") from
// https://www.ravelry.com/pro/developer — no server needed, and the API
// sends CORS headers so it works straight from the browser. The keys are
// stored only in this device's localStorage.
//
// Read access covers yarn search (a genuinely yarn-aware database that
// includes Scheepjes, Drops, Stylecraft, …) and the current user.
// Creating projects on Ravelry requires OAuth with a server-side secret,
// which a static app can't hold safely — so sharing works by composing a
// ready-to-paste project summary plus the phone's native share sheet.

import { db, settings } from './db.js';

const API = 'https://api.ravelry.com';

function authHeader() {
  const user = settings.get('ravUser', '');
  const pass = settings.get('ravPass', '');
  if (!user || !pass) throw new Error('Add your Ravelry keys under Settings first.');
  return 'Basic ' + btoa(user + ':' + pass);
}

async function ravGet(path) {
  const res = await fetch(API + path, { headers: { Authorization: authHeader() } });
  if (res.status === 401) throw new Error('Ravelry rejected the keys — check them in Settings.');
  if (!res.ok) throw new Error('Ravelry error ' + res.status);
  return res.json();
}

export async function testRavelry() {
  const data = await ravGet('/current_user.json');
  return data.user?.username || 'unknown user';
}

export async function searchRavelryYarn(query) {
  const data = await ravGet('/yarns/search.json?page_size=1&query=' + encodeURIComponent(query));
  return data.yarns?.[0] || null;
}

export async function buildShareText(project) {
  const lines = [project.name, ''];
  const status = { 'planned': 'Planned', 'in-progress': 'In progress', 'finished': 'Finished!', 'hibernating': 'Hibernating', 'frogged': 'Frogged' }[project.status];
  lines.push('Status: ' + status);
  if (project.hook) lines.push('Hook: ' + project.hook);

  if (project.patternId) {
    const pat = await db.get('patterns', project.patternId);
    if (pat) lines.push('Pattern: ' + pat.title + (pat.url ? ' — ' + pat.url : ''));
  }

  const yarnLines = [];
  for (const yid of project.yarnIds || []) {
    const y = await db.get('yarn', yid);
    if (y) yarnLines.push(`  • ${y.brand ? y.brand + ' ' : ''}${y.name}${y.colorway ? ' in ' + y.colorway : ''}${y.weight ? ' (' + y.weight + ')' : ''}`);
  }
  if (yarnLines.length) lines.push('Yarn:', ...yarnLines);

  const counters = (project.counters || []).filter(c => c.value > 0);
  if (counters.length) {
    lines.push('Progress: ' + counters.map(c => `${c.value}${c.target ? '/' + c.target : ''} ${c.name.toLowerCase()}`).join(', '));
  }
  if (project.notes) lines.push('', 'Notes: ' + project.notes);
  lines.push('', '— tracked with Woolgaze');
  return lines.join('\n');
}
