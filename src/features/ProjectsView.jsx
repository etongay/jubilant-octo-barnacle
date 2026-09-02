// "On the hook" — Study B.
//
// The app is opened mid-row, with a hook in the other hand, so the first
// thing on screen is the project you're actually making and a row counter
// big enough to hit without looking. Browsing is demoted below it, and
// filtering moves into a sheet so the resting surface stays quiet.

import { useCallback, useEffect, useState } from 'react';
import { db, settings } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { allTags, addCustomTag } from '@/lib/tags.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { TagChips } from '@/components/tag-chips.jsx';
import { Plus, Minus, Search, Filter, Repeat } from '@/lib/icons.jsx';
import ProjectDialog from './ProjectDialog.jsx';

export const STATUS_LABELS = {
  planned: 'Planned', 'in-progress': 'In progress', finished: 'Finished',
  hibernating: 'Hibernating', frogged: 'Frogged',
};

/** The counter a project is measured by — its rows, or failing that its first. */
export function rowCounter(project) {
  const counters = project?.counters || [];
  return counters.find(c => /row/i.test(c.name)) || counters[0] || null;
}

export function getActiveId() {
  return settings.get('activeProjectId', null);
}
export function setActiveId(id) {
  settings.set('activeProjectId', id);
}

function HeroCounter({ project, onChange, onSwitch, onOpen }) {
  const counter = rowCounter(project);
  const pct = counter?.target ? Math.min(100, Math.round((counter.value / counter.target) * 100)) : null;

  const bump = (delta) => {
    if (!counter) return;
    const value = Math.max(0, counter.value + delta);
    onChange({
      ...project,
      counters: project.counters.map(c => (c.id === counter.id ? { ...c, value } : c)),
    });
    announce(`${counter.name}: ${value}`);
    if (counter.target && value === counter.target) {
      announce(`${counter.name} target reached — ${value} of ${counter.target}. Lovely work!`);
    }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <Card>
      <CardContent className="grid gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onOpen}
              className="text-left text-lg font-bold leading-tight underline-offset-4 hover:underline"
            >
              {project.name}
            </button>
            {project.hook && (
              <p className="mt-0.5 text-sm text-muted-foreground">{project.hook}</p>
            )}
          </div>
          <Badge>{STATUS_LABELS[project.status]}</Badge>
        </div>

        {counter ? (
          <>
            <div className="grid grid-cols-[4rem_1fr_4rem] items-center gap-3">
              <Button
                variant="outline"
                className="min-h-16"
                aria-label={`One ${counter.name.toLowerCase().replace(/s$/, '')} back`}
                onClick={() => bump(-1)}
              >
                <Minus className="size-7" />
              </Button>
              <div className="text-center">
                <output className="block text-4xl font-bold tabular-nums" aria-live="off">
                  {counter.value}
                </output>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {counter.target ? `of ${counter.target} ${counter.name.toLowerCase()}` : counter.name.toLowerCase()}
                </span>
              </div>
              <Button
                className="min-h-16"
                aria-label={`Count one ${counter.name.toLowerCase().replace(/s$/, '')}`}
                onClick={() => bump(1)}
              >
                <Plus className="size-7" />
              </Button>
            </div>
            {pct !== null && <Progress value={pct} aria-label={`${counter.name} progress`} />}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            This project has no counters yet — open it to add one.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="min-h-11" onClick={onOpen}>
            Open project
          </Button>
          <Button variant="outline" size="sm" className="min-h-11" onClick={onSwitch}>
            <Repeat aria-hidden="true" /> Switch
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectsView({ navigate }) {
  const [projects, setProjects] = useState([]);
  const [activeId, setActive] = useState(getActiveId());
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [tagFilter, setTagFilter] = useState([]);
  const [newOpen, setNewOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  const reload = useCallback(async () => {
    const list = (await db.getAll('projects')).sort((a, b) => b.updatedAt - a.updatedAt);
    setProjects(list);
    // An active project that was deleted elsewhere shouldn't strand the hero.
    const current = getActiveId();
    if (current && !list.some(p => p.id === current)) {
      setActiveId(null);
      setActive(null);
    }
    return list;
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const saveProject = async (updated) => {
    setProjects(list => list.map(p => (p.id === updated.id ? updated : p)));
    await db.put('projects', updated);
  };

  const onCreate = async (fields) => {
    const saved = await db.put('projects', {
      ...fields,
      counters: [
        { id: crypto.randomUUID(), name: 'Rows', value: 0, target: null },
        { id: crypto.randomUUID(), name: 'Stitches', value: 0, target: null },
      ],
      yarnIds: [],
      notes: '',
    });
    if (saved.status === 'in-progress') { setActiveId(saved.id); setActive(saved.id); }
    announce('Project saved');
    navigate('project-detail', saved.id);
  };

  const active = projects.find(p => p.id === activeId) || null;
  const filterCount = tagFilter.length + (statusFilter ? 1 : 0);

  const matches = (p) => {
    const q = query.trim().toLowerCase();
    const hay = [p.name, p.hook, p.notes, ...(p.tags || [])].filter(Boolean).join(' ').toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (tagFilter.length && !(p.tags || []).some(t => tagFilter.includes(t))) return false;
    return true;
  };

  const rest = projects.filter(p => p.id !== activeId && matches(p));
  const inProgress = projects.filter(p => p.status === 'in-progress');

  const pickActive = (id) => {
    setActiveId(id);
    setActive(id);
    setSwitchOpen(false);
    const p = projects.find(x => x.id === id);
    announce(p ? `${p.name} is now on the hook` : 'Project changed');
  };

  return (
    <section aria-labelledby="projects-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="projects-heading">{active ? 'On the hook' : 'Projects'}</h2>
        <Button onClick={() => setNewOpen(true)}>
          <Plus aria-hidden="true" /> New project
        </Button>
      </div>

      {active ? (
        <HeroCounter
          project={active}
          onChange={saveProject}
          onOpen={() => navigate('project-detail', active.id)}
          onSwitch={() => setSwitchOpen(true)}
        />
      ) : (
        <Card>
          <CardContent className="grid gap-3 text-center">
            <p className="text-muted-foreground">
              {projects.length
                ? 'Nothing on the hook yet. Pick the project you’re making and its counter lives here.'
                : 'No projects yet. Cast on your first one with “New project”.'}
            </p>
            {inProgress.length > 0 && (
              <div>
                <Button variant="outline" onClick={() => setSwitchOpen(true)}>
                  Choose a project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {projects.length > 0 && (
        <>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Label htmlFor="project-search" className="sr-only">Search projects</Label>
              <Input
                id="project-search"
                type="search"
                placeholder="Search projects"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setFilterOpen(true)}
              aria-label={filterCount ? `Filter projects, ${filterCount} active` : 'Filter projects'}
            >
              <Filter aria-hidden="true" /> Filter
              {filterCount > 0 && (
                <Badge variant="default" className="ml-1 tabular-nums">{filterCount}</Badge>
              )}
            </Button>
          </div>

          <h3 className="mt-4 mb-2 flex items-center justify-between gap-2">
            <span>{active ? 'Everything else' : 'All projects'}</span>
            <span className="text-sm font-normal tabular-nums text-muted-foreground">{rest.length}</span>
          </h3>

          {rest.length === 0 ? (
            <p className="py-8 text-center italic text-muted-foreground">
              Nothing matches. Clear a filter to see more.
            </p>
          ) : (
            <ul aria-label="Your projects" className="grid list-none gap-3 p-0">
              {rest.map(p => {
                const counter = rowCounter(p);
                const pct = counter?.target
                  ? Math.min(100, Math.round((counter.value / counter.target) * 100)) : null;
                return (
                  <li key={p.id}>
                    <Card className="py-0">
                      <button
                        type="button"
                        onClick={() => navigate('project-detail', p.id)}
                        className="w-full rounded-xl text-left"
                      >
                        <CardContent className="px-4 py-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold">{p.name}</span>
                            <Badge>{STATUS_LABELS[p.status]}</Badge>
                          </div>
                          {counter && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {counter.value}{counter.target ? ` of ${counter.target}` : ''}{' '}
                              {counter.name.toLowerCase()}
                            </p>
                          )}
                          {pct !== null && <Progress value={pct} aria-label="Progress" className="mt-2" />}
                          {(p.tags || []).length > 0 && (
                            <span className="mt-2 flex flex-wrap gap-1">
                              {p.tags.map(t => <Badge key={t}>{t}</Badge>)}
                            </span>
                          )}
                        </CardContent>
                      </button>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <ProjectDialog open={newOpen} onOpenChange={setNewOpen} onSave={onCreate} />

      {/* Filter sheet — a Dialog, which the iOS skin already renders as a
          bottom sheet with a grabber. */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter projects</DialogTitle>
            <DialogDescription>Narrow the list below the counter.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <span id="status-filter-label" className="text-sm font-semibold">Status</span>
            <div role="group" aria-labelledby="status-filter-label" className="-mx-1 flex flex-wrap gap-2 px-1">
              {Object.entries(STATUS_LABELS).map(([value, label]) => {
                const on = statusFilter === value;
                return (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={on ? 'default' : 'outline'}
                    aria-pressed={on}
                    className="min-h-11 rounded-full font-medium"
                    onClick={() => setStatusFilter(on ? null : value)}
                  >
                    {label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-1.5">
            <span id="tag-filter-label" className="text-sm font-semibold">Tags</span>
            <TagChips
              label="Filter by tag"
              tags={allTags()}
              selected={tagFilter}
              onToggle={t => setTagFilter(list =>
                list.includes(t) ? list.filter(x => x !== t) : [...list, t])}
              onNew={() => { setNewTag(''); setNewTagOpen(true); }}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setStatusFilter(null); setTagFilter([]); announce('Filters cleared'); }}
            >
              Clear all
            </Button>
            <Button onClick={() => {
              setFilterOpen(false);
              announce(`${rest.length} project${rest.length === 1 ? '' : 's'} shown`);
            }}>
              Show results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Switch which project the counter belongs to. */}
      <Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What are you making?</DialogTitle>
            <DialogDescription>
              Its counter moves to the top of this screen.
            </DialogDescription>
          </DialogHeader>
          {inProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No projects are in progress. Set a project’s status to “In progress” to put it on the hook.
            </p>
          ) : (
            <ul className="grid list-none gap-2 p-0">
              {inProgress.map(p => {
                const counter = rowCounter(p);
                return (
                  <li key={p.id}>
                    <Button
                      variant={p.id === activeId ? 'default' : 'outline'}
                      className="h-auto w-full justify-start py-2.5 text-left"
                      aria-current={p.id === activeId ? 'true' : undefined}
                      onClick={() => pickActive(p.id)}
                    >
                      <span className="grid gap-0.5">
                        <span className="font-semibold">{p.name}</span>
                        {counter && (
                          <span className="text-xs opacity-80">
                            {counter.value}{counter.target ? ` of ${counter.target}` : ''}{' '}
                            {counter.name.toLowerCase()}
                          </span>
                        )}
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitchOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create a custom tag from inside the filter sheet. */}
      <Dialog open={newTagOpen} onOpenChange={setNewTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New tag</DialogTitle>
            <DialogDescription>
              Custom tags sit alongside the built-in ones and filter the same way.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={e => {
              e.preventDefault();
              const added = addCustomTag(newTag);
              if (added) {
                setTagFilter(list => [...list, added]);
                announce(`Tag ${added} created`);
              } else {
                announce('That tag already exists');
              }
              setNewTagOpen(false);
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="new-tag">Tag name</Label>
              <Input
                id="new-tag"
                required
                maxLength={24}
                placeholder="e.g. Test crochet"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewTagOpen(false)}>Cancel</Button>
              <Button type="submit">Create tag</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
