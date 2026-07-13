import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**/*.ts'],
      exclude: ['src/domain/index.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 90
      }
    }
  }
});
