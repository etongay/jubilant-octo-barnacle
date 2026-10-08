import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { lookupBarcode, rememberBarcode } from '@/lib/lookup.js';
import { searchRavelryYarn } from '@/lib/ravelry.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Camera, MagnifyingGlass } from '@/lib/icons.jsx';

const WEIGHTS = ['Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Aran', 'Bulky', 'Super bulky'];
const NONE = '__none__';

function ScannerDialog({ open, onOpenChange, onResult }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Starting camera…');
  const [manual, setManual] = useState('');
  const stateRef = useRef({ stream: null, stopped: false, reader: null });

  const stop = useCallback(() => {
    const s = stateRef.current;
    s.stopped = true;
    if (s.reader) { try { s.reader.reset(); } catch { /* already stopped */ } }
    if (s.stream) s.stream.getTracks().forEach(t => t.stop());
    s.stream = null; s.reader = null;
  }, []);

  useEffect(() => {
    if (!open) return;
    const s = stateRef.current;
    s.stopped = false;
    setManual('');
    setStatus('Starting camera…');

    const finish = (code) => { stop(); onResult(code); };

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('No camera available here — type the number below instead.');
      return stop;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (stream) => {
        if (s.stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        s.stream = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setStatus('Point the camera at the barcode…');

        if ('BarcodeDetector' in window) {
          const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
          const tick = async () => {
            if (s.stopped) return;
            try {
              const codes = await detector.detect(video);
              if (codes.length) { finish(codes[0].rawValue); return; }
            } catch { /* frame not ready yet */ }
            requestAnimationFrame(tick);
          };
          tick();
        } else {
          try {
            const ZXing = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/+esm');
            if (s.stopped) return;
            s.reader = new ZXing.BrowserMultiFormatReader();
            s.reader.decodeFromStream(stream, video, (result) => {
              if (result && !s.stopped) finish(result.getText());
            });
          } catch {
            setStatus('Barcode reading isn’t supported on this browser — type the number below instead.');
          }
        }
      })
      .catch(() => setStatus('Camera permission was refused — type the number below instead.'));

    return stop;
  }, [open, onResult, stop]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) stop(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan ball band barcode</DialogTitle>
          <DialogDescription aria-live="polite">{status}</DialogDescription>
        </DialogHeader>
        <video ref={videoRef} playsInline aria-label="Camera preview for barcode scanning"
          className="aspect-[4/3] w-full rounded-lg bg-black object-cover" />
        <div className="grid gap-1.5">
          <Label htmlFor="scanner-manual">Or type the number</Label>
          <Input id="scanner-manual" inputMode="numeric" placeholder="EAN / UPC digits"
            value={manual} onChange={e => setManual(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { stop(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={() => { stop(); onResult(manual.replace(/\D/g, '') || null); }}>
            Use typed number
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function YarnView() {
  const [stash, setStash] = useState([]);
  const [filter, setFilter] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({});
  const [ravBusy, setRavBusy] = useState(false);

  const reload = useCallback(() => {
    db.getAll('yarn').then(list => setStash(list.sort((a, b) => b.updatedAt - a.updatedAt)));
  }, []);
  useEffect(reload, [reload]);

  const openForm = (yarn) => {
    setForm({ qty: 1, ...yarn, weight: yarn.weight || NONE });
    setFormOpen(true);
  };

  const onScanned = async (code) => {
    setScannerOpen(false);
    if (!code) return;
    const existing = stash.find(y => y.barcode === code);
    if (existing) {
      if (confirm(`That's ${existing.brand ? existing.brand + ' ' : ''}${existing.name} — already in your stash (${existing.qty} skeins). Add one more skein?`)) {
        await db.put('yarn', { ...existing, qty: existing.qty + 1 });
        announce(`Now ${existing.qty + 1} skeins of ${existing.name}`);
        reload();
        return;
      }
    }
    announce('Looking up barcode ' + code + '…');
    const info = await lookupBarcode(code);
    if (!info.name && !info.brand) {
      announce('No product match found — fill in the details once and this barcode will be remembered.');
    }
    openForm({ barcode: code, ...info });
  };

  const saveYarn = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    const yarn = {
      ...form,
      name: form.name.trim(),
      weight: form.weight === NONE ? '' : form.weight,
      qty: Number(form.qty || 0),
    };
    const saved = await db.put('yarn', yarn);
    await rememberBarcode(saved);
    announce('Yarn saved to stash');
    setFormOpen(false);
    reload();
  };

  const fillFromRavelry = async () => {
    const query = [form.brand, form.name].filter(Boolean).join(' ').trim();
    if (!query) { announce('Enter a brand or name first'); return; }
    setRavBusy(true);
    try {
      const y = await searchRavelryYarn(query);
      if (y) {
        setForm(f => ({
          ...f,
          brand: f.brand || y.yarn_company_name || '',
          name: y.name || f.name,
          weight: WEIGHTS.find(w => y.yarn_weight?.name?.toLowerCase().includes(w.toLowerCase())) || f.weight,
        }));
        announce('Details filled from Ravelry');
      } else {
        announce('No match found on Ravelry');
      }
    } catch (err) {
      announce('Ravelry lookup failed: ' + err.message);
    } finally {
      setRavBusy(false);
    }
  };

  const shown = filter
    ? stash.filter(y => [y.brand, y.name, y.colorway, y.weight, y.fiber].join(' ').toLowerCase().includes(filter.toLowerCase()))
    : stash;

  return (
    <section aria-labelledby="yarn-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="yarn-heading" className="text-xl font-bold">Yarn stash</h2>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setScannerOpen(true)}>
            <Camera aria-hidden="true" /> Scan barcode
          </Button>
          <Button variant="outline" onClick={() => openForm({})}>
            <Plus aria-hidden="true" /> Add by hand
          </Button>
        </div>
      </div>

      <Label htmlFor="yarn-search" className="sr-only">Search your stash</Label>
      <Input id="yarn-search" type="search" placeholder="Search stash — brand, colour, weight…"
        value={filter} onChange={e => setFilter(e.target.value)} className="mb-3" />

      {stash.length === 0 && (
        <p className="py-10 text-center italic text-muted-foreground">
          Your stash is empty. Scan a ball band barcode or add yarn by hand.
        </p>
      )}

      <ul aria-label="Your yarn stash" className="grid list-none gap-3 p-0">
        {shown.map(y => (
          <li key={y.id}>
            <Card className="py-0">
              <button type="button" onClick={() => openForm(y)} className="w-full rounded-xl text-left">
                <CardContent className="px-4 py-3.5">
                  <div className="font-bold">
                    {y.brand ? y.brand + ' ' : ''}{y.name}{y.colorway ? ' — ' + y.colorway : ''}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[y.weight, y.fiber, `${y.qty} skein${y.qty === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
                  </p>
                </CardContent>
              </button>
            </Card>
          </li>
        ))}
      </ul>

      <ScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onResult={onScanned} />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit yarn' : 'Add yarn'}</DialogTitle>
            <DialogDescription>Fill in what you know — you can always come back.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveYarn} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="yf-brand">Brand</Label>
              <Input id="yf-brand" placeholder="e.g. Scheepjes" value={form.brand || ''}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="yf-name">Line / name (required)</Label>
              <Input id="yf-name" required placeholder="e.g. Catona" value={form.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="yf-colorway">Colourway</Label>
              <Input id="yf-colorway" placeholder="e.g. 522 Primrose" value={form.colorway || ''}
                onChange={e => setForm(f => ({ ...f, colorway: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="yf-weight">Weight</Label>
                <Select value={form.weight} onValueChange={w => setForm(f => ({ ...f, weight: w }))}>
                  <SelectTrigger id="yf-weight"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>—</SelectItem>
                    {WEIGHTS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="yf-qty">Skeins</Label>
                <Input id="yf-qty" type="number" min="0" inputMode="numeric" value={form.qty ?? 1}
                  onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="yf-fiber">Fibre</Label>
              <Input id="yf-fiber" placeholder="e.g. 100% cotton" value={form.fiber || ''}
                onChange={e => setForm(f => ({ ...f, fiber: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="yf-barcode">Barcode</Label>
              <Input id="yf-barcode" inputMode="numeric" value={form.barcode || ''}
                onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
            </div>
            <Button type="button" variant="outline" disabled={ravBusy} onClick={fillFromRavelry}>
              <MagnifyingGlass aria-hidden="true" /> {ravBusy ? 'Searching Ravelry…' : 'Look up details on Ravelry'}
            </Button>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit">Save to stash</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
