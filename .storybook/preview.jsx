import '../src/app.css';
import { IconContext } from '../src/lib/icons.jsx';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  // The app-level switches the design system responds to, each an
  // attribute or variable on <html> (see design-system.md §5).
  globalTypes: {
    theme: {
      description: 'Colour scheme',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'system', title: 'Follow OS' },
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
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
  initialGlobals: { theme: 'system', surface: 'flat', fontScale: '1' },
  decorators: [
    (Story, { globals }) => {
      const root = document.documentElement;
      if (globals.theme === 'system') delete root.dataset.theme;
      else root.dataset.theme = globals.theme;
      if (globals.surface === 'glass') root.dataset.surface = 'glass';
      else delete root.dataset.surface;
      root.style.setProperty('--font-scale', globals.fontScale);
      // Same icon defaults as src/main.jsx.
      return (
        <IconContext.Provider value={{ size: 24, 'aria-hidden': true }}>
          <Story />
        </IconContext.Provider>
      );
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
