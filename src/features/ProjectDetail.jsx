import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { buildShareText } from '@/lib/ravelry.js';
import { expectedStitches } from '@/lib/counters.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, TagList } from '@/components/badges.jsx';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Minus, Trash, ShareNetwork, Copy, PencilSimple, ArrowSquareOut, Camera, ArrowUUpLeft } from '@/lib/icons.jsx';
import ProjectDialog from './ProjectDialog.jsx';
import { STATUS_LABELS, setActiveId } from './ProjectsView.jsx';

// Shrinks a checkpoint photo before it goes anywhere near IndexedDB — these
// are reference snapshots, not the pattern archive, so a phone-camera photo
// gets downscaled to a data URL rather than stored at full resolution.
function resizeImage(file, maxDim = 640, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function Counter({ counter, onChange, onRemove, onEdit, onCheckpoint }) {
  const bump = (delta) => {
    const value = Math.max(0, counter.value + delta);
    onChange({ ...counter, value });
    const expected = expectedStitches({ ...counter, value });
    announce(`${counter.name}: ${value}${expected !== null ? `, about ${expected} stitches this row` : ''}`);
    if (counter.target && value === counter.target) {
      announce(`${counter.name} target reached — ${value} of ${counter.target}. Lovely work!`);
    }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const expected = expectedStitches(counter);
  const subtitle = [
    counter.target ? `of ${counter.target}` : null,
    expected !== null ? `≈ ${expected} sts this row` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="rounded-xl border bg-secondary p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold">{counter.name}</span>
        <div className="flex items-center gap-1">
          <Button variant="link" size="sm" onClick={onEdit}>edit</Button>
          <Button variant="link" size="sm" onClick={onRemove}>remove</Button>
        </div>
      </div>
      <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Button variant="outline" className="min-h-16 text-2xl" aria-label={`Decrease ${counter.name}`} onClick={() => bump(-1)}>
          <Minus className="size-7" />
        </Button>
        <output className="min-w-[3ch] text-center text-4xl font-bold tabular-nums" aria-live="off">
          {counter.value}
        </output>
        <Button className="min-h-16 text-2xl" aria-label={`Increase ${counter.name}`} onClick={() => bump(1)}>
          <Plus className="size-7" />
        </Button>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{subtitle}</span>
        <Button variant="link" size="sm" onClick={() => {
          if (confirm(`Reset ${counter.name} to 0?`)) {
            onChange({ ...counter, value: 0 });
            announce(`${counter.name} reset to 0`);
          }
        }}>reset to 0</Button>
      </div>
      <Button variant="outline" size="sm" className="mt-2 min-h-11 w-full" onClick={onCheckpoint}>
        <Camera aria-hidden="true" /> Save checkpoint
      </Button>
    </div>
  );
}

export default function ProjectDetail({ id, navigate }) {
  const [project, setProject] = useState(null);
  const [pattern, setPattern] = useState(null);
  const [yarns, setYarns] = useState([]);
  const [stash, setStash] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [counterFormOpen, setCounterFormOpen] = useState(false);
  const [counterDraft, setCounterDraft] = useState({ id: null, name: '', target: '', stitchBase: '', stitchIncrement: '' });
  const [checkpointFor, setCheckpointFor] = useState(null);
  const [checkpointNote, setCheckpointNote] = useState('');
  const checkpointFileRef = useRef(null);
  const [linkYarnOpen, setLinkYarnOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareText, setShareText] = useState('');

  useEffect(() => {
    db.get('projects', id).then(p => {
      if (!p) return navigate('projects');
      p.counters = p.counters || [];
      p.yarnIds = p.yarnIds || [];
      p.tags = p.tags || [];
      p.checkpoints = p.checkpoints || [];
      // Opening a live project is the clearest signal of what you're making,
      // so the hero counter on the Projects screen follows it.
      if (p.status === 'in-progress') setActiveId(p.id);
      setProject(p);
    });
  }, [id, navigate]);

  useEffect(() => {
    if (!project) return;
    if (project.patternId) db.get('patterns', project.patternId).then(setPattern);
    else setPattern(null);
    Promise.all(project.yarnIds.map(yid => db.get('yarn', yid)))
      .then(list => setYarns(list.filter(Boolean)));
  }, [project]);

  const save = useCallback(async (updated) => {
    setProject(updated);
    await db.put('projects', updated);
  }, []);

  const saveCheckpoint = async (e) => {
    e.preventDefault();
    const counter = checkpointFor;
    const file = checkpointFileRef.current?.files[0];
    const photo = file ? await resizeImage(file) : null;
    const entry = {
      id: crypto.randomUUID(),
      counterId: counter.id,
      counterName: counter.name,
      value: counter.value,
      photo,
      note: checkpointNote.trim(),
      createdAt: Date.now(),
    };
    await save({ ...project, checkpoints: [entry, ...(project.checkpoints || [])] });
    announce(`Checkpoint saved at ${counter.name} ${counter.value}`);
    setCheckpointFor(null);
  };

  const restoreCheckpoint = (cp) => {
    if (!confirm(`Set ${cp.counterName} back to ${cp.value}? This won't undo anything else you've changed.`)) return;
    save({
      ...project,
      counters: project.counters.map(c => (c.id === cp.counterId ? { ...c, value: cp.value } : c)),
    });
    announce(`${cp.counterName} restored to ${cp.value}`);
  };

  const deleteCheckpoint = (cp) => {
    save({ ...project, checkpoints: project.checkpoints.filter(x => x.id !== cp.id) });
    announce('Checkpoint deleted');
  };

  if (!project) return null;

  const yarnLabel = (y) => `${y.brand ? y.brand + ' ' : ''}${y.name}${y.colorway ? ' — ' + y.colorway : ''}`;

  return (
    <section aria-labelledby="project-heading">
      <Button variant="outline" className="mb-2" onClick={() => navigate('projects')}>
        <ArrowLeft aria-hidden="true" /> All projects
      </Button>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="project-heading">{project.name}</h2>
        <StatusBadge>{STATUS_LABELS[project.status]}</StatusBadge>
      </div>
      <TagList tags={project.tags} className="mb-3" />

      <div className="grid gap-3">
        <Card>
          <CardHeader><CardTitle>Counters</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {project.counters.map(counter => (
              <Counter
                key={counter.id}
                counter={counter}
                onChange={(c) => save({ ...project, counters: project.counters.map(x => x.id === c.id ? c : x) })}
                onRemove={() => {
                  if (!confirm(`Remove the ${counter.name} counter?`)) return;
                  save({ ...project, counters: project.counters.filter(x => x.id !== counter.id) });
                  announce(`${counter.name} counter removed`);
                }}
                onEdit={() => {
                  setCounterDraft({
                    id: counter.id, name: counter.name, target: counter.target ?? '',
                    stitchBase: counter.stitchBase ?? '', stitchIncrement: counter.stitchIncrement ?? '',
                  });
                  setCounterFormOpen(true);
                }}
                onCheckpoint={() => { setCheckpointNote(''); setCheckpointFor(counter); }}
              />
            ))}
            <Button variant="outline" onClick={() => {
              setCounterDraft({ id: null, name: '', target: '', stitchBase: '', stitchIncrement: '' });
              setCounterFormOpen(true);
            }}>
              <Plus aria-hidden="true" /> Add counter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Checkpoints</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {(project.checkpoints || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No checkpoints yet. Save one before a tricky section — a photo and a note pinned to a counter's
                current value — so if you need to frog back, you know exactly where to stop.
              </p>
            ) : (
              <ul className="grid list-none gap-2 p-0">
                {project.checkpoints.map(cp => {
                  const counter = project.counters.find(c => c.id === cp.counterId);
                  return (
                    <li key={cp.id} className="flex items-start gap-3 rounded-xl border p-2">
                      {cp.photo ? (
                        <img
                          src={cp.photo}
                          alt={`Checkpoint photo — ${cp.counterName} ${cp.value}`}
                          className="size-14 shrink-0 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground" aria-hidden="true">
                          <Camera className="size-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{cp.counterName}: {cp.value}</p>
                        {cp.note && <p className="text-sm text-muted-foreground">{cp.note}</p>}
                        <p className="text-xs text-muted-foreground">{new Date(cp.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="grid shrink-0 gap-1">
                        {counter && (
                          <Button variant="outline" size="sm" className="min-h-11" onClick={() => restoreCheckpoint(cp)}>
                            <ArrowUUpLeft aria-hidden="true" /> Restore
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-11"
                          aria-label={`Delete checkpoint: ${cp.counterName} ${cp.value}`}
                          onClick={() => deleteCheckpoint(cp)}
                        >
                          <Trash aria-hidden="true" /> Delete
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pattern</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {project.hook && <p>Hook: {project.hook}</p>}
            {pattern ? (
              pattern.url ? (
                <a className="inline-flex items-center gap-1 text-link underline" href={pattern.url} target="_blank" rel="noopener noreferrer">
                  {pattern.title} <ArrowSquareOut className="size-4" aria-hidden="true" />
                </a>
              ) : (
                <Button variant="outline" onClick={() => navigate('pattern-viewer', pattern.id)}>
                  Open “{pattern.title}”
                </Button>
              )
            ) : (
              <p className="text-muted-foreground">No pattern linked yet — use “Edit details” to pick one from your library.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Yarn used</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {yarns.length === 0 && <p className="text-sm text-muted-foreground">No yarn linked yet.</p>}
            <ul className="grid list-none gap-1 p-0 text-sm">
              {yarns.map(y => <li key={y.id}>{yarnLabel(y)}</li>)}
            </ul>
            <Button variant="outline" onClick={async () => { setStash(await db.getAll('yarn')); setLinkYarnOpen(true); }}>
              <Plus aria-hidden="true" /> Link yarn from stash
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Label htmlFor="project-notes" className="sr-only">Project notes</Label>
            <Textarea
              id="project-notes"
              placeholder="Hook size, tension, modifications…"
              defaultValue={project.notes}
              onBlur={(e) => {
                if (e.target.value !== project.notes) {
                  save({ ...project, notes: e.target.value });
                  announce('Notes saved');
                }
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <PencilSimple aria-hidden="true" /> Edit details
            </Button>
            <Button variant="outline" onClick={async () => {
              setShareText(await buildShareText(project));
              setShareOpen(true);
            }}>
              <ShareNetwork aria-hidden="true" /> Share to Ravelry
            </Button>
            <Button variant="destructive" onClick={async () => {
              if (!confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
              await db.delete('projects', project.id);
              announce('Project deleted');
              navigate('projects');
            }}>
              <Trash aria-hidden="true" /> Delete project
            </Button>
          </CardContent>
        </Card>
      </div>

      <ProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project}
        onSave={(fields) => { save({ ...project, ...fields }); announce('Project saved'); }} />

      <Dialog open={counterFormOpen} onOpenChange={setCounterFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{counterDraft.id ? 'Edit counter' : 'Add counter'}</DialogTitle>
            <DialogDescription>Count anything — rows, repeats, colour changes.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!counterDraft.name.trim()) return;
              const fields = {
                name: counterDraft.name.trim(),
                target: counterDraft.target ? Number(counterDraft.target) : null,
                stitchBase: counterDraft.stitchBase !== '' ? Number(counterDraft.stitchBase) : null,
                stitchIncrement: counterDraft.stitchIncrement !== '' ? Number(counterDraft.stitchIncrement) : 0,
              };
              if (counterDraft.id) {
                save({
                  ...project,
                  counters: project.counters.map(c => (c.id === counterDraft.id ? { ...c, ...fields } : c)),
                });
                announce(fields.name + ' counter updated');
              } else {
                save({ ...project, counters: [...project.counters, { id: crypto.randomUUID(), value: 0, ...fields }] });
                announce(fields.name + ' counter added');
              }
              setCounterFormOpen(false);
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="cf-name">What are you counting?</Label>
              <Input id="cf-name" required placeholder="e.g. Pattern repeats" value={counterDraft.name}
                onChange={e => setCounterDraft(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cf-target">Target (optional)</Label>
              <Input id="cf-target" type="number" min="0" inputMode="numeric" value={counterDraft.target}
                onChange={e => setCounterDraft(v => ({ ...v, target: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="cf-stitch-base">Starting stitch count</Label>
                <Input id="cf-stitch-base" type="number" min="0" inputMode="numeric" value={counterDraft.stitchBase}
                  onChange={e => setCounterDraft(v => ({ ...v, stitchBase: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cf-stitch-inc">Change per row</Label>
                <Input id="cf-stitch-inc" type="number" inputMode="numeric" placeholder="e.g. 6 or -6" value={counterDraft.stitchIncrement}
                  onChange={e => setCounterDraft(v => ({ ...v, stitchIncrement: e.target.value }))} />
              </div>
            </div>
            <p className="-mt-2 text-sm text-muted-foreground">
              Optional — set a starting count to see the expected stitch count for the row you're on. Leave the
              change per row at 0 for a flat count, or use it for a shaping section (6 for an increase round,
              −6 for a decrease round).
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCounterFormOpen(false)}>Cancel</Button>
              <Button type="submit">{counterDraft.id ? 'Save' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!checkpointFor} onOpenChange={o => { if (!o) setCheckpointFor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save checkpoint</DialogTitle>
            <DialogDescription>
              {checkpointFor && `A snapshot at ${checkpointFor.name} ${checkpointFor.value}, so you know exactly where to frog back to if this section goes wrong.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveCheckpoint} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cp-photo">Photo (optional)</Label>
              <Input id="cp-photo" ref={checkpointFileRef} type="file" accept="image/*" capture="environment" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cp-note">Note (optional)</Label>
              <Input id="cp-note" placeholder="e.g. Before the sleeve increases" value={checkpointNote}
                onChange={e => setCheckpointNote(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCheckpointFor(null)}>Cancel</Button>
              <Button type="submit">Save checkpoint</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={linkYarnOpen} onOpenChange={setLinkYarnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link yarn from stash</DialogTitle>
            <DialogDescription>Tick the yarns this project uses.</DialogDescription>
          </DialogHeader>
          {stash.length === 0 && (
            <p className="text-sm text-muted-foreground">Your stash is empty — add yarn on the Yarn tab first.</p>
          )}
          <ul className="grid list-none gap-1 p-0">
            {stash.map(y => (
              <li key={y.id}>
                <label className="flex min-h-11 items-center gap-3">
                  <Checkbox
                    checked={project.yarnIds.includes(y.id)}
                    onCheckedChange={(checked) => {
                      const yarnIds = checked
                        ? [...project.yarnIds, y.id]
                        : project.yarnIds.filter(i => i !== y.id);
                      save({ ...project, yarnIds });
                    }}
                  />
                  {yarnLabel(y)}
                </label>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button onClick={() => setLinkYarnOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share to Ravelry</DialogTitle>
            <DialogDescription>
              Copy this summary into a new Ravelry project, or use the share button if your phone supports it.
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="share-text" className="sr-only">Project summary</Label>
          <Textarea id="share-text" rows={8} value={shareText} onChange={e => setShareText(e.target.value)} />
          <DialogFooter className="flex-wrap">
            <Button variant="outline" onClick={async () => {
              await navigator.clipboard.writeText(shareText);
              announce('Copied to clipboard');
            }}>
              <Copy aria-hidden="true" /> Copy
            </Button>
            <Button variant="outline" onClick={async () => {
              if (navigator.share) {
                try { await navigator.share({ title: project.name, text: shareText }); } catch { /* user cancelled */ }
              } else {
                await navigator.clipboard.writeText(shareText);
                announce('Sharing not supported here — copied to clipboard instead');
              }
            }}>
              <ShareNetwork aria-hidden="true" /> Share…
            </Button>
            <Button asChild variant="outline">
              <a href="https://www.ravelry.com/projects" target="_blank" rel="noopener noreferrer">Open Ravelry</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
