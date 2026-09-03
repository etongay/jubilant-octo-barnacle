// Row/stitch math shared by the counter UI (project detail, floating bar).
//
// A counter can optionally carry a starting stitch count and a per-row
// change (positive for increases, negative for decreases), so the app can
// tell you what you *should* be counting to on the row you're on — the
// thing a plain tally counter can't do.

export function expectedStitches(counter) {
  if (!counter || counter.stitchBase == null || !counter.value) return null;
  const n = counter.stitchBase + (counter.stitchIncrement || 0) * (counter.value - 1);
  return Math.max(0, Math.round(n));
}
