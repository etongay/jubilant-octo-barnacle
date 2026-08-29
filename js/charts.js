// Mosaic crochet charts: create a grid (or sample one from a photo),
// then read it row by row — mosaic charts work bottom-to-top, so row 1
// is the bottom row. Progress (done stitches, done rows, working row)
// is saved as you go.

import { db } from './db.js';
import { announce, switchView } from './app.js';

let chart = null;          // the chart being read/edited
let editMode = false;
let paintColor = 0;        // palette index used in edit mode

export function initCharts() {
  document.getElementById('btn-new-chart').addEventListener('click', () => {
    document.getElementById('form-chart').reset();
    document.getElementById('dlg-chart').showModal();
  });

  document.getElementById('form-chart').addEventListener('submit', async (e) => {
    const name = document.getElementById('chf-name').value.trim();
    const width = clamp(Number(document.getElementById('chf-width').value), 2, 200);
    const height = clamp(Number(document.getElementById('chf-height').value), 2, 300);
    const palette = [
      document.getElementById('chf-colora').value,
      document.getElementById('chf-colorb').value,
    ];
    const imageFile = document.getElementById('chf-image').files[0];

    let cells;
    if (imageFile) {
      try {
        const sampled = await sampleImage(imageFile, width, height);
        cells = sampled.cells;
        palette[0] = sampled.dark;
        palette[1] = sampled.light;
      } catch {
        announce('Could not read that image — starting with a blank grid instead.');
        cells = new Array(width * height).fill(1);
      }
    } else {
      cells = new Array(width * height).fill(1);
    }

    const saved = await db.put('charts', {
      name, width, height, palette, cells,
      doneCells: new Array(width * height).fill(false),
      doneRows: new Array(height).fill(false),
      currentRow: 1,
    });
    announce('Chart created');
    switchView('chart-reader', saved.id);
  });

  document.getElementById('btn-chart-mode').addEventListener('click', (e) => {
    editMode = !editMode;
    e.currentTarget.setAttribute('aria-pressed', String(editMode));
    e.currentTarget.textContent = editMode ? 'Done editing' : 'Edit mode';
    document.getElementById('chart-edit-tools').hidden = !editMode;
    renderGrid();
    announce(editMode ? 'Edit mode — tapping a stitch changes its colour' : 'Read mode — tapping a stitch marks it done');
  });

  document.getElementById('btn-row-prev').addEventListener('click', () => moveRow(-1));
  document.getElementById('btn-row-next').addEventListener('click', () => moveRow(1));

  document.getElementById('btn-row-done').addEventListener('click', async () => {
    const r = chart.currentRow;
    chart.doneRows[r - 1] = !chart.doneRows[r - 1];
    if (chart.doneRows[r - 1]) {
      // Marking a row done also marks its stitches, and moves you up.
      for (let c = 0; c < chart.width; c++) chart.doneCells[(r - 1) * chart.width + c] = true;
      announce(`Row ${r} complete`);
      if (r < chart.height) chart.currentRow = r + 1;
      const allDone = chart.doneRows.every(Boolean);
      if (allDone) announce('Every row is complete — the chart is finished! 🎉');
    } else {
      announce(`Row ${r} marked not done`);
    }
    await db.put('charts', chart);
    renderGrid();
  });

  document.getElementById('btn-delete-chart').addEventListener('click', async () => {
    if (!confirm(`Delete “${chart.name}”? This cannot be undone.`)) return;
    await db.delete('charts', chart.id);
    announce('Chart deleted');
    switchView('charts');
  });
}

function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo)); }

async function moveRow(delta) {
  chart.currentRow = clamp(chart.currentRow + delta, 1, chart.height);
  await db.put('charts', chart);
  renderGrid();
  announce('Working row ' + chart.currentRow);
}

export async function showCharts() {
  const list = document.getElementById('chart-list');
  const charts = (await db.getAll('charts')).sort((a, b) => b.updatedAt - a.updatedAt);
  document.getElementById('charts-empty').hidden = charts.length > 0;
  list.replaceChildren(...charts.map(ch => {
    const done = ch.doneRows.filter(Boolean).length;
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-btn';
    const pct = Math.round(done / ch.height * 100);
    btn.innerHTML = `
      <div class="card-title"></div>
      <div class="card-sub"></div>
      <div class="progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Rows completed">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>`;
    btn.querySelector('.card-title').textContent = ch.name;
    btn.querySelector('.card-sub').textContent = `${ch.width} × ${ch.height} · ${done} of ${ch.height} rows done`;
    btn.addEventListener('click', () => switchView('chart-reader', ch.id));
    li.append(btn);
    return li;
  }));
}

export async function showChartReader(id) {
  chart = await db.get('charts', id);
  if (!chart) return switchView('charts');
  editMode = false;
  paintColor = 0;
  const modeBtn = document.getElementById('btn-chart-mode');
  modeBtn.setAttribute('aria-pressed', 'false');
  modeBtn.textContent = 'Edit mode';
  document.getElementById('chart-edit-tools').hidden = true;
  document.getElementById('chart-reader-heading').textContent = chart.name;
  renderPalette();
  renderGrid();
}

function renderPalette() {
  const wrap = document.getElementById('chart-palette');
  wrap.replaceChildren(...chart.palette.map((color, i) => {
    const sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'palette-swatch';
    sw.style.background = color;
    sw.setAttribute('role', 'radio');
    sw.setAttribute('aria-checked', String(i === paintColor));
    sw.setAttribute('aria-label', 'Colour ' + String.fromCharCode(65 + i));
    sw.addEventListener('click', () => {
      paintColor = i;
      renderPalette();
      announce('Drawing with colour ' + String.fromCharCode(65 + i));
    });
    return sw;
  }));
}

function renderGrid() {
  const table = document.getElementById('chart-grid');
  document.getElementById('row-indicator').textContent =
    `Row ${chart.currentRow} of ${chart.height}`;

  const frag = document.createDocumentFragment();
  // Row `height` renders first (top); row 1 renders last (bottom).
  for (let r = chart.height; r >= 1; r--) {
    const tr = document.createElement('tr');
    if (r === chart.currentRow && !editMode) tr.className = 'row-current';
    else if (chart.doneRows[r - 1]) tr.className = 'row-done';
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = r;
    tr.append(th);
    for (let c = 0; c < chart.width; c++) {
      const idx = (r - 1) * chart.width + c;
      const td = document.createElement('td');
      td.className = 'chart-cell' + (chart.doneCells[idx] && !editMode ? ' cell-done' : '');
      td.style.background = chart.palette[chart.cells[idx]] || chart.palette[0];
      const btn = document.createElement('button');
      btn.type = 'button';
      const colorName = 'colour ' + String.fromCharCode(65 + (chart.cells[idx] || 0));
      btn.setAttribute('aria-label',
        `Row ${r}, stitch ${c + 1}, ${colorName}${chart.doneCells[idx] ? ', done' : ''}`);
      btn.addEventListener('click', () => onCellTap(idx, r, c, btn, td));
      td.append(btn);
      tr.append(td);
    }
    frag.append(tr);
  }
  table.replaceChildren(frag);
}

async function onCellTap(idx, r, c, btn, td) {
  if (editMode) {
    chart.cells[idx] = paintColor;
    td.style.background = chart.palette[paintColor];
    btn.setAttribute('aria-label', `Row ${r}, stitch ${c + 1}, colour ${String.fromCharCode(65 + paintColor)}`);
  } else {
    chart.doneCells[idx] = !chart.doneCells[idx];
    td.classList.toggle('cell-done', chart.doneCells[idx]);
    btn.setAttribute('aria-label',
      `Row ${r}, stitch ${c + 1}, colour ${String.fromCharCode(65 + (chart.cells[idx] || 0))}${chart.doneCells[idx] ? ', done' : ''}`);
    announce(`Stitch ${c + 1} ${chart.doneCells[idx] ? 'done' : 'not done'}`);
  }
  await db.put('charts', chart);
}

// Sample an uploaded chart photo into a two-colour grid: each cell takes
// the average of its pixels, then cells are split into dark/light around
// the overall midpoint.
function sampleImage(file, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height).data;
      const lums = [];
      const rgbs = [];
      for (let i = 0; i < width * height; i++) {
        const [r, g, b] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
        rgbs.push([r, g, b]);
        lums.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
      }
      const mid = (Math.min(...lums) + Math.max(...lums)) / 2;
      const cells = new Array(width * height);
      const darkAvg = [0, 0, 0, 0];
      const lightAvg = [0, 0, 0, 0];
      // Image row 0 is the top; chart row 1 is the bottom — flip vertically.
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const imgIdx = y * width + x;
          const chartRow = height - 1 - y;
          const isDark = lums[imgIdx] < mid;
          cells[chartRow * width + x] = isDark ? 0 : 1;
          const acc = isDark ? darkAvg : lightAvg;
          acc[0] += rgbs[imgIdx][0]; acc[1] += rgbs[imgIdx][1]; acc[2] += rgbs[imgIdx][2]; acc[3]++;
        }
      }
      const hex = (acc) => acc[3] === 0 ? null :
        '#' + [0, 1, 2].map(i => Math.round(acc[i] / acc[3]).toString(16).padStart(2, '0')).join('');
      URL.revokeObjectURL(img.src);
      resolve({
        cells,
        dark: hex(darkAvg) || '#7a5c3e',
        light: hex(lightAvg) || '#f3ead9',
      });
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('bad image')); };
    img.src = URL.createObjectURL(file);
  });
}
