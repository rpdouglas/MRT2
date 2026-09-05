/** @type {import('tailwindcss').Config} */
// Separate from the root tailwind.config.js (which scans src/** for the main
// app) so this only affects the docs-site VitePress build — see
// postcss.config.js in this directory for how that scoping is enforced.
//
// Discovered 2026-09-05: the guide markdown has always authored screenshot
// figures with Tailwind utility classes (rounded-3xl, shadow-xl, etc.)
// assuming they'd be processed like the main app, but no Tailwind pipeline
// ever existed here — those classes silently never generated real CSS, so
// every embedded screenshot rendered unstyled/full-width in production.
// Anchored to this file's own directory (not process.cwd()) so the globs
// resolve correctly whether vitepress is invoked from the repo root
// (`npm run docs:build`) or from within docs-site itself.
const here = new URL('.', import.meta.url).pathname;

export default {
  content: [
    `${here}**/*.md`,
    `${here}.vitepress/theme/**/*.{js,ts,vue}`,
  ],
}
