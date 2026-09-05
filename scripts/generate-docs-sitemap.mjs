// scripts/generate-docs-sitemap.mjs
//
// Walks the built VitePress output (docs-site/.vitepress/dist) and emits a
// sitemap.xml listing every generated page. Runs after `vitepress build` so
// new guide/support pages are picked up automatically instead of relying on
// a hand-maintained list that goes stale — unlike public/sitemap.xml for the
// main app, which has a fixed, tiny set of public routes and is hand-kept.
// See docs/projects/102_SEO_AEO_OPTIMIZATION.md.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../docs-site/.vitepress/dist');
const SITE_ORIGIN = 'https://rpdouglas.github.io/MRT2';

function walkHtmlFiles(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkHtmlFiles(full, files);
        } else if (entry.name.endsWith('.html') && entry.name !== '404.html') {
            files.push(full);
        }
    }
    return files;
}

// Mirrors the extensionless links already used throughout the app
// (e.g. Login.tsx -> ".../MRT2/privacy") rather than the on-disk ".html" name.
function toPublicUrl(filePath) {
    const rel = path.relative(DIST_DIR, filePath).split(path.sep).join('/');
    const withoutIndex = rel.replace(/(^|\/)index\.html$/, '$1');
    const clean = withoutIndex.replace(/\.html$/, '');
    return `${SITE_ORIGIN}/${clean}`.replace(/\/$/, '') || SITE_ORIGIN;
}

function generate() {
    if (!fs.existsSync(DIST_DIR)) {
        throw new Error(`${DIST_DIR} does not exist — run "vitepress build docs-site" first.`);
    }

    const htmlFiles = walkHtmlFiles(DIST_DIR);
    const lastmod = new Date().toISOString().slice(0, 10);

    const urls = htmlFiles
        .map(toPublicUrl)
        .sort()
        .map((loc) => `  <url>\n    <loc>${loc}${loc === SITE_ORIGIN ? '/' : ''}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), xml);
    console.log(`Generated docs-site sitemap.xml with ${htmlFiles.length} URL(s).`);
}

generate();
