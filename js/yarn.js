// Yarn stash: manual entry, barcode scanning, and product lookup.
//
// Lookup order for a scanned barcode:
//   1. Your own barcode history (free, offline, instant — the same ball
//      band scans the same next time).
//   2. UPCitemdb's free trial endpoint (no key, ~100 lookups/day).
//   3. Go-UPC, if the user added an API key in Settings.
// There is no Scheepjes-specific product API, so names come back as
// printed on the band (e.g. "Scheepjes Catona 50g"); the Ravelry yarn
// search button can then fill in weight/fibre details.

import { db, settings } from './db.js';
import { announce } from './app.js';
import { scanBarcode } from './scanner.js';
import { searchRavelryYarn } from './ravelry.js';

let editingYarn = null;

export function initYarn() {
  document.getElementById('btn-add-yarn').addEventListener('click', () => openYarnDialog({}));
  document.getElementById('btn-scan-yarn').addEventListener('click', handleScan);
  document.getElementById('yarn-search').addEventListener('input', showYarn);

  document.getElementById('form-yarn').addEventListener('submit', async () => {
    const yarn = {
      ...editingYarn,
      brand: val('yf-brand'),
      name: val('yf-name'),
      colorway: val('yf-colorway'),
      weight: val('yf-weight'),
      fiber: val('yf-fiber'),
      qty: Number(document.getElementById('yf-qty').value || 0),
      barcode: val('yf-barcode'),
    };
    const saved = await db.put('yarn', yarn);
    if (saved.barcode) {
      // Remember the barcode so the next scan of this yarn is instant.
      await db.put('barcodes', {
        id: saved.barcode,
        brand: saved.brand, name: saved.name, colorway: saved.colorway,
        weight: saved.weight, fiber: saved.fiber,
      });
    }
    announce('Yarn saved to stash');
    showYarn();
  });

  document.getElementById('btn-rav-fill').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const query = [val('yf-brand'), val('yf-name')].filter(Boolean).join(' ');
    if (!query) { announce('Enter a brand or name first'); return; }
    btn.disabled = true;
    btn.textContent = 'Searching Ravelry…';
    try {
      const y = await searchRavelryYarn(query);
      if (y) {
        if (!val('yf-brand') && y.yarn_company_name) setVal('yf-brand', y.yarn_company_name);
        if (y.name) setVal('yf-name', y.name);
        if (y.yarn_weight?.name) {
          const sel = document.getElementById('yf-weight');
          const match = [...sel.options].find(o => y.yarn_weight.name.toLowerCase().includes(o.value.toLowerCase()) && o.value);
          if (match) sel.value = match.value;
        }
        announce('Details filled from Ravelry');
      } else {
        announce('No match found on Ravelry');
      }
    } catch (err) {
      announce('Ravelry lookup failed: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Look up details on Ravelry';
    }
  });
}

function val(id) { return document.getElementById(id).value.trim(); }
function setVal(id, v) { document.getElementById(id).value = v; }

function openYarnDialog(yarn) {
  editingYarn = yarn;
  document.getElementById('dlg-yarn-title').textContent = yarn.id ? 'Edit yarn' : 'Add yarn';
  setVal('yf-brand', yarn.brand || '');
  setVal('yf-name', yarn.name || '');
  setVal('yf-colorway', yarn.colorway || '');
  document.getElementById('yf-weight').value = yarn.weight || '';
  setVal('yf-fiber', yarn.fiber || '');
  document.getElementById('yf-qty').value = yarn.qty ?? 1;
  setVal('yf-barcode', yarn.barcode || '');
  document.getElementById('dlg-yarn').showModal();
}

async function handleScan() {
  let code;
  try {
    code = await scanBarcode();
  } catch (err) {
    announce('Scanner unavailable: ' + err.message);
    openYarnDialog({});
    return;
  }
  if (!code) return; // cancelled

  // Already in the stash? Offer to add a skein instead of duplicating.
  const existing = (await db.getAll('yarn')).find(y => y.barcode === code);
  if (existing) {
    if (confirm(`That's ${existing.brand ? existing.brand + ' ' : ''}${existing.name} — already in your stash (${existing.qty} skeins). Add one more skein?`)) {
      existing.qty += 1;
      await db.put('yarn', existing);
      announce(`Now ${existing.qty} skeins of ${existing.name}`);
      showYarn();
      return;
    }
  }

  announce('Looking up barcode ' + code + '…');
  const info = await lookupBarcode(code);
  openYarnDialog({ barcode: code, ...info });
  if (!info.name && !info.brand) {
    announce('No product match found — fill in the details once and this barcode will be remembered.');
  }
}

async function lookupBarcode(code) {
  // 1. Local history
  const cached = await db.get('barcodes', code);
  if (cached) {
    const { id, createdAt, updatedAt, ...info } = cached;
    return info;
  }
  // 2. UPCitemdb free trial endpoint
  try {
    const res = await fetch('https://api.upcitemdb.com/prod/trial/lookup?upc=' + encodeURIComponent(code));
    if (res.ok) {
      const data = await res.json();
      const item = data.items?.[0];
      if (item) return { brand: item.brand || '', name: item.title || '' };
    }
  } catch { /* offline or rate limited — fall through */ }
  // 3. Go-UPC with the user's key
  const key = settings.get('goupcKey', '');
  if (key) {
    try {
      const res = await fetch('https://go-upc.com/api/v1/code/' + encodeURIComponent(code), {
        headers: { Authorization: 'Bearer ' + key },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.product) return { brand: data.product.brand || '', name: data.product.name || '' };
      }
    } catch { /* fall through */ }
  }
  return {};
}

export async function showYarn() {
  const filter = document.getElementById('yarn-search').value.trim().toLowerCase();
  const list = document.getElementById('yarn-list');
  let stash = (await db.getAll('yarn')).sort((a, b) => b.updatedAt - a.updatedAt);
  document.getElementById('yarn-empty').hidden = stash.length > 0;
  if (filter) {
    stash = stash.filter(y =>
      [y.brand, y.name, y.colorway, y.weight, y.fiber].join(' ').toLowerCase().includes(filter));
  }
  list.replaceChildren(...stash.map(y => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-btn';
    btn.innerHTML = '<div class="card-title"></div><div class="card-sub"></div>';
    btn.querySelector('.card-title').textContent =
      `${y.brand ? y.brand + ' ' : ''}${y.name}${y.colorway ? ' — ' + y.colorway : ''}`;
    btn.querySelector('.card-sub').textContent =
      [y.weight, y.fiber, `${y.qty} skein${y.qty === 1 ? '' : 's'}`].filter(Boolean).join(' · ');
    btn.addEventListener('click', () => openYarnDialog(y));
    li.append(btn);
    return li;
  }));
}
