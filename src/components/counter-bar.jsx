// The row counter as a floating bar docked above the tab bar.
//
// It follows you down the Projects list instead of scrolling away, because
// counting is the one thing you do with a hook in the other hand. Two
// states: condensed is just the count and its two buttons; expanded exposes
// the target, the project's other counters, and the actions that would
// otherwise cost a trip into the project.
//
// Dismiss lives in the expanded panel, deliberately not beside the + in the
// condensed bar — a mis-tap there would hide the thing you are using.

import { useEffect, useRef, useState } from 'react';
import { announce } from '@/lib/announce.js';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/badges.jsx';
import { Plus, Minus, ChevronUp, ChevronDown, X, RotateCcw } from '@/lib/icons.jsx';
import { cn } from '@/lib/utils.js';

const PANEL_ID = 'counter-bar-panel';

function pctOf(counter) {
  return counter?.target ? Math.min(100, Math.round((counter.value / counter.target) * 100)) : null;
}
const singular = (name) => name.toLowerCase().replace(/s$/, '');

export function CounterBar({
  project, primary, statusLabel, expanded, onExpandedChange,
  onChange, onOpen, onDismiss, onHeightChange,
}) {
  const ref = useRef(null);

  // The spacer under the list has to match this bar exactly, and the bar's
  // height moves with the expanded state and the user's text-size setting.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => onHeightChange?.(el.offsetHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeightChange]);

  if (!project || !primary) return null;

  const bump = (counter, delta) => {
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

  const others = (project.counters || []).filter(c => c.id !== primary.id);
  const pct = pctOf(primary);

  return (
    <section
      ref={ref}
      aria-label={`${primary.name} counter for ${project.name}`}
      className="counter-bar fixed inset-x-3 z-30 rounded-2xl border bg-card shadow-lg"
    >
      {/* ---------- condensed row: always present ---------- */}
      <div className="flex items-stretch gap-2 p-2">
        <Button
          variant="ghost"
          aria-expanded={expanded}
          aria-controls={PANEL_ID}
          onClick={() => onExpandedChange(!expanded)}
          className="h-auto min-w-0 flex-1 justify-start gap-2 px-2 py-1.5 text-left"
        >
          {expanded
            ? <ChevronDown className="size-5 shrink-0" aria-hidden="true" />
            : <ChevronUp className="size-5 shrink-0" aria-hidden="true" />}
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate text-sm font-semibold">{project.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {expanded
                ? 'Hide details'
                : primary.target
                  ? `of ${primary.target} ${primary.name.toLowerCase()}`
                  : primary.name.toLowerCase()}
            </span>
          </span>
        </Button>

        {!expanded && (
          <>
            <output className="self-center px-1 text-2xl font-bold tabular-nums" aria-live="off">
              {primary.value}
            </output>
            <Button
              variant="outline"
              size="icon"
              className="size-12 shrink-0"
              aria-label={`One ${singular(primary.name)} back`}
              onClick={() => bump(primary, -1)}
            >
              <Minus className="size-5" />
            </Button>
            <Button
              size="icon"
              className="size-12 shrink-0"
              aria-label={`Count one ${singular(primary.name)}`}
              onClick={() => bump(primary, 1)}
            >
              <Plus className="size-5" />
            </Button>
          </>
        )}
      </div>

      {/* ---------- expanded panel ---------- */}
      <div id={PANEL_ID} hidden={!expanded} className="max-h-[52vh] overflow-y-auto border-t px-3 pt-3 pb-3">
        <div className="mb-3 flex items-start justify-between gap-2">
          <StatusBadge>{statusLabel}</StatusBadge>
          <Button variant="ghost" size="icon" aria-label="Hide the counter" onClick={onDismiss}>
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-[4rem_1fr_4rem] items-center gap-3">
          <Button
            variant="outline"
            className="min-h-16"
            aria-label={`One ${singular(primary.name)} back`}
            onClick={() => bump(primary, -1)}
          >
            <Minus className="size-7" />
          </Button>
          <div className="text-center">
            <output className="block text-4xl font-bold tabular-nums" aria-live="off">
              {primary.value}
            </output>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {primary.target ? `of ${primary.target} ${primary.name.toLowerCase()}` : primary.name.toLowerCase()}
            </span>
          </div>
          <Button
            className="min-h-16"
            aria-label={`Count one ${singular(primary.name)}`}
            onClick={() => bump(primary, 1)}
          >
            <Plus className="size-7" />
          </Button>
        </div>

        {pct !== null && <Progress value={pct} aria-label={`${primary.name} progress`} className="mt-3" />}

        {others.length > 0 && (
          <ul className="mt-3 grid list-none gap-2 p-0">
            {others.map(c => (
              <li key={c.id} className="flex items-center gap-2 rounded-xl bg-secondary p-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.name}</span>
                <output className="px-1 text-lg font-bold tabular-nums" aria-live="off">{c.value}</output>
                <Button variant="outline" size="icon" className="size-11 shrink-0"
                  aria-label={`One ${singular(c.name)} back`} onClick={() => bump(c, -1)}>
                  <Minus className="size-4" />
                </Button>
                <Button variant="outline" size="icon" className="size-11 shrink-0"
                  aria-label={`Count one ${singular(c.name)}`} onClick={() => bump(c, 1)}>
                  <Plus className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => {
              if (!confirm(`Reset ${primary.name} to 0?`)) return;
              onChange({
                ...project,
                counters: project.counters.map(c => (c.id === primary.id ? { ...c, value: 0 } : c)),
              });
              announce(`${primary.name} reset to 0`);
            }}
          >
            <RotateCcw aria-hidden="true" /> Reset
          </Button>
          <Button variant="outline" size="sm" className="min-h-11" onClick={onOpen}>
            Open project
          </Button>
        </div>
      </div>
    </section>
  );
}

export { pctOf };
