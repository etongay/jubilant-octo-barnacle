import { useEffect, useState } from 'react';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from '@/lib/icons.jsx';

// Sample an uploaded chart photo into a two-colour grid: each cell takes
// the average of its pixels, split into dark/light around the midpoint.
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
      const lums = [], rgbs = [];
      for (let i = 0; i < width * height; i++) {
        const [r, g, b] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
        rgbs.push([r, g, b]);
        lums.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
      }
      const mid = (Math.min(...lums) + Math.max(...lums)) / 2;
      const cells = new Array(width * height);
      const darkAvg = [0, 0, 0, 0], lightAvg = [0, 0, 0, 0];
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
      resolve({ cells, dark: hex(darkAvg) || '#7a5c3e', light: hex(lightAvg) || '#f3ead9' });
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('bad image')); };
    img.src = URL.createObjectURL(file);
  });
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

export default function ChartsView({ navigate }) {
  const [charts, setCharts] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', width: '20', height: '20', colorA: '#7a5c3e', colorB: '#f3ead9' });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    db.getAll('charts').then(list => setCharts(list.sort((a, b) => b.updatedAt - a.updatedAt)));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const width = clamp(Number(form.width), 2, 200);
    const height = clamp(Number(form.height), 2, 300);
    const palette = [form.colorA, form.colorB];
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
      name: form.name.trim(), width, height, palette, cells,
      doneCells: new Array(width * height).fill(false),
      doneRows: new Array(height).fill(false),
      currentRow: 1,
    });
    announce('Chart created');
    setOpen(false);
    navigate('chart-reader', saved.id);
  };

  return (
    <section aria-labelledby="charts-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="charts-heading" className="text-xl font-bold">Mosaic charts</h2>
        <Button onClick={() => { setForm({ name: '', width: '20', height: '20', colorA: '#7a5c3e', colorB: '#f3ead9' }); setImageFile(null); setOpen(true); }}>
          <Plus aria-hidden="true" /> New chart
        </Button>
      </div>

      {charts.length === 0 && (
        <p className="py-10 text-center italic text-muted-foreground">
          No charts yet. Create a grid or import one from a photo.
        </p>
      )}

      <ul aria-label="Your charts" className="grid list-none gap-3 p-0">
        {charts.map(ch => {
          const done = ch.doneRows.filter(Boolean).length;
          const pct = Math.round((done / ch.height) * 100);
          return (
            <li key={ch.id}>
              <Card className="py-0">
                <button type="button" onClick={() => navigate('chart-reader', ch.id)} className="w-full rounded-xl text-left">
                  <CardContent className="px-4 py-3.5">
                    <div className="font-bold">{ch.name}</div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {ch.width} × {ch.height} · {done} of {ch.height} rows done
                    </p>
                    <Progress value={pct} aria-label="Rows completed" className="mt-2" />
                  </CardContent>
                </button>
              </Card>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New mosaic chart</DialogTitle>
            <DialogDescription>Start from a blank grid, or from a photo of a printed chart.</DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="chf-name">Chart name (required)</Label>
              <Input id="chf-name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="chf-width">Stitches wide</Label>
                <Input id="chf-width" type="number" min="2" max="200" inputMode="numeric"
                  value={form.width} onChange={e => setForm(f => ({ ...f, width: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="chf-height">Rows tall</Label>
                <Input id="chf-height" type="number" min="2" max="300" inputMode="numeric"
                  value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="chf-colora">Colour A</Label>
                <Input id="chf-colora" type="color" className="h-11 w-20 p-1"
                  value={form.colorA} onChange={e => setForm(f => ({ ...f, colorA: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="chf-colorb">Colour B</Label>
                <Input id="chf-colorb" type="color" className="h-11 w-20 p-1"
                  value={form.colorB} onChange={e => setForm(f => ({ ...f, colorB: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="chf-image">Or start from a photo of a chart (optional)</Label>
              <Input id="chf-image" type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0] || null)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
