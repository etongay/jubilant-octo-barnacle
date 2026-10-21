// Pattern details — a full child page of the Patterns tab, not a sheet.
//
// Reading is the default: every field shows as plain text, and the gear
// menu's Edit turns the same layout into a form in place, so nothing
// moves between the two modes. The back and gear buttons float over the
// page in Liquid Glass regardless of the app's surface finish — they sit
// on top of the thumbnail as you scroll, which is exactly where a
// translucent control earns its keep.

import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { allTags, addCustomTag } from '@/lib/tags.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TagList } from '@/components/badges.jsx';
import { TagChips } from '@/components/tag-chips.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import { CaretLeft, Gear, PencilSimple, Copy, ArrowSquareIn, Trash, Folder, FileText, LinkIcon, ArrowSquareOut, UploadSimple, BookOpen } from '@/lib/icons.jsx';
import { coverStyle } from './ProjectsView.jsx';

// The Craft Yarn Council's four skill levels — what most published
// patterns already print, so a value copied off a pattern fits.
const DIFFICULTY = ['Beginner', 'Easy', 'Intermediate', 'Experienced'];
const NONE = '__none__';

const sameTag = (a, b) => a.toLowerCase() === b.toLowerCase();
const hasTag = (list, t) => list.some(x => sameTag(x, t));

function draftFrom(p) {
  return {
    title: p.title || '',
    tags: p.tags || [],
    designer: p.designer || '',
    difficulty: p.difficulty || NONE,
    url: p.url || '',
    notes: p.notes || '',
    file: null, // a newly chosen File, until saved
  };
}

function sourceFor(p) {
  if (p.blob) return p.mime?.startsWith('image/') ? 'photo' : 'file';
  return 'url';
}

/** Page 1 of a PDF, the photo itself, or a generated cover when there's nothing to show. */
function PatternThumbnail({ pattern }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    setSrc(null);
    const blob = pattern.blob;
    if (!blob) return;
    if (pattern.mime?.startsWith('image/')) {
      const url = URL.createObjectURL(blob);
      setSrc(url);
      return () => URL.revokeObjectURL(url);
    }
    if (pattern.mime === 'application/pdf') {
      let cancelled = false;
      import('@/lib/pdf-thumb.js')
        .then(m => m.pdfThumbnail(blob))
        .then(url => { if (!cancelled) setSrc(url); })
        .catch(() => { /* unreadable PDF — keep the generated cover */ });
      return () => { cancelled = true; };
    }
  }, [pattern.blob, pattern.mime]);

  if (src) {
    return (
      <img
        src={src}
        alt={`First page of ${pattern.title}`}
        className="aspect-[4/3] w-full rounded-xl border bg-card object-cover object-top"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="grid aspect-[4/3] w-full place-items-center rounded-xl"
      style={coverStyle(pattern)}
    >
      <BookOpen className="size-12 text-white/85" />
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="grid gap-1.5">
      {htmlFor
        ? <Label htmlFor={htmlFor}>{label}</Label>
        : <span className="text-sm font-semibold">{label}</span>}
      {children}
    </div>
  );
}

function Empty({ children = 'Not set' }) {
  return <p className="text-muted-foreground italic">{children}</p>;
}

export default function PatternDetail({ id, navigate }) {
  const [pattern, setPattern] = useState(null);
  const [folders, setFolders] = useState([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    db.get('patterns', id).then(p => {
      if (!p) return navigate('patterns');
      setPattern(p);
      setDraft(draftFrom(p));
      setEditing(false);
    });
    db.getAll('folders').then(list => setFolders(list.sort((a, b) => a.name.localeCompare(b.name))));
  }, [id, navigate]);

  // Stock tags plus any this pattern already carries (older patterns were
  // tagged free-form and lowercased), de-duplicated case-insensitively.
  const tagOptions = useMemo(() => {
    const list = allTags();
    for (const t of draft?.tags || []) if (!hasTag(list, t)) list.push(t);
    return list;
  }, [draft?.tags]);

  if (!pattern || !draft) return null;

  const folder = folders.find(f => f.id === pattern.folderId);
  const set = (k) => (e) => setDraft(d => ({ ...d, [k]: e.target.value }));

  const startEdit = () => {
    setDraft(draftFrom(pattern));
    setEditing(true);
    announce('Editing pattern');
    // Wait for the menu to close and the form to mount before moving focus.
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setDraft(draftFrom(pattern));
    setEditing(false);
    setAddingTag(false);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    const next = {
      ...pattern,
      title,
      tags: draft.tags,
      designer: draft.designer.trim(),
      difficulty: draft.difficulty === NONE ? null : draft.difficulty,
      url: draft.url.trim(),
      notes: draft.notes,
    };
    if (draft.file) {
      next.blob = draft.file;
      next.mime = draft.file.type;
      next.fileName = draft.file.name;
      // A new file means the old place-marker points at a different document.
      delete next.markPage; delete next.markX; delete next.markY; delete next.currentPage;
    }
    next.source = sourceFor(next);
    const saved = await db.put('patterns', next);
    setPattern(saved);
    setDraft(draftFrom(saved));
    setEditing(false);
    setAddingTag(false);
    announce('Pattern saved');
  };

  const toggleTag = (t) => setDraft(d => ({
    ...d,
    tags: hasTag(d.tags, t) ? d.tags.filter(x => !sameTag(x, t)) : [...d.tags, t],
  }));

  const commitNewTag = () => {
    const name = tagDraft.trim();
    if (name) {
      const added = addCustomTag(name) || allTags().find(t => sameTag(t, name)) || name;
      if (!hasTag(draft.tags, added)) setDraft(d => ({ ...d, tags: [...d.tags, added] }));
      announce(`Tag ${added} added`);
    }
    setTagDraft('');
    setAddingTag(false);
  };

  const duplicate = async () => {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = pattern;
    const copy = await db.put('patterns', { ...rest, title: `${pattern.title} (copy)` });
    announce(`Duplicated as ${copy.title}`);
    navigate('pattern-detail', copy.id);
  };

  const moveTo = async (f) => {
    const saved = await db.put('patterns', { ...pattern, folderId: f.id });
    setPattern(saved);
    setMoveOpen(false);
    announce(`Moved to ${f.name}`);
  };

  const remove = async () => {
    await db.delete('patterns', pattern.id);
    announce(`${pattern.title} deleted`);
    navigate('patterns');
  };

  // In edit mode the thumbnail previews the chosen file before it's saved.
  const previewPattern = draft.file
    ? { ...pattern, blob: draft.file, mime: draft.file.type }
    : pattern;

  return (
    <section aria-labelledby="pattern-heading" className="-mt-1">
      {/* Floating nav bar — glass controls over whatever scrolls beneath. */}
      <div className="sticky top-[max(0.5rem,env(safe-area-inset-top,0px))] z-30 mb-2 flex items-center justify-between">
        <button
          type="button"
          className="glass-control"
          aria-label={editing ? 'Cancel editing' : 'Back to patterns'}
          onClick={() => (editing ? cancelEdit() : navigate('patterns'))}
        >
          <CaretLeft className="size-6" aria-hidden="true" />
        </button>

        {editing ? (
          <button type="submit" form="pattern-form" className="glass-control glass-control-wide font-semibold">
            Done
          </button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="glass-control" aria-label="Pattern options">
                <Gear className="size-5.5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={startEdit}>Edit <PencilSimple aria-hidden="true" /></DropdownMenuItem>
              <DropdownMenuItem onSelect={duplicate}>Duplicate <Copy aria-hidden="true" /></DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setMoveOpen(true)}>
                Move to folder <ArrowSquareIn aria-hidden="true" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                Delete <Trash aria-hidden="true" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <h2 id="pattern-heading" className="mb-1">{editing ? draft.title || 'Untitled pattern' : pattern.title}</h2>
      <p className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
        <Folder className="size-3.5" aria-hidden="true" /> {folder ? folder.name : 'Unfiled'}
      </p>

      <PatternThumbnail pattern={previewPattern} />

      <form id="pattern-form" onSubmit={saveEdit} className="mt-4">
        <Card>
          <CardContent className="grid gap-5">
            <Field label="Pattern name" htmlFor={editing ? 'pd-title' : undefined}>
              {editing
                ? <Input id="pd-title" ref={titleRef} required value={draft.title} onChange={set('title')} />
                : <p>{pattern.title}</p>}
            </Field>

            <Field label="Type">
              {editing ? (
                <>
                  <TagChips
                    label="Pattern type tags"
                    tags={tagOptions}
                    selected={tagOptions.filter(t => hasTag(draft.tags, t))}
                    onToggle={toggleTag}
                    onNew={() => setAddingTag(v => !v)}
                  />
                  {addingTag && (
                    <div className="flex gap-2">
                      <Label htmlFor="pd-newtag" className="sr-only">New tag name</Label>
                      <Input
                        id="pd-newtag"
                        autoFocus
                        maxLength={24}
                        placeholder="e.g. Granny square"
                        value={tagDraft}
                        onChange={e => setTagDraft(e.target.value)}
                        onKeyDown={e => {
                          if (e.key !== 'Enter') return;
                          // Enter adds the tag; it must not submit the whole form.
                          e.preventDefault();
                          commitNewTag();
                        }}
                      />
                      <Button type="button" variant="outline" onClick={commitNewTag}>Add</Button>
                    </div>
                  )}
                </>
              ) : pattern.tags?.length ? (
                <TagList tags={pattern.tags} label="Pattern type" />
              ) : <Empty />}
            </Field>

            <Field label="Designer" htmlFor={editing ? 'pd-designer' : undefined}>
              {editing
                ? <Input id="pd-designer" placeholder="Who wrote it?" value={draft.designer} onChange={set('designer')} />
                : pattern.designer ? <p>{pattern.designer}</p> : <Empty />}
            </Field>

            <Field label="Difficulty level" htmlFor={editing ? 'pd-difficulty' : undefined}>
              {editing ? (
                <Select value={draft.difficulty} onValueChange={v => setDraft(d => ({ ...d, difficulty: v }))}>
                  <SelectTrigger id="pd-difficulty"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not set</SelectItem>
                    {DIFFICULTY.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : pattern.difficulty ? <p>{pattern.difficulty}</p> : <Empty />}
            </Field>

            <Field label="Pattern file" htmlFor={editing ? 'pd-file' : undefined}>
              {editing ? (
                <>
                  <label
                    htmlFor="pd-file"
                    className="flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border-2 border-dashed px-3 py-2 focus-within:outline-3 focus-within:outline-[var(--color-ring)]"
                  >
                    <UploadSimple className="size-5 shrink-0 text-link" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {draft.file?.name || pattern.fileName || 'Choose a PDF, image or text file'}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {draft.file || pattern.fileName ? 'Tap to replace' : 'Stored on this device, works offline'}
                      </span>
                    </span>
                  </label>
                  <input
                    id="pd-file"
                    ref={fileRef}
                    type="file"
                    accept=".pdf,image/*,.txt"
                    className="sr-only"
                    onChange={e => setDraft(d => ({ ...d, file: e.target.files[0] || null }))}
                  />
                </>
              ) : pattern.blob ? (
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start"
                  onClick={() => navigate('pattern-viewer', pattern.id)}
                >
                  <FileText aria-hidden="true" />
                  <span className="truncate">{pattern.fileName || 'Open pattern file'}</span>
                </Button>
              ) : <Empty>No file uploaded</Empty>}
            </Field>

            <Field label="Pattern link" htmlFor={editing ? 'pd-url' : undefined}>
              {editing ? (
                <Input id="pd-url" type="url" inputMode="url" placeholder="https://…" value={draft.url} onChange={set('url')} />
              ) : pattern.url ? (
                <a
                  href={pattern.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 break-all text-link underline"
                >
                  <LinkIcon className="size-4 shrink-0" aria-hidden="true" />
                  {pattern.url.replace(/^https?:\/\/(www\.)?/, '')}
                  <ArrowSquareOut className="size-4 shrink-0" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : <Empty>No link</Empty>}
            </Field>

            <Field label="Notes" htmlFor={editing ? 'pd-notes' : undefined}>
              {editing ? (
                <Textarea id="pd-notes" rows={5} placeholder="Hook size, yarn swaps, errata…" value={draft.notes} onChange={set('notes')} />
              ) : pattern.notes ? (
                <p className="whitespace-pre-wrap">{pattern.notes}</p>
              ) : <Empty>No notes yet</Empty>}
            </Field>
          </CardContent>
        </Card>

        {editing && (
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
            <Button type="submit">Save changes</Button>
          </div>
        )}
      </form>

      {/* ---------- Move to folder ---------- */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move “{pattern.title}”</DialogTitle>
            <DialogDescription>Choose the folder it belongs in.</DialogDescription>
          </DialogHeader>
          <ul className="grid list-none gap-2 p-0">
            {[{ id: null, name: 'Unfiled' }, ...folders].map(f => {
              const current = (pattern.folderId || null) === f.id;
              return (
                <li key={f.id || 'unfiled'}>
                  <Button
                    variant={current ? 'default' : 'outline'}
                    className="w-full justify-start"
                    aria-current={current ? 'true' : undefined}
                    onClick={() => moveTo(f)}
                  >
                    <Folder aria-hidden="true" /> {f.name}
                  </Button>
                </li>
              );
            })}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- Delete speedbump ---------- */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{pattern.title}”?</DialogTitle>
            <DialogDescription>
              {pattern.blob
                ? 'The pattern and its stored file will be removed from this device. This can’t be undone.'
                : 'The pattern will be removed from your library. This can’t be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Keep pattern</Button>
            <Button variant="destructive" onClick={remove}>Delete pattern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
