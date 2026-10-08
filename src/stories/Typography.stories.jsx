const scale = [
  ['Display', 'font-display', '2.5rem', 600, 1.1, '-0.02em'],
  ['H1', 'font-display', '2rem', 600, 1.15, '-0.02em'],
  ['H2', 'font-display', '1.5rem', 600, 1.2, '-0.015em'],
  ['H3', 'font-display', '1.25rem', 600, 1.25, '-0.01em'],
  ['H4', 'font-display', '1.125rem', 600, 1.3, '-0.005em'],
  ['Body large', 'font-body', '1.125rem', 400, 1.6, '0'],
  ['Body', 'font-body', '1rem', 400, 1.6, '0'],
  ['Body small', 'font-body', '0.875rem', 400, 1.5, '0'],
  ['Caption', 'font-body', '0.75rem', 500, 1.4, '0.01em'],
  ['Label', 'font-body', '0.875rem', 600, 1.2, '0.01em'],
];

const families = {
  'font-display': 'var(--font-display)',
  'font-body': 'var(--font-body)',
};

export default {
  title: 'Foundations/Typography',
  parameters: { layout: 'padded' },
  tags: ['!autodocs'],
};

export const Scale = {
  render: () => (
    <div className="flex flex-col gap-4">
      {scale.map(([name, fam, size, weight, lh, ls]) => (
        <div key={name} className="flex items-baseline gap-6">
          <div className="text-muted-foreground w-28 shrink-0 text-xs">{name}<br />{size} / {weight}</div>
          <div style={{ fontFamily: families[fam], fontSize: size, fontWeight: weight, lineHeight: lh, letterSpacing: ls }}>
            Granny square, round three
          </div>
        </div>
      ))}
    </div>
  ),
};
