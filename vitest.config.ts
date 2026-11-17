import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so tests do not load the Tailwind / AI Studio dev plugins.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
