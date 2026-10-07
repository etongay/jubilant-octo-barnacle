import '../src/app.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  // The two app-level switches the design system responds to. Light/dark is
  // not here: tokens.css follows prefers-color-scheme only, so use your OS
  // setting (or DevTools → Rendering → Emulate prefers-color-scheme).
  globalTypes: {
    surface: {
      description: 'Surface finish (design-system.md §5)',
      toolbar: {
        title: 'Surface',
        icon: 'mirror',
        items: [
          { value: 'flat', title: 'Flat' },
          { value: 'glass', title: 'Liquid Glass' },
        ],
        dynamicTitle: true,
      },
    },
    fontScale: {
      description: 'Text size (--font-scale)',
      toolbar: {
        title: 'Text size',
        icon: 'paragraph',
        items: [
          { value: '1', title: '100%' },
          { value: '1.25', title: '125%' },
          { value: '1.5', title: '150%' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { surface: 'flat', fontScale: '1' },
  decorators: [
    (Story, { globals }) => {
      const root = document.documentElement;
      if (globals.surface === 'glass') root.dataset.surface = 'glass';
      else delete root.dataset.surface;
      root.style.setProperty('--font-scale', globals.fontScale);
      return <Story />;
    },
  ],
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i } },
    // Fail the a11y panel loudly — the design system claims axe-clean.
    a11y: { test: 'error' },
  },
  tags: ['autodocs'],
};

export default preview;
