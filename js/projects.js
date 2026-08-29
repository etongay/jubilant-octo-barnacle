// Projects: list, detail view, stitch/row counters, yarn links, Ravelry share.

import { db } from './db.js';
import { announce, switchView } from './app.js';
import { buildShareText } from './ravelry.js';

let currentProject = null;

const STATUS_LABELS = {
  'planned': 'Planned', 'in-progress': 'In progress', 'finished': 'Finished',
  'hibernating': 'Hibernating', 'frogged': 'Frogged',
};

export function initProjects() {
  document.getElementById('btn-new-project').addEventListener('click', () => openProjectDialog(null));
  document.getElementById('btn-edit-project').addEventListener('click', () => openProjectDialog(currentProject));

  document.getElementById('form-project').addEventListener('submit', async () => {
    const p = currentProjectDraft || {
      counters: [
        { id: crypto.randomUUID(), name: 'Rows', value: 0, target: null },
        { id: crypto.randomUUID(), name: 'Stitches', value: 0, target: null },
      ],
      yarnIds: [], notes: '',
    };
    p.name = document.getElementById('pf-name').value.trim();
    p.patternId = document.getElementById('pf-pattern').value || null;
    p.hook = document.getElementById('pf-hook').value.trim();
    p.status = document.getElementById('pf-status').value;
    const saved = await db.put('projects', p);
    announce('Project saved');
    switchView('project-detail', saved.id);
  });

  document.getElementById('btn-add-counter').addEventListener('click', () => {
    document.getElementById('form-counter').reset();
    document.getElementById('dlg-counter').showModal();
  });
  document.getElementById('form-counter').addEventListener('submit', async () => {
    const name = document.getElementById('cf-name').value.trim();
    const target = document.getElementById('cf-target').value;
    currentProject.counters.push({
      id: crypto.randomUUID(), name, value: 0,
      target: target ? Number(target) : null,
    });
    await db.put('projects', currentProject);
    renderCounters();
    announce(name + ' counter added');
  });

  const notes = document.getElementById('project-notes');
  notes.addEventListener('change', async () => {
    currentProject.notes = notes.value;
    await db.put('projects', currentProject);
    announce('Notes saved');
  });

  document.getElementById('btn-delete-project').addEventListener('click', async () => {
    if (!confirm(`Delete “${currentProject.name}”? This cannot be undone.`)) return;
    await db.delete('projects', currentProject.id);
    announce('Project deleted');
    switchView('projects');
  });

  document.getElementById('btn-link-yarn').addEventListener('click', openLinkYarnDialog);

  document.getElementById('btn-share-ravelry').addEventListener('click', async () => {
    const text = await buildShareText(currentProject);
    document.getElementById('share-text').value = text;
    document.getElementById('dlg-share').showModal();
  });
  document.getElementById('btn-copy-share').addEventListener('click', async () => {
    await navigator.clipboard.writeText(document.getElementById('share-text').value);
    announce('Copied to clipboard');
  });
  document.getElementById('btn-native-share').addEventListener('click', async () => {
    const text = document.getElementById('share-text').value;
    if (navigator.share) {
      try { await navigator.share({ title: currentProject.name, text }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      announce('Sharing not supported here — copied to clipboard instead');
    }
  });
}

let currentProjectDraft = null;

async function openProjectDialog(project) {
  currentProjectDraft = project;
  document.getElementById('dlg-project-title').textContent = project ? 'Edit project' : 'New project';
  document.getElementById('pf-name').value = project?.name || '';
  document.getElementById('pf-hook').value = project?.hook || '';
  document.getElementById('pf-status').value = project?.status || 'in-progress';

  const sel = document.getElementById('pf-pattern');
  sel.replaceChildren(new Option('— none yet —', ''));
  for (const pat of await db.getAll('patterns')) {
    sel.append(new Option(pat.title, pat.id));
  }
  sel.value = project?.patternId || '';
  document.getElementById('dlg-project').showModal();
}

export async function showProjects() {
  const list = document.getElementById('project-list');
  const projects = (await db.getAll('projects')).sort((a, b) => b.updatedAt - a.updatedAt);
  document.getElementById('projects-empty').hidden = projects.length > 0;
  list.replaceChildren(...projects.map(p => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-btn';
    const rows = (p.counters || []).find(c => /row/i.test(c.name));
    const progress = rows?.target ? Math.min(100, Math.round(rows.value / rows.target * 100)) : null;
    btn.innerHTML = `
      <div class="card-title"></div>
      <div class="card-sub"></div>
      ${progress !== null ? `
        <div class="progress-track" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Row progress">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>` : ''}`;
    btn.querySelector('.card-title').textContent = p.name;
    btn.querySelector('.card-sub').textContent =
      STATUS_LABELS[p.status] + (rows ? ` · ${rows.value}${rows.target ? ' of ' + rows.target : ''} rows` : '');
    btn.addEventListener('click', () => switchView('project-detail', p.id));
    li.append(btn);
    return li;
  }));
}

export async function showProjectDetail(id) {
  currentProject = await db.get('projects', id);
  if (!currentProject) return switchView('projects');
  currentProject.counters = currentProject.counters || [];
  document.getElementById('project-detail-heading').textContent = currentProject.name;
  document.getElementById('project-status-chip').textContent = STATUS_LABELS[currentProject.status];
  document.getElementById('project-notes').value = currentProject.notes || '';
  renderCounters();
  renderPatternInfo();
  renderProjectYarn();
}

function renderCounters() {
  const wrap = document.getElementById('counter-list');
  wrap.replaceChildren(...currentProject.counters.map(counter => {
    const el = document.createElement('div');
    el.className = 'counter';
    el.innerHTML = `
      <div class="counter-top">
        <span class="counter-name"></span>
        <button type="button" class="counter-small-btn" data-act="remove">remove</button>
      </div>
      <div class="counter-controls">
        <button type="button" class="counter-btn minus" aria-label="Decrease">−</button>
        <output class="counter-value" aria-live="off"></output>
        <button type="button" class="counter-btn plus" aria-label="Increase">+</button>
      </div>
      <div class="counter-foot">
        <span class="counter-target"></span>
        <button type="button" class="counter-small-btn" data-act="reset">reset to 0</button>
      </div>`;
    el.querySelector('.counter-name').textContent = counter.name;
    const minus = el.querySelector('.minus');
    const plus = el.querySelector('.plus');
    minus.setAttribute('aria-label', `Decrease ${counter.name}`);
    plus.setAttribute('aria-label', `Increase ${counter.name}`);
    const value = el.querySelector('.counter-value');
    const targetEl = el.querySelector('.counter-target');
    const update = () => {
      value.textContent = counter.value;
      targetEl.textContent = counter.target ? `of ${counter.target}` : '';
    };
    update();
    const bump = async (delta) => {
      counter.value = Math.max(0, counter.value + delta);
      update();
      await db.put('projects', currentProject);
      announce(`${counter.name}: ${counter.value}`);
      if (counter.target && counter.value === counter.target) {
        announce(`${counter.name} target reached — ${counter.value} of ${counter.target}. Lovely work!`);
      }
      if (navigator.vibrate) navigator.vibrate(10);
    };
    plus.addEventListener('click', () => bump(1));
    minus.addEventListener('click', () => bump(-1));
    el.querySelector('[data-act="reset"]').addEventListener('click', async () => {
      if (!confirm(`Reset ${counter.name} to 0?`)) return;
      counter.value = 0;
      update();
      await db.put('projects', currentProject);
      announce(`${counter.name} reset to 0`);
    });
    el.querySelector('[data-act="remove"]').addEventListener('click', async () => {
      if (!confirm(`Remove the ${counter.name} counter?`)) return;
      currentProject.counters = currentProject.counters.filter(c => c.id !== counter.id);
      await db.put('projects', currentProject);
      renderCounters();
      announce(`${counter.name} counter removed`);
    });
    return el;
  }));
}

async function renderPatternInfo() {
  const wrap = document.getElementById('project-pattern-info');
  const parts = [];
  if (currentProject.hook) {
    const hook = document.createElement('p');
    hook.textContent = 'Hook: ' + currentProject.hook;
    parts.push(hook);
  }
  if (currentProject.patternId) {
    const pat = await db.get('patterns', currentProject.patternId);
    if (pat) {
      const p = document.createElement('p');
      if (pat.url) {
        const a = document.createElement('a');
        a.href = pat.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = pat.title;
        p.append(a);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'counter-small-btn';
        btn.textContent = 'Open “' + pat.title + '”';
        btn.addEventListener('click', () => {
          const url = URL.createObjectURL(pat.blob);
          window.open(url, '_blank');
        });
        p.append(btn);
      }
      parts.push(p);
    }
  }
  if (!parts.length) {
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'No pattern linked yet — use “Edit details” to pick one from your library.';
    parts.push(p);
  }
  wrap.replaceChildren(...parts);
}

async function renderProjectYarn() {
  const ul = document.getElementById('project-yarn-list');
  const items = [];
  for (const yid of currentProject.yarnIds || []) {
    const y = await db.get('yarn', yid);
    if (!y) continue;
    const li = document.createElement('li');
    li.textContent = `${y.brand ? y.brand + ' ' : ''}${y.name}${y.colorway ? ' — ' + y.colorway : ''}`;
    items.push(li);
  }
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'hint';
    li.textContent = 'No yarn linked yet.';
    items.push(li);
  }
  ul.replaceChildren(...items);
}

async function openLinkYarnDialog() {
  const ul = document.getElementById('link-yarn-list');
  const stash = await db.getAll('yarn');
  if (!stash.length) {
    const li = document.createElement('li');
    li.className = 'hint';
    li.textContent = 'Your stash is empty — add yarn on the Yarn tab first.';
    ul.replaceChildren(li);
  } else {
    ul.replaceChildren(...stash.map(y => {
      const li = document.createElement('li');
      const label = document.createElement('label');
      label.style.display = 'flex';
      label.style.gap = '0.5rem';
      label.style.alignItems = 'center';
      label.style.minHeight = '44px';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.style.width = 'auto';
      cb.checked = (currentProject.yarnIds || []).includes(y.id);
      cb.addEventListener('change', async () => {
        currentProject.yarnIds = currentProject.yarnIds || [];
        if (cb.checked) currentProject.yarnIds.push(y.id);
        else currentProject.yarnIds = currentProject.yarnIds.filter(i => i !== y.id);
        await db.put('projects', currentProject);
        renderProjectYarn();
      });
      label.append(cb, `${y.brand ? y.brand + ' ' : ''}${y.name}${y.colorway ? ' — ' + y.colorway : ''}`);
      li.append(label);
      return li;
    }));
  }
  document.getElementById('dlg-link-yarn').showModal();
}
