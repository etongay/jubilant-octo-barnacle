import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { buildShareText } from '@/lib/ravelry.js';
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
import { ArrowLeft, Plus, Minus, Trash2, Share2, Copy, Pencil, ExternalLink } from '@/lib/icons.jsx';
import ProjectDialog from './ProjectDialog.jsx';
import { STATUS_LABELS, setActiveId } from './ProjectsView.jsx';

function Counter({ counter, onChange, onRemove }) {
  const bump = (delta) => {
    const value = Math.max(0, counter.value + delta);
    onChange({ ...counter, value });
    announce(`${counter.name}: ${value}`);
    if (counter.target && value === counter.target) {
      announce(`${counter.name} target reached — ${value} of ${counter.target}. Lovely work!`);
    }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="rounded-xl border bg-secondary p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-bold">{counter.name}</span>
        <Button variant="link" size="sm" onClick={onRemove}>remove</Button>
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
      <div className="mt-1 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{counter.target ? `of ${counter.target}` : ''}</span>
        <Button variant="link" size="sm" onClick={() => {
          if (confirm(`Reset ${counter.name} to 0?`)) {
            onChange({ ...counter, value: 0 });
            announce(`${counter.name} reset to 0`);
          }
        }}>reset to 0</Button>
      </div>
    </div>
  );
}

export default function ProjectDetail({ id, navigate }) {
  const [project, setProject] = useState(null);
  const [pattern, setPattern] = useState(null);
  const [yarns, setYarns] = useState([]);
  const [stash, setStash] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [linkYarnOpen, setLinkYarnOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  const [newCounter, setNewCounter] = useState({ name: '', target: '' });

  useEffect(() => {
    db.get('projects', id).then(p => {
      if (!p) return navigate('projects');
      p.counters = p.counters || [];
      p.yarnIds = p.yarnIds || [];
      p.tags = p.tags || [];
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
              />
            ))}
            <Button variant="outline" onClick={() => { setNewCounter({ name: '', target: '' }); setCounterOpen(true); }}>
              <Plus aria-hidden="true" /> Add counter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pattern</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {project.hook && <p>Hook: {project.hook}</p>}
            {pattern ? (
              pattern.url ? (
                <a className="inline-flex items-center gap-1 text-link underline" href={pattern.url} target="_blank" rel="noopener noreferrer">
                  {pattern.title} <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              ) : (
                <Button variant="outline" onClick={() => window.open(URL.createObjectURL(pattern.blob), '_blank')}>
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
              <Pencil aria-hidden="true" /> Edit details
            </Button>
            <Button variant="outline" onClick={async () => {
              setShareText(await buildShareText(project));
              setShareOpen(true);
            }}>
              <Share2 aria-hidden="true" /> Share to Ravelry
            </Button>
            <Button variant="destructive" onClick={async () => {
              if (!confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
              await db.delete('projects', project.id);
              announce('Project deleted');
              navigate('projects');
            }}>
              <Trash2 aria-hidden="true" /> Delete project
            </Button>
          </CardContent>
        </Card>
      </div>

      <ProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project}
        onSave={(fields) => { save({ ...project, ...fields }); announce('Project saved'); }} />

      <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add counter</DialogTitle>
            <DialogDescription>Count anything — rows, repeats, colour changes.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCounter.name.trim()) return;
              save({
                ...project,
                counters: [...project.counters, {
                  id: crypto.randomUUID(),
                  name: newCounter.name.trim(),
                  value: 0,
                  target: newCounter.target ? Number(newCounter.target) : null,
                }],
              });
              announce(newCounter.name + ' counter added');
              setCounterOpen(false);
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="cf-name">What are you counting?</Label>
              <Input id="cf-name" required placeholder="e.g. Pattern repeats" value={newCounter.name}
                onChange={e => setNewCounter(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cf-target">Target (optional)</Label>
              <Input id="cf-target" type="number" min="0" inputMode="numeric" value={newCounter.target}
                onChange={e => setNewCounter(v => ({ ...v, target: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCounterOpen(false)}>Cancel</Button>
              <Button type="submit">Add</Button>
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
              <Share2 aria-hidden="true" /> Share…
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
