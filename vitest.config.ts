import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest ran on bare defaults until now, which meant no test could import
 * anything under `lib/` — those modules use the `@/` alias from tsconfig, and
 * without it resolving here the import fails before a single assertion runs.
 * That quietly put the site's whole data layer out of reach of the test suite.
 *
 * `__dirname` rather than `import.meta.url`: this config is loaded as CommonJS,
 * and `import.meta` there trips a Vite config-loader warning.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
});
