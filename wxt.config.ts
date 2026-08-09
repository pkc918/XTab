import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'XTab',
    description: 'A grayscale new-tab workspace with vivid signals for geeks.',
    permissions: ['storage', 'clipboardWrite'],
    host_permissions: [
      'https://github.com/*',
      'https://api.github.com/*',
      'https://openai.com/*',
      'https://code.claude.com/*',
    ],
    optional_host_permissions: [
      'http://*/*',
      'https://*/*',
    ],
  },
});
