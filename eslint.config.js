import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const WEB = ['apps/web/**/*.{ts,tsx}'];
const NODE = ['apps/server/**/*.ts', 'e2e/**/*.ts', '*.config.{js,ts}', 'apps/web/vite.config.ts'];

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'test-results/**', 'playwright-report/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // The client: browser globals, the rules of hooks and accessibility checks.
  {
    files: WEB,
    ...jsxA11y.flatConfigs.recommended,
    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      globals: globals.browser,
    },
  },
  { files: WEB, ...reactHooks.configs.flat.recommended },

  { files: NODE, languageOptions: { globals: globals.node } },

  // Architecture rule 1: game-core holds the rules and must not depend on
  // React, the DOM, PixiJS or the server.
  {
    files: ['packages/game-core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'pixi.js', 'hono', '@hono/*', 'zustand', 'node:*'],
              message: 'game-core must not depend on the UI, the server or the platform.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'game-core must not depend on the DOM.' },
        { name: 'document', message: 'game-core must not depend on the DOM.' },
      ],
    },
  },
);
