// Scoped to docs-site: Vite resolves this postcss config relative to its own
// root (docs-site, since `vitepress build docs-site` sets that as Vite's
// root), so this file takes precedence over the root postcss.config.js here
// without touching the main app's config.
//
// The tailwind.config.js is imported directly (not left for the tailwindcss
// plugin to auto-discover) because that plugin's own config-file lookup
// starts from process.cwd() — which is the repo root when this runs via
// `npm run docs:build` — and would find the ROOT tailwind.config.js (whose
// content globs only cover src/**) before ever considering this directory's
// config.
import tailwindConfig from './tailwind.config.js';

export default {
  plugins: {
    tailwindcss: tailwindConfig,
    autoprefixer: {},
  },
}
