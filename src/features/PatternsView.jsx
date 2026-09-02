// Pattern library — Study B.
//
// Folders come first as a two-column grid, because a folder is the thing
// you reach for when you already know roughly what you're after. Search
// and the type filter cut across every folder, so nothing gets lost by
// being filed.

import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  LinkIcon, FileText, Camera, Trash2, Plus, Search,
  Folder, FolderPlus, FolderOpen, MoreHorizontal, FolderInput, Pencil, ArrowLeft,
} from '@/lib/icons.jsx';

const UNFILED = '__unfiled__';
const NONE = '__none__';

const SOURCE_ICON = {
  url: <LinkIcon className="size-4" aria-hidden="true" />,
  file: <FileText className="size-4" aria-hidden="true" />,
  photo: <Camera className="size-4" aria-hidden="true" />,
};
const SOURCE_LABEL = { url: 'Web link', file: 'File', photo: 'Photo' };

const parseTags = (raw) => (raw || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

export default function PatternsView() {
  const [patterns, setPatterns] = useState([]);
  const [folders, setFolders] = useState([]);
  const [openFolder, setOpenFolder] = useState(null); // null = all, or a folder id / UNFILED
  const [filter, setFilter] = useState('');

  const [urlOpen, setUrlOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);
  const [capture, setCapture] = useState(false);
  const [form, setForm] = useState({ url: '', title: '', tags: '', folderId: NONE });
  const fileRef = useRef(null);

  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [folderDraft, setFolderDraft] = useState({ id: null, name: '' });
  const [manageFolder, setManageFolder] = useState(null);
  const [deleteFolder, setDeleteFolder] = useState(null);
  const [movePattern, setMovePattern] = useState(null);

  const reload = useCallback(async () => {
    const [pats, fldrs] = await Promise.all([db.getAll('patterns'), db.getAll('folders')]);
    setPatterns(pats.sort((a, b) => b.updatedAt - a.updatedAt));
    setFolders(fldrs.sort((a, b) => a.name.localeCompare(b.name)));
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const countIn = (id) => patterns.filter(p => (id === UNFILED ? !p.folderId : p.folderId === id)).length;

  const visible = patterns.filter(p => {
    if (openFolder === UNFILED && p.folderId) return false;
    if (openFolder && openFolder !== UNFILED && p.folderId !== openFolder) return false;
    if (!filter) return true;
    const hay = [p.title, ...(p.tags || []), SOURCE_LABEL[p.source]].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(filter.toLowerCase());
  });

  const saveUrl = async (e) => {
    e.preventDefault();
    await db.put('patterns', {
      title: form.title.trim(), url: form.url.trim(), source: 'url',
      tags: parseTags(form.tags), folderId: form.folderId === NONE ? null : form.folderId,
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
      blob: file, mime: file.type, fileName: file.name,
      tags: parseTags(form.tags), folderId: form.folderId === NONE ? null : form.folderId,
    });
    announce('Pattern saved to your library');
    setFileOpen(false);
    reload();
  };

  const openImport = (withCapture) => {
    setCapture(withCapture);
    setForm({ url: '', title: '', tags: '', folderId: openFolder && openFolder !== UNFILED ? openFolder : NONE });
    setFileOpen(true);
  };

  const openPattern = (p) => {
    if (p.url) window.open(p.url, '_blank', 'noopener');
    else if (p.blob) window.open(URL.createObjectURL(p.blob), '_blank');
  };

  const saveFolder = async (e) => {
    e.preventDefault();
    const name = folderDraft.name.trim();
    if (!name) return;
    if (folderDraft.id) {
      const existing = folders.find(f => f.id === folderDraft.id);
      await db.put('folders', { ...existing, name });
      announce(`Folder renamed to ${name}`);
    } else {
      await db.put('folders', { name });
      announce(`Folder ${name} created`);
    }
    setFolderFormOpen(false);
    reload();
  };

  const confirmDeleteFolder = async () => {
    const f = deleteFolder;
    const inside = patterns.filter(p => p.folderId === f.id);
    // Patterns outlive their folder — they fall back to Unfiled, never deleted.
    for (const p of inside) await db.put('patterns', { ...p, folderId: null });
    await db.delete('folders', f.id);
    announce(`${f.name} deleted. ${inside.length} pattern${inside.length === 1 ? '' : 's'} moved to Unfiled.`);
    setDeleteFolder(null);
    if (openFolder === f.id) setOpenFolder(null);
    reload();
  };

  const currentFolder = openFolder && openFolder !== UNFILED
    ? folders.find(f => f.id === openFolder) : null;
  const heading = openFolder === UNFILED ? 'Unfiled' : currentFolder ? currentFolder.name : 'Patterns';

  return (
    <section aria-labelledby="patterns-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {openFolder && (
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => setOpenFolder(null)}>
              <ArrowLeft aria-hidden="true" /> All folders
            </Button>
          )}
          <h2 id="patterns-heading">{heading}</h2>
        </div>
        <Button onClick={() => { setForm({ url: '', title: '', tags: '', folderId: openFolder && openFolder !== UNFILED ? openFolder : NONE }); setUrlOpen(true); }}>
          <Plus aria-hidden="true" /> Add
        </Button>
      </div>

      <div role="group" aria-label="Import a pattern" className="mb-3 flex flex-wrap gap-2">
        <Button variant="outline" className="flex-1" onClick={() => { setForm({ url: '', title: '', tags: '', folderId: openFolder && openFolder !== UNFILED ? openFolder : NONE }); setUrlOpen(true); }}>
          <LinkIcon aria-hidden="true" /> From web
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => openImport(false)}>
          <FileText aria-hidden="true" /> Upload
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => openImport(true)}>
          <Camera aria-hidden="true" /> Photo
        </Button>
      </div>

      {/* Folder grid — only at the top level. */}
      {!openFolder && (
        <>
          <h3 className="mt-4 mb-2">Folders</h3>
          <ul aria-label="Pattern folders" className="grid list-none grid-cols-2 gap-3 p-0">
            {folders.map(f => (
              <li key={f.id} className="relative">
                <Card className="h-full py-0">
                  <button
                    type="button"
                    onClick={() => setOpenFolder(f.id)}
                    className="h-full w-full rounded-xl text-left"
                  >
                    <CardContent className="grid gap-1 px-3 py-3 pr-10">
                      <FolderOpen className="size-5 text-link" aria-hidden="true" />
                      <span className="font-semibold leading-tight">{f.name}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {countIn(f.id)} pattern{countIn(f.id) === 1 ? '' : 's'}
                      </span>
                    </CardContent>
                  </button>
                </Card>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Manage folder ${f.name}`}
                  onClick={() => setManageFolder(f)}
                  className="absolute top-1 right-1"
                >
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              </li>
            ))}

            {countIn(UNFILED) > 0 && (
              <li>
                <Card className="h-full py-0">
                  <button type="button" onClick={() => setOpenFolder(UNFILED)} className="h-full w-full rounded-xl text-left">
                    <CardContent className="grid gap-1 px-3 py-3">
                      <Folder className="size-5 text-muted-foreground" aria-hidden="true" />
                      <span className="font-semibold leading-tight">Unfiled</span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {countIn(UNFILED)} pattern{countIn(UNFILED) === 1 ? '' : 's'}
                      </span>
                    </CardContent>
                  </button>
                </Card>
              </li>
            )}

            <li>
              {/* Structured like the folder cards rather than as a Button, so the
                  iOS skin's pill radius doesn't reshape it out of the grid. */}
              <Card className="h-full border-dashed py-0">
                <button
                  type="button"
                  onClick={() => { setFolderDraft({ id: null, name: '' }); setFolderFormOpen(true); }}
                  className="h-full min-h-24 w-full rounded-xl text-left"
                >
                  <CardContent className="flex h-full items-center justify-center gap-2 px-3 py-3 font-semibold text-link">
                    <FolderPlus className="size-5" aria-hidden="true" /> New folder
                  </CardContent>
                </button>
              </Card>
            </li>
          </ul>
        </>
      )}

      <div className="relative mt-4">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Label htmlFor="pattern-filter" className="sr-only">Search patterns by title or tag</Label>
        <Input
          id="pattern-filter"
          type="search"
          placeholder={openFolder ? `Search in ${heading}` : 'Search all patterns'}
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      <h3 className="mt-4 mb-2 flex items-center justify-between gap-2">
        <span>{openFolder ? 'In this folder' : 'All patterns'}</span>
        <span className="text-sm font-normal tabular-nums text-muted-foreground">{visible.length}</span>
      </h3>

      {visible.length === 0 ? (
        <p className="py-8 text-center italic text-muted-foreground">
          {patterns.length === 0
            ? 'No patterns yet. Save a link, upload a PDF, or snap a photo.'
            : 'Nothing matches that search.'}
        </p>
      ) : (
        <ul aria-label="Your patterns" className="grid list-none gap-3 p-0">
          {visible.map(p => {
            const folder = folders.find(f => f.id === p.folderId);
            return (
              <li key={p.id}>
                <Card className="py-0">
                  <CardContent className="flex items-center gap-2 px-3 py-3">
                    <button
                      type="button"
                      onClick={() => openPattern(p)}
                      className="min-w-0 flex-1 rounded-lg text-left"
                      aria-label={`Open ${p.title}, ${SOURCE_LABEL[p.source]}`}
                    >
                      <span className="flex items-start gap-2 font-semibold">
                        <span className="mt-0.5 shrink-0">{SOURCE_ICON[p.source]}</span>
                        <span className="min-w-0">{p.title}</span>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Folder className="size-3.5 shrink-0" aria-hidden="true" />
                          {folder ? folder.name : 'Unfiled'}
                        </span>
                        {(p.tags || []).map(t => <Badge key={t}>{t}</Badge>)}
                      </span>
                    </button>
                    <Button variant="ghost" size="icon" aria-label={`Move ${p.title} to a folder`} onClick={() => setMovePattern(p)}>
                      <FolderInput aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete pattern ${p.title}`}
                      onClick={async () => {
                        if (!confirm(`Delete pattern “${p.title}”?`)) return;
                        await db.delete('patterns', p.id);
                        announce('Pattern deleted');
                        reload();
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* ---------- Import from the web ---------- */}
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
            <FolderField value={form.folderId} folders={folders}
              onChange={v => setForm(f => ({ ...f, folderId: v }))} id="pu-folder" />
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

      {/* ---------- Upload / photograph ---------- */}
      <Dialog open={fileOpen} onOpenChange={setFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{capture ? 'Photograph pattern' : 'Import pattern'}</DialogTitle>
            <DialogDescription>
              {capture
                ? 'Snap a picture of a printed pattern.'
                : 'PDFs, images and text files are stored in the app and work offline.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveFile} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="pfile-input">{capture ? 'Take a photo of the pattern' : 'Choose file'}</Label>
              <Input
                id="pfile-input" ref={fileRef} type="file" required
                accept={capture ? 'image/*' : '.pdf,image/*,.txt'}
                capture={capture ? 'environment' : undefined}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setForm(f => (f.title ? f : { ...f, title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') }));
                  }
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pfile-title">Title (required)</Label>
              <Input id="pfile-title" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <FolderField value={form.folderId} folders={folders}
              onChange={v => setForm(f => ({ ...f, folderId: v }))} id="pfile-folder" />
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

      {/* ---------- New / rename folder ---------- */}
      <Dialog open={folderFormOpen} onOpenChange={setFolderFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{folderDraft.id ? 'Rename folder' : 'New folder'}</DialogTitle>
            <DialogDescription>Folders group patterns; a pattern lives in one at a time.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveFolder} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input id="folder-name" required maxLength={40} placeholder="e.g. Winter gifts"
                value={folderDraft.name}
                onChange={e => setFolderDraft(d => ({ ...d, name: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFolderFormOpen(false)}>Cancel</Button>
              <Button type="submit">{folderDraft.id ? 'Save' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------- Folder actions ---------- */}
      <Dialog open={!!manageFolder} onOpenChange={o => !o && setManageFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{manageFolder?.name}</DialogTitle>
            <DialogDescription>
              {manageFolder ? `${countIn(manageFolder.id)} pattern${countIn(manageFolder.id) === 1 ? '' : 's'} inside.` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => { setFolderDraft({ id: manageFolder.id, name: manageFolder.name }); setManageFolder(null); setFolderFormOpen(true); }}
            >
              <Pencil aria-hidden="true" /> Rename folder
            </Button>
            <Button
              variant="destructive"
              className="justify-start"
              onClick={() => { setDeleteFolder(manageFolder); setManageFolder(null); }}
            >
              <Trash2 aria-hidden="true" /> Delete folder
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageFolder(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Delete confirmation ---------- */}
      <Dialog open={!!deleteFolder} onOpenChange={o => !o && setDeleteFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{deleteFolder?.name}”?</DialogTitle>
            <DialogDescription>
              {deleteFolder && countIn(deleteFolder.id) > 0
                ? `Its ${countIn(deleteFolder.id)} pattern${countIn(deleteFolder.id) === 1 ? '' : 's'} move to Unfiled — nothing is deleted.`
                : 'The folder is empty.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFolder(null)}>Keep folder</Button>
            <Button variant="destructive" onClick={confirmDeleteFolder}>Delete folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Move a pattern ---------- */}
      <Dialog open={!!movePattern} onOpenChange={o => !o && setMovePattern(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move “{movePattern?.title}”</DialogTitle>
            <DialogDescription>Choose the folder it belongs in.</DialogDescription>
          </DialogHeader>
          <ul className="grid list-none gap-2 p-0">
            {[{ id: null, name: 'Unfiled' }, ...folders].map(f => (
              <li key={f.id || 'unfiled'}>
                <Button
                  variant={(movePattern?.folderId || null) === f.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  aria-current={(movePattern?.folderId || null) === f.id ? 'true' : undefined}
                  onClick={async () => {
                    await db.put('patterns', { ...movePattern, folderId: f.id });
                    announce(`${movePattern.title} moved to ${f.name}`);
                    setMovePattern(null);
                    reload();
                  }}
                >
                  <Folder aria-hidden="true" /> {f.name}
                </Button>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovePattern(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FolderField({ id, value, folders, onChange }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>Folder</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Unfiled</SelectItem>
          {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
