import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

process.env.TZ = 'UTC';

const r = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^.*\.s?css$/, replacement: 'identity-obj-proxy' }],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
    setupFiles: [r('./setup-tests.ts')],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      include: ['**/src/**/*.component.tsx'],
      exclude: ['**/node_modules/**', '**/vendor/**', '**/src/**/*.test.*', '**/src/declarations.d.ts', '**/e2e/**'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    server: {
      deps: {
        inline: [/@openmrs/],
      },
    },
    alias: [
      { find: /^@openmrs\/esm-framework$/, replacement: '@openmrs/esm-framework/mock' },
      { find: 'react-i18next', replacement: r('../__mocks__/react-i18next.js') },
      { find: /^@tools\/(.*)$/, replacement: r('./') + '$1' },
      { find: /^@mocks\/(.*)$/, replacement: r('../__mocks__/') + '$1' },
    ],
  },
});
