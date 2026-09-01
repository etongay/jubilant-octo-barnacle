import { useEffect, useState } from 'react';
import { db } from '@/lib/db.js';
import { announce } from '@/lib/announce.js';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronUp, ChevronDown, Check, Trash2, Pencil } from '@/lib/icons.jsx';
import { cn } from '@/lib/utils.js';

const colorName = (i) => 'colour ' + String.fromCharCode(65 + (i || 0));

export default function ChartReader({ id, navigate }) {
  const [chart, setChart] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [paintColor, setPaintColor] = useState(0);

  useEffect(() => {
    db.get('charts', id).then(ch => {
      if (!ch) return navigate('charts');
      setChart(ch);
    });
  }, [id, navigate]);

  if (!chart) return null;

  const save = (updated) => { setChart(updated); db.put('charts', updated); };

  const moveRow = (delta) => {
    const currentRow = Math.min(chart.height, Math.max(1, chart.currentRow + delta));
    save({ ...chart, currentRow });
    announce('Working row ' + currentRow);
  };

  const markRowDone = () => {
    const r = chart.currentRow;
    const doneRows = [...chart.doneRows];
    doneRows[r - 1] = !doneRows[r - 1];
    let { doneCells, currentRow } = chart;
    if (doneRows[r - 1]) {
      doneCells = [...chart.doneCells];
      for (let c = 0; c < chart.width; c++) doneCells[(r - 1) * chart.width + c] = true;
      announce(`Row ${r} complete`);
      if (r < chart.height) currentRow = r + 1;
      if (doneRows.every(Boolean)) announce('Every row is complete — the chart is finished! 🎉');
    } else {
      announce(`Row ${r} marked not done`);
    }
    save({ ...chart, doneRows, doneCells, currentRow });
  };

  const tapCell = (idx, r, c) => {
    if (editMode) {
      const cells = [...chart.cells];
      cells[idx] = paintColor;
      save({ ...chart, cells });
    } else {
      const doneCells = [...chart.doneCells];
      doneCells[idx] = !doneCells[idx];
      save({ ...chart, doneCells });
      announce(`Stitch ${c + 1} ${doneCells[idx] ? 'done' : 'not done'}`);
    }
  };

  const rows = [];
  for (let r = chart.height; r >= 1; r--) rows.push(r);

  return (
    <section aria-labelledby="chart-heading">
      <Button variant="outline" className="mb-2" onClick={() => navigate('charts')}>
        <ArrowLeft aria-hidden="true" /> All charts
      </Button>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="chart-heading" className="text-xl font-bold">{chart.name}</h2>
        <Button
          variant={editMode ? 'default' : 'outline'}
          aria-pressed={editMode}
          onClick={() => {
            setEditMode(!editMode);
            announce(!editMode
              ? 'Edit mode — tapping a stitch changes its colour'
              : 'Read mode — tapping a stitch marks it done');
          }}
        >
          <Pencil aria-hidden="true" /> {editMode ? 'Done editing' : 'Edit mode'}
        </Button>
      </div>

      <div role="group" aria-label="Row navigation" className="mb-2 flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => moveRow(-1)}>
          <ChevronDown aria-hidden="true" /> Previous row
        </Button>
        <span aria-live="polite" className="px-1 font-bold">Row {chart.currentRow} of {chart.height}</span>
        <Button variant="outline" onClick={() => moveRow(1)}>
          <ChevronUp aria-hidden="true" /> Next row
        </Button>
        <Button variant="secondary" onClick={markRowDone}>
          <Check aria-hidden="true" /> Mark row complete
        </Button>
      </div>

      {editMode && (
        <div role="group" aria-label="Editing tools" className="mb-2 flex items-center gap-2">
          <span id="palette-label" className="text-sm font-semibold">Draw with:</span>
          <div role="radiogroup" aria-labelledby="palette-label" className="flex gap-2">
            {chart.palette.map((color, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={i === paintColor}
                aria-label={'Colour ' + String.fromCharCode(65 + i)}
                onClick={() => { setPaintColor(i); announce('Drawing with colour ' + String.fromCharCode(65 + i)); }}
                className={cn('size-11 rounded-lg border-2', i === paintColor && 'outline-3 outline outline-offset-2 outline-ring')}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      )}

      <div tabIndex={0} role="region" aria-label="Mosaic chart grid, scrollable"
        className="max-h-[60dvh] overflow-auto rounded-xl border bg-card p-2">
        <table className="mx-auto border-collapse">
          <caption className="sr-only">
            Mosaic crochet chart. Rows are numbered from the bottom. Completed rows are dimmed and marked with a check.
          </caption>
          <tbody>
            {rows.map(r => {
              const isCurrent = r === chart.currentRow && !editMode;
              const isDone = chart.doneRows[r - 1];
              return (
                <tr key={r} className={cn(!isCurrent && isDone && 'opacity-45')}>
                  <th scope="row" className={cn('px-1.5 text-right text-xs font-normal text-muted-foreground',
                    isCurrent && 'bg-highlight font-bold text-foreground')}>
                    {r}{isDone ? ' ✓' : ''}
                  </th>
                  {Array.from({ length: chart.width }, (_, c) => {
                    const idx = (r - 1) * chart.width + c;
                    const done = chart.doneCells[idx] && !editMode;
                    return (
                      <td key={c} className={cn('border p-0',
                        isCurrent && 'border-t-3 border-b-3 border-t-ring border-b-ring')}
                        style={{ background: chart.palette[chart.cells[idx]] || chart.palette[0] }}>
                        <button
                          type="button"
                          aria-label={`Row ${r}, stitch ${c + 1}, ${colorName(chart.cells[idx])}${done ? ', done' : ''}`}
                          onClick={() => tapCell(idx, r, c)}
                          className="relative block h-7 w-7 min-w-7"
                        >
                          {done && (
                            <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-sm font-bold"
                              style={{ color: 'var(--done-overlay)' }}>✕</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        In read mode, tap a stitch to mark it done. The highlighted row is your working row — mosaic charts read bottom-to-top.
      </p>
      <Button variant="destructive" className="mt-2" onClick={async () => {
        if (!confirm(`Delete “${chart.name}”? This cannot be undone.`)) return;
        await db.delete('charts', chart.id);
        announce('Chart deleted');
        navigate('charts');
      }}>
        <Trash2 aria-hidden="true" /> Delete chart
      </Button>
    </section>
  );
}
