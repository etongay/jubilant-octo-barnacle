// Projects — Study B.
//
// The app is opened mid-row with a hook in the other hand, so the counter
// for whatever you're making floats above the tab bar rather than living
// at the top of the page: it stays reachable however far you scroll, and
// the list is free to show every project. Filtering stays in a sheet so
// the resting surface stays quiet.

import { useCallback, useEffect, useState } from 'react';
import { db, settings } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { allTags, addCustomTag } from '@/lib/tags.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CounterBar } from '@/components/counter-bar.jsx';
import { StatusBadge, TagList } from '@/components/badges.jsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { TagChips } from '@/components/tag-chips.jsx';
import { Plus, Search, Filter, Repeat } from '@/lib/icons.jsx';
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
  // Choosing what you're making is a request for its counter, so it
  // overrides an earlier dismissal rather than leaving the bar hidden.
  settings.set('counterDismissed', false);
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
  const [dismissed, setDismissed] = useState(settings.get('counterDismissed', false));
  const [expanded, setExpanded] = useState(settings.get('counterExpanded', false));
  const [barHeight, setBarHeight] = useState(0);

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
  const activeCounter = rowCounter(active);
  const filterCount = tagFilter.length + (statusFilter ? 1 : 0);

  const matches = (p) => {
    const q = query.trim().toLowerCase();
    const hay = [p.name, p.hook, p.notes, ...(p.tags || [])].filter(Boolean).join(' ').toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (tagFilter.length && !(p.tags || []).some(t => tagFilter.includes(t))) return false;
    return true;
  };

  const shown = projects.filter(matches);
  const inProgress = projects.filter(p => p.status === 'in-progress');

  const pickActive = (id) => {
    setActiveId(id);
    setActive(id);
    setDismissed(false);
    setSwitchOpen(false);
    const p = projects.find(x => x.id === id);
    announce(p ? `${p.name} is now on the hook` : 'Project changed');
  };

  const barVisible = !!active && !!activeCounter && !dismissed;

  const setBarExpanded = (v) => { setExpanded(v); settings.set('counterExpanded', v); };
  const dismissBar = () => {
    setDismissed(true);
    settings.set('counterDismissed', true);
    setBarExpanded(false);
    announce('Counter hidden. Show it again from the button above the list.');
  };

  return (
    <section aria-labelledby="projects-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="projects-heading">Projects</h2>
        <Button onClick={() => setNewOpen(true)}>
          <Plus aria-hidden="true" /> New project
        </Button>
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="text-center text-muted-foreground">
            No projects yet. Cast on your first one with “New project”.
          </CardContent>
        </Card>
      )}

      {/* Dismissing the counter must not be a dead end. */}
      {projects.length > 0 && !barVisible && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            if (active && activeCounter) {
              setDismissed(false);
              settings.set('counterDismissed', false);
              announce(`Counter for ${active.name} shown`);
            } else {
              setSwitchOpen(true);
            }
          }}
        >
          <Repeat aria-hidden="true" />
          {active && activeCounter ? `Show counter for ${active.name}` : 'Put a project on the hook'}
        </Button>
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
                <span className="ml-1 inline-grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums">
                  {filterCount}
                </span>
              )}
            </Button>
          </div>

          <h3 className="mt-4 mb-2 flex items-center justify-between gap-2">
            <span>All projects</span>
            <span className="text-sm font-normal tabular-nums text-muted-foreground">{shown.length}</span>
          </h3>

          {shown.length === 0 ? (
            <p className="py-8 text-center italic text-muted-foreground">
              Nothing matches. Clear a filter to see more.
            </p>
          ) : (
            <ul aria-label="Your projects" className="grid list-none gap-3 p-0">
              {shown.map(p => {
                const counter = rowCounter(p);
                const pct = counter?.target
                  ? Math.min(100, Math.round((counter.value / counter.target) * 100)) : null;
                return (
                  <li key={p.id}>
                    <Card className="py-0">
                      <CardContent className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => navigate('project-detail', p.id)}
                          className="w-full rounded-lg text-left"
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-bold">{p.name}</span>
                            <StatusBadge>{STATUS_LABELS[p.status]}</StatusBadge>
                          </span>
                          {counter && (
                            <span className="mt-0.5 block text-sm text-muted-foreground">
                              {counter.value}{counter.target ? ` of ${counter.target}` : ''}{' '}
                              {counter.name.toLowerCase()}
                            </span>
                          )}
                          {p.id === activeId && barVisible && (
                            <span className="mt-0.5 block text-sm font-semibold text-link">
                              On the hook
                            </span>
                          )}
                        </button>
                        {pct !== null && <Progress value={pct} aria-label="Progress" className="mt-2" />}
                        <TagList tags={p.tags} className="mt-2" label={`Tags on ${p.name}`} />
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {/* Keeps the last card clear of the floating bar, at whatever height
          the bar currently is — it grows with the expanded state and with
          the user's text-size setting. */}
      {barVisible && <div aria-hidden="true" style={{ height: barHeight + 12 }} />}

      {barVisible && (
        <CounterBar
          project={active}
          primary={activeCounter}
          statusLabel={STATUS_LABELS[active.status]}
          expanded={expanded}
          onExpandedChange={setBarExpanded}
          onChange={saveProject}
          onOpen={() => navigate('project-detail', active.id)}
          onSwitch={() => setSwitchOpen(true)}
          onDismiss={dismissBar}
          onHeightChange={setBarHeight}
        />
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
              announce(`${shown.length} project${shown.length === 1 ? '' : 's'} shown`);
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
