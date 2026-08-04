import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'docs-site/.vitepress/cache', 'docs-site/.vitepress/dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // PROJ-97: static-analysis complement to PROJ-91's runtime axe-core CI
    // gate (e2e/golden-paths/a11y.spec.ts) — jsx-a11y catches issues at lint
    // time from JSX source alone, axe catches issues only visible once
    // rendered (computed contrast, live ARIA state). Scoped to .tsx only,
    // no reason to run JSX-focused rules against plain .ts files.
    files: ['**/*.tsx'],
    extends: [jsxA11y.flatConfigs.recommended],
  },
  {
    // Playwright's fixture `use()` callback isn't a React Hook — the
    // react-hooks plugin's name-based heuristic misfires on it otherwise.
    files: ['e2e/**/*.{ts,tsx}', 'playwright.config.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
