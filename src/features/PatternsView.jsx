import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { LinkIcon, FileText, Camera, Trash2, ExternalLink } from '@/lib/icons.jsx';

const SOURCE_ICON = {
  url: <LinkIcon className="size-4" aria-hidden="true" />,
  file: <FileText className="size-4" aria-hidden="true" />,
  photo: <Camera className="size-4" aria-hidden="true" />,
};

const parseTags = (raw) => (raw || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

export default function PatternsView() {
  const [patterns, setPatterns] = useState([]);
  const [filter, setFilter] = useState('');
  const [urlOpen, setUrlOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [capture, setCapture] = useState(false);
  const [form, setForm] = useState({ url: '', title: '', tags: '' });
  const fileRef = useRef(null);

  const reload = useCallback(() => {
    db.getAll('patterns').then(list => setPatterns(list.sort((a, b) => b.updatedAt - a.updatedAt)));
  }, []);
  useEffect(reload, [reload]);

  const saveUrl = async (e) => {
    e.preventDefault();
    await db.put('patterns', {
      title: form.title.trim(), url: form.url.trim(), source: 'url', tags: parseTags(form.tags),
    });
    announce('Pattern link saved');
    setUrlOpen(false);
    reload();
  };

  const saveFile = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files[0];
    if (!file || !form.title.trim()) return;
    await db.put('patterns', {
      title: form.title.trim(),
      source: file.type.startsWith('image/') ? 'photo' : 'file',
      blob: file,
      mime: file.type,
      fileName: file.name,
      tags: parseTags(form.tags),
    });
    announce('Pattern saved to your library');
    setFileOpen(false);
    reload();
  };

  const openPattern = (p) => {
    if (p.url) window.open(p.url, '_blank', 'noopener');
    else if (p.blob) window.open(URL.createObjectURL(p.blob), '_blank');
  };

  const shown = filter
    ? patterns.filter(p => (p.title + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(filter.toLowerCase()))
    : patterns;

  const openFileDialog = (withCapture) => {
    setCapture(withCapture);
    setForm({ url: '', title: '', tags: '' });
    setFileOpen(true);
  };

  return (
    <section aria-labelledby="patterns-heading">
      <h2 id="patterns-heading" className="mb-3 text-xl font-bold">Pattern library</h2>

      <div role="group" aria-label="Import a pattern" className="mb-3 flex flex-wrap gap-2">
        <Button className="flex-1" onClick={() => { setForm({ url: '', title: '', tags: '' }); setUrlOpen(true); }}>
          <LinkIcon aria-hidden="true" /> From web
        </Button>
        <Button className="flex-1" onClick={() => openFileDialog(false)}>
          <FileText aria-hidden="true" /> Upload file
        </Button>
        <Button className="flex-1" onClick={() => openFileDialog(true)}>
          <Camera aria-hidden="true" /> Take photo
        </Button>
      </div>

      <Label htmlFor="pattern-filter" className="sr-only">Filter patterns by tag or title</Label>
      <Input id="pattern-filter" type="search" placeholder="Filter — title or tag…"
        value={filter} onChange={e => setFilter(e.target.value)} className="mb-3" />

      {patterns.length === 0 && (
        <p className="py-10 text-center italic text-muted-foreground">
          No patterns yet. Import from the web, upload a PDF, or snap a photo.
        </p>
      )}

      <ul aria-label="Your patterns" className="grid list-none gap-3 p-0">
        {shown.map(p => (
          <li key={p.id}>
            <Card className="py-0">
              <CardContent className="flex items-center justify-between gap-2 px-4 py-3.5">
                <button type="button" onClick={() => openPattern(p)} className="flex-1 text-left">
                  <span className="flex items-center gap-2 font-bold">
                    {SOURCE_ICON[p.source]} {p.title}
                    <ExternalLink className="size-3.5 opacity-60" aria-hidden="true" />
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {(p.tags || []).map(t => <Badge key={t}>{t}</Badge>)}
                  </span>
                </button>
                <Button variant="ghost" size="icon" aria-label={'Delete pattern ' + p.title}
                  onClick={async () => {
                    if (!confirm(`Delete pattern “${p.title}”?`)) return;
                    await db.delete('patterns', p.id);
                    announce('Pattern deleted');
                    reload();
                  }}>
                  <Trash2 aria-hidden="true" />
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add pattern from the web</DialogTitle>
            <DialogDescription>Save a link to a pattern anywhere online.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveUrl} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="pu-url">Link (required)</Label>
              <Input id="pu-url" type="url" required placeholder="https://…" value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pu-title">Title (required)</Label>
              <Input id="pu-title" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pu-tags">Tags (comma separated)</Label>
              <Input id="pu-tags" placeholder="blanket, mosaic, gift" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUrlOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={fileOpen} onOpenChange={setFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{capture ? 'Photograph pattern' : 'Import pattern'}</DialogTitle>
            <DialogDescription>
              {capture ? 'Snap a picture of a printed pattern.' : 'PDFs, images, and text files are stored in the app and work offline.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveFile} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="pfile-input">{capture ? 'Take a photo of the pattern' : 'Choose file'}</Label>
              <Input id="pfile-input" ref={fileRef} type="file" required
                accept={capture ? 'image/*' : '.pdf,image/*,.txt'}
                capture={capture ? 'environment' : undefined}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setForm(f => f.title ? f : { ...f, title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') });
                  }
                }} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pfile-title">Title (required)</Label>
              <Input id="pfile-title" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pfile-tags">Tags (comma separated)</Label>
              <Input id="pfile-tags" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFileOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
