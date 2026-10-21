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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { TagChips } from '@/components/tag-chips.jsx';
import { Plus, MagnifyingGlass, Filter, FilterX, Repeat } from '@/lib/icons.jsx';
import ProjectDialog from './ProjectDialog.jsx';

export const STATUS_LABELS = {
  planned: 'Planned', 'in-progress': 'In progress', finished: 'Finished',
  hibernating: 'Hibernating', frogged: 'Frogged',
};

// No real photo-upload feature exists yet, so a card's "preview image" is a
// generated placeholder — a two-tone gradient hashed from the project's own
// id, so it's stable across renders without being stored anywhere. Title and
// progress live in a solid caption area below the image rather than
// overlaid on it: an arbitrary generated gradient has no predictable
// luminance, so there's no fixed scrim opacity that could guarantee
// WCAG-contrast text sitting on top of every hue this produces.
function hashHue(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 360;
}
export function coverStyle(project) {
  const hue = hashHue(project.id || project.name || '');
  return { background: `linear-gradient(135deg, hsl(${hue} 60% 72%), hsl(${(hue + 44) % 360} 65% 50%))` };
}

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
  // Most-recently-updated in-progress projects — a "continue making" rail,
  // capped at 3 regardless of how many are actually in progress.
  const inProgress = projects.filter(p => p.status === 'in-progress').slice(0, 3);

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
      {projects.length > 0 && active && activeCounter && dismissed && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setDismissed(false);
            settings.set('counterDismissed', false);
            announce(`Counter for ${active.name} shown`);
          }}
        >
          <Repeat aria-hidden="true" />
          Show counter for {active.name}
        </Button>
      )}

      {inProgress.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2">In progress</h3>
          {/* Left edge stays flush with the rest of the app's content margin
              (no left bleed); -mr-4/pr-4 only extend the right edge past the
              content column to the viewport edge, so an unscrolled card gets
              visibly clipped there — the cue that there's more to scroll. */}
          <div
            role="region"
            aria-label="In progress projects"
            tabIndex={0}
            className="-mr-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pr-4 pb-1"
          >
            {inProgress.map(p => {
              const counter = rowCounter(p);
              const pct = counter?.target
                ? Math.min(100, Math.round((counter.value / counter.target) * 100)) : null;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate('project-detail', p.id)}
                  className="w-[72%] max-w-72 shrink-0 snap-start overflow-hidden rounded-xl border bg-card text-left"
                >
                  <div aria-hidden="true" className="aspect-[4/3] w-full" style={coverStyle(p)} />
                  <div className="p-3">
                    <p className="truncate font-bold">{p.name}</p>
                    {pct !== null ? (
                      <>
                        {/* orange-11, not the app's --secondary-accent(-foreground)
                            tokens: step 4 is too pale and step 12 is a dark,
                            desaturated "ink" shade made for text, not a fill —
                            neither reads as orange. Step 11 is vivid and still
                            clears 3:1 against the track in both modes. */}
                        <Progress
                          value={pct}
                          aria-label={`${p.name} progress`}
                          className="mt-2"
                          indicatorClassName="bg-[var(--orange-11)]"
                        />
                        <p className="mt-1 text-sm text-muted-foreground">{pct}%</p>
                      </>
                    ) : (
                      counter && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {counter.value} {counter.name.toLowerCase()}
                        </p>
                      )
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass
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
            <ul aria-label="Your projects" className="grid list-none grid-cols-2 gap-3 p-0">
              {shown.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => navigate('project-detail', p.id)}
                    className="w-full overflow-hidden rounded-xl border bg-card text-left"
                  >
                    <div aria-hidden="true" className="aspect-square w-full" style={coverStyle(p)} />
                    <p className="truncate p-2.5 font-bold">{p.name}</p>
                  </button>
                </li>
              ))}
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
              <FilterX aria-hidden="true" /> Clear all
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
