// Every raw Radix step, read live from tokens.css — so this page can never
// drift from the shipped values. Flip your OS to dark mode to see the
// dark-mode scales.

const families = ['mint', 'orange', 'olive', 'red', 'yellow', 'blue', 'green'];
const roles = ['bg', 'bg-hover', 'bg-active', 'border', 'border-strong', 'solid', 'solid-hover', 'text', 'fg'];

function Scale({ family }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-sm font-semibold capitalize">{family}</div>
      <div className="flex">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            title={`--${family}-${i + 1} · role: ${roles[i - 3] ?? '—'}`}
            className="flex size-12 items-end justify-center pb-1 text-[10px]"
            style={{ background: `var(--${family}-${i + 1})`, color: i < 10 ? `var(--${family}-12)` : `var(--${family}-1)` }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export default {
  title: 'Foundations/Colour',
  parameters: { layout: 'padded' },
  tags: ['!autodocs'],
};

export const Scales = {
  render: () => (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground mb-2 text-sm">Steps 4–12 map to roles bg → fg (design-system.md §1.2). Hover a swatch for its token.</p>
      {families.map(f => <Scale key={f} family={f} />)}
    </div>
  ),
};

export const ButtonFormula = {
  name: 'Button formula (step 4 on 12)',
  render: () => (
    <div className="flex flex-wrap gap-3">
      {families.map(f => (
        <div
          key={f}
          className="rounded-lg px-4 py-2 text-sm font-medium capitalize"
          style={{ background: `var(--${f}-4)`, color: `var(--${f}-12)` }}
        >
          {f}
        </div>
      ))}
    </div>
  ),
};
