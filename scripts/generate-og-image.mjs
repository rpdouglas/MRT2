// scripts/generate-og-image.mjs
//
// Renders public/og-image.png (1200x630, the standard Open Graph / Twitter
// Card size) from a small inline HTML template styled to match the
// Welcome.tsx hero (same gradient, brand mark, and tagline), using the same
// Playwright-screenshot approach already established by
// scripts/generate_screenshots.js. Not part of the build pipeline — this is
// a static asset, committed once and re-run by hand whenever the brand
// tagline changes. See docs/projects/102_SEO_AEO_OPTIMIZATION.md (Phase 2).
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '../public/raw_assets/MRT_Logo_Transparent.png');
const OUTPUT_PATH = path.join(__dirname, '../public/og-image.png');

const logoBase64 = fs.readFileSync(LOGO_PATH).toString('base64');

const html = `
<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    background:
      radial-gradient(ellipse at top left, rgba(37, 99, 235, 0.18), transparent 55%),
      radial-gradient(ellipse at bottom right, rgba(79, 70, 229, 0.18), transparent 55%),
      #f8fafc;
    position: relative;
    overflow: hidden;
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 80px;
  }
  .logo { width: 140px; height: auto; margin-bottom: 24px; filter: drop-shadow(0 10px 20px rgba(15, 23, 42, 0.15)); }
  .brand { font-size: 22px; font-weight: 900; letter-spacing: 0.2em; color: #0f172a; text-transform: uppercase; margin-bottom: 28px; }
  h1 { font-size: 52px; font-weight: 800; color: #0f172a; line-height: 1.15; margin-bottom: 20px; }
  h1 .accent { background: linear-gradient(90deg, #2563eb, #4f46e5); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .tagline { font-size: 24px; color: #475569; font-weight: 500; max-width: 820px; }
  .trust {
    position: absolute;
    bottom: 40px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    background: rgba(255,255,255,0.7);
    padding: 10px 24px;
    border-radius: 999px;
    border: 1px solid rgba(15,23,42,0.08);
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #10b981; }
</style>
</head>
<body>
  <div class="content">
    <img class="logo" src="data:image/png;base64,${logoBase64}" alt="" />
    <div class="brand">My Recovery Toolkit</div>
    <h1>Recovery principles,<br><span class="accent">backed by real tools.</span></h1>
    <p class="tagline">A zero-knowledge encrypted companion for 12-Step and Buddhist-inspired recovery.</p>
  </div>
  <div class="trust"><span class="dot"></span> Zero-Knowledge Encryption — even we can't read your journal.</div>
</body>
</html>
`;

async function generate() {
    const browser = await chromium.launch({
        headless: true,
        // Optional override for sandboxes with a non-standard Playwright
        // browser install path; unset in normal dev/CI environments.
        ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}),
    });
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: OUTPUT_PATH });
    await browser.close();
    console.log(`✅ Generated ${OUTPUT_PATH}`);
}

generate();
