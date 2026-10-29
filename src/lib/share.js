// Project share text for the phone's share sheet or clipboard.

import { db } from './db.js';

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
