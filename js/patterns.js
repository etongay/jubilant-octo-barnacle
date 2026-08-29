// Pattern library: import from a web link, an uploaded file (PDF, image,
// text), or a photo taken with the camera. Organised with free-form tags.

import { db } from './db.js';
import { announce } from './app.js';

export function initPatterns() {
  document.getElementById('btn-pattern-url').addEventListener('click', () => {
    document.getElementById('form-pattern-url').reset();
    document.getElementById('dlg-pattern-url').showModal();
  });

  document.getElementById('form-pattern-url').addEventListener('submit', async () => {
    await db.put('patterns', {
      title: document.getElementById('pu-title').value.trim(),
      url: document.getElementById('pu-url').value.trim(),
      source: 'url',
      tags: parseTags(document.getElementById('pu-tags').value),
    });
    announce('Pattern link saved');
    showPatterns();
  });

  const openFileDialog = (capture) => {
    const form = document.getElementById('form-pattern-file');
    form.reset();
    const input = document.getElementById('pfile-input');
    if (capture) {
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      document.getElementById('pfile-label').textContent = 'Take a photo of the pattern';
      document.getElementById('dlg-pattern-file-title').textContent = 'Photograph pattern';
    } else {
      input.accept = '.pdf,image/*,.txt';
      input.removeAttribute('capture');
      document.getElementById('pfile-label').textContent = 'Choose file';
      document.getElementById('dlg-pattern-file-title').textContent = 'Import pattern';
    }
    document.getElementById('dlg-pattern-file').showModal();
  };
  document.getElementById('btn-pattern-file').addEventListener('click', () => openFileDialog(false));
  document.getElementById('btn-pattern-photo').addEventListener('click', () => openFileDialog(true));

  // Suggest a title from the chosen file's name.
  document.getElementById('pfile-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const title = document.getElementById('pfile-title');
    if (file && !title.value) {
      title.value = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    }
  });

  document.getElementById('form-pattern-file').addEventListener('submit', async (e) => {
    const file = document.getElementById('pfile-input').files[0];
    if (!file) return;
    await db.put('patterns', {
      title: document.getElementById('pfile-title').value.trim(),
      source: file.type.startsWith('image/') ? 'photo' : 'file',
      blob: file,
      mime: file.type,
      fileName: file.name,
      tags: parseTags(document.getElementById('pfile-tags').value),
    });
    announce('Pattern saved to your library');
    showPatterns();
  });

  document.getElementById('pattern-filter').addEventListener('input', showPatterns);
}

function parseTags(raw) {
  return raw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

const SOURCE_ICON = { url: '🔗', file: '📄', photo: '📷' };

export async function showPatterns() {
  const filter = document.getElementById('pattern-filter').value.trim().toLowerCase();
  const list = document.getElementById('pattern-list');
  let patterns = (await db.getAll('patterns')).sort((a, b) => b.updatedAt - a.updatedAt);
  document.getElementById('patterns-empty').hidden = patterns.length > 0;
  if (filter) {
    patterns = patterns.filter(p =>
      (p.title + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(filter));
  }
  list.replaceChildren(...patterns.map(p => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-btn';
    btn.innerHTML = '<div class="card-title"></div><div class="card-sub"></div>';
    btn.querySelector('.card-title').textContent = `${SOURCE_ICON[p.source] || ''} ${p.title}`;
    btn.querySelector('.card-sub').textContent =
      (p.tags?.length ? p.tags.join(' · ') : 'no tags') + ' — tap to open';
    btn.addEventListener('click', () => openPattern(p));
    li.append(btn);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'counter-small-btn';
    del.textContent = 'delete';
    del.setAttribute('aria-label', 'Delete pattern ' + p.title);
    del.style.marginLeft = '1rem';
    del.addEventListener('click', async () => {
      if (!confirm(`Delete pattern “${p.title}”?`)) return;
      await db.delete('patterns', p.id);
      announce('Pattern deleted');
      showPatterns();
    });
    li.append(del);
    return li;
  }));
}

function openPattern(p) {
  if (p.url) {
    window.open(p.url, '_blank', 'noopener');
  } else if (p.blob) {
    const url = URL.createObjectURL(p.blob);
    window.open(url, '_blank');
    // The blob URL is left alive for the new tab; the browser reclaims it
    // when this page is unloaded.
  }
}
