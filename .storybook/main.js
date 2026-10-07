/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  // Storybook reuses vite.config.js (Tailwind, React, the @ alias), but two
  // app-only settings break it: the PWA plugin would register a service
  // worker over Storybook's own iframe, and the GitHub Pages base path
  // would point every asset at /jubilant-octo-barnacle/.
  async viteFinal(config) {
    config.base = './';
    config.plugins = config.plugins
      .flat()
      .filter(p => !(p && typeof p.name === 'string' && p.name.startsWith('vite-plugin-pwa')));
    return config;
  },
};

export default config;
