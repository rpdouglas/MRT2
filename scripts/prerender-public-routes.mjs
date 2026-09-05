// scripts/prerender-public-routes.mjs
//
// PROJ-102 (SEO/AEO) Phase 2, G6: the app is a pure client-side-rendered SPA,
// so any crawler that doesn't execute JS (many AI crawlers, link-preview
// bots) sees an empty <div id="root"> for every route — including the 4
// public ones this whole project is trying to make visible. Rather than a
// full SSR rewrite (out of scope — the rest of the app is intentionally
// CSR-only behind auth and has no SEO need for it), this renders just those
// 4 routes with a real headless browser after `vite build` and writes the
// fully-rendered HTML to disk, so Firebase Hosting can serve real markup for
// them directly instead of falling through to the empty SPA shell.
//
// Run after `npm run build` (see the "build" script in package.json). Uses
// `vite preview` (already a project dependency) to host the built dist/
// directory locally — no extra static-server dependency needed.
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(REPO_ROOT, 'dist');
const PORT = 4319;
const BASE_URL = `http://localhost:${PORT}`;

// Every route that isn't one of these falls through Firebase Hosting's SPA
// rewrite (firebase.json) to app-shell.html — the untouched, plain CSR
// shell preserved below — so gated routes' behavior is unaffected by this
// script.
const ROUTES = [
  { path: '/', outFile: 'index.html' },
  { path: '/login', outFile: 'login.html' },
  { path: '/links', outFile: 'links.html' },
  { path: '/delete-account', outFile: 'delete-account.html' },
];

function waitForServer() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      http.get(BASE_URL, (res) => {
        clearInterval(interval);
        res.resume();
        resolve(true);
      }).on('error', () => { /* retry */ });
    }, 200);
    setTimeout(() => { clearInterval(interval); resolve(false); }, 20000);
  });
}

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error(`${DIST_DIR} does not exist — run "vite build" first.`);
  }

  // Preserve today's plain CSR shell as the fallback for every non-public
  // route BEFORE any prerendered output below overwrites dist/index.html.
  const shellPath = path.join(DIST_DIR, 'app-shell.html');
  fs.copyFileSync(path.join(DIST_DIR, 'index.html'), shellPath);
  console.log(`Preserved CSR shell -> ${shellPath}`);

  console.log('Starting local preview server for prerendering...');
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: REPO_ROOT,
    shell: true,
    stdio: 'ignore',
  });

  try {
    const ready = await waitForServer();
    if (!ready) throw new Error('Local static server did not start in time.');

    const browser = await chromium.launch({
      headless: true,
      // Needed when this script runs as root (many CI/container setups) —
      // Chromium's sandbox refuses to initialize under root otherwise.
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // Optional override for sandboxes with a non-standard Playwright
      // browser install path; unset in normal dev/CI environments.
      ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    });
    const page = await browser.newPage();

    const captured = {};
    for (const route of ROUTES) {
      // Not `networkidle`: Firebase SDKs keep background connections open
      // (and, without real project credentials, keep retrying failed ones),
      // so the network never truly goes idle. The canonical-link wait below
      // is the real "React has mounted and rendered this route" signal.
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('link[rel="canonical"]', { state: 'attached', timeout: 15000 });
      captured[route.outFile] = await page.content();
      console.log(`Captured ${route.path}`);
    }

    await browser.close();

    for (const [outFile, html] of Object.entries(captured)) {
      fs.writeFileSync(path.join(DIST_DIR, outFile), html);
      console.log(`Wrote dist/${outFile}`);
    }
  } finally {
    server.kill();
  }
}

main();
