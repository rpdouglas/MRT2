#!/usr/bin/env node
// Exports the codebase into chunked Markdown files under llm-export/ for
// loading into LLM tools (e.g. NotebookLM). See CLAUDE.md workflow section.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'llm-export');

const CHUNK_SOFT_CAP_BYTES = 200 * 1024;
const MAX_FILE_SIZE_BYTES = 500 * 1024;

const EXCLUDED_SEGMENTS = [
  'node_modules',
  'functions/node_modules',
  '.git',
  'dist',
  'dist-ssr',
  'build',
  'functions/lib',
  'coverage',
  '.firebase',
  'android-build',
  'public',
  'docs/projects/archive',
  'docs-site/.vitepress/cache',
  'docs-site/.vitepress/dist',
  'docs-site/public/screenshots',
];

const EXCLUDED_FILENAMES = new Set([
  'package-lock.json',
  'yarn.lock',
  '.gitignore',
  '.DS_Store',
  'build-info.json',
  'vite.config.bak',
  'docs_dump.txt',
]);

const EXCLUDED_FILENAME_PREFIXES = ['.env', 'export_', 'service-account'];
const EXCLUDED_EXTENSIONS = new Set(['.keystore', '.aab', '.apk']);

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts',
  '.json', '.md', '.css', '.scss', '.html',
  '.py', '.sh', '.yml', '.yaml', '.xml', '.rules', '.txt',
]);

// Extensionless files we deliberately want included (opposite of the
// permissive no-extension default used by the older export_codebase.js).
const EXTENSIONLESS_ALLOWLIST = new Set(['.firebaserc', '.clinerules']);

const LANG_BY_EXT = {
  '.ts': 'typescript', '.tsx': 'typescript', '.mts': 'typescript',
  '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
  '.json': 'json', '.md': 'markdown', '.css': 'css', '.scss': 'scss',
  '.html': 'html', '.py': 'python', '.sh': 'bash', '.yml': 'yaml', '.yaml': 'yaml',
  '.xml': 'xml', '.rules': 'text', '.txt': '',
};

const skipped = []; // { rel, reason }

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function isExcludedPath(rel) {
  for (const seg of EXCLUDED_SEGMENTS) {
    const escaped = seg.replace(/[.]/g, '\\.');
    const re = new RegExp(`(^|/)${escaped}(/|$)`);
    if (re.test(rel)) return true;
  }
  return false;
}

function isExcludedFile(rel, name) {
  if (EXCLUDED_FILENAMES.has(name)) return true;
  for (const prefix of EXCLUDED_FILENAME_PREFIXES) {
    if (name.startsWith(prefix)) return true;
  }
  const ext = path.extname(name).toLowerCase();
  if (EXCLUDED_EXTENSIONS.has(ext)) return true;
  return isExcludedPath(rel);
}

function isIncludedByExtension(name) {
  const ext = path.extname(name).toLowerCase();
  if (EXTENSIONLESS_ALLOWLIST.has(name)) return true;
  return TEXT_EXTENSIONS.has(ext);
}

/** Recursively walk a directory, returning included absolute file paths in
 * deterministic (alphabetical, depth-first) order. Records skips. */
function walkDir(absDir) {
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return [];
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));

  const out = [];
  for (const entry of entries) {
    const full = path.join(absDir, entry.name);
    const rel = toPosix(path.relative(ROOT, full));

    if (entry.isSymbolicLink()) {
      skipped.push({ rel, reason: 'symlink' });
      continue;
    }
    if (isExcludedFile(rel, entry.name)) continue;

    if (entry.isDirectory()) {
      out.push(...walkDir(full));
    } else if (entry.isFile()) {
      if (!isIncludedByExtension(entry.name)) {
        skipped.push({ rel, reason: 'unrecognized extension' });
        continue;
      }
      const size = fs.statSync(full).size;
      if (size > MAX_FILE_SIZE_BYTES) {
        skipped.push({ rel, reason: `exceeds ${MAX_FILE_SIZE_BYTES / 1024}KB hard ceiling` });
        continue;
      }
      out.push(full);
    }
  }
  return out;
}

/** Resolve an explicit file list (for sections built from named files rather
 * than a directory walk). Missing files are silently skipped (optional). */
function resolveExplicitFiles(relPaths) {
  const out = [];
  for (const rel of relPaths) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const stats = fs.lstatSync(full);
    if (stats.isSymbolicLink()) {
      skipped.push({ rel, reason: 'symlink' });
      continue;
    }
    if (stats.size > MAX_FILE_SIZE_BYTES) {
      skipped.push({ rel, reason: `exceeds ${MAX_FILE_SIZE_BYTES / 1024}KB hard ceiling` });
      continue;
    }
    out.push(full);
  }
  return out;
}

/** docs/*.md directly under docs/, non-recursive. */
function docsRootMarkdownFiles() {
  const dir = path.join(ROOT, 'docs');
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => path.join(dir, e.name));
}

function codeFence(content) {
  const runs = content.match(/`{3,}/g) || [];
  const maxLen = runs.reduce((m, s) => Math.max(m, s.length), 3);
  return '`'.repeat(maxLen + 1);
}

function langFor(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  const base = path.basename(absPath);
  if (EXTENSIONLESS_ALLOWLIST.has(base)) return 'text';
  return LANG_BY_EXT[ext] ?? '';
}

function renderFileBlock(absPath) {
  const rel = toPosix(path.relative(ROOT, absPath));
  const content = fs.readFileSync(absPath, 'utf8');
  const fence = codeFence(content);
  const lang = langFor(absPath);
  const block = `## \`${rel}\`\n\n${fence}${lang}\n${content}\n${fence}\n\n---\n\n`;
  return { rel, content, block };
}

function chunkSection(absFiles) {
  const rendered = absFiles.map((absPath) => {
    const { rel, block } = renderFileBlock(absPath);
    return { absPath, rel, block, size: Buffer.byteLength(block, 'utf8') };
  });

  const chunks = [];
  let current = { files: [], size: 0 };

  for (const f of rendered) {
    if (f.size > CHUNK_SOFT_CAP_BYTES) {
      if (current.files.length) {
        chunks.push(current);
        current = { files: [], size: 0 };
      }
      chunks.push({ files: [f], size: f.size, oversized: true });
      continue;
    }
    if (current.files.length && current.size + f.size > CHUNK_SOFT_CAP_BYTES) {
      chunks.push(current);
      current = { files: [], size: 0 };
    }
    current.files.push(f);
    current.size += f.size;
  }
  if (current.files.length) chunks.push(current);
  return chunks;
}

function chunkFileName(section, chunkIndex, totalChunks) {
  return totalChunks === 1
    ? `${section.id}-${section.slug}.md`
    : `${section.id}-${section.slug}--part${chunkIndex + 1}.md`;
}

// --- Section definitions ---

const ROOT_CONFIG_FILES = [
  'package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
  'tailwind.config.js', 'postcss.config.js', 'eslint.config.js', '.eslintrc.json',
  'firebase.json', '.firebaserc', 'firestore.rules', 'firestore.indexes.json', 'index.html',
  'CLAUDE.md', 'README.md', 'AI_Maintenance.md', 'AI_WORKFLOW.md', 'GEMINI.md', '.clinerules',
  'functions/package.json', 'functions/tsconfig.json', 'functions/tsconfig.dev.json',
  'functions/vitest.config.ts', 'functions/.eslintrc.js',
];

const SECTIONS = [
  { id: '01', title: 'Root Config & Manifest', slug: 'root-config-manifest', kind: 'explicit', targets: ROOT_CONFIG_FILES },
  { id: '02', title: 'src/lib', slug: 'src-lib', kind: 'dir', targets: ['src/lib'] },
  { id: '03', title: 'src/hooks + src/contexts', slug: 'src-hooks-contexts', kind: 'dir', targets: ['src/hooks', 'src/contexts'] },
  { id: '04', title: 'src/components', slug: 'src-components', kind: 'dir', targets: ['src/components'] },
  { id: '05', title: 'src/pages', slug: 'src-pages', kind: 'dir', targets: ['src/pages'] },
  { id: '06', title: 'src/data', slug: 'src-data', kind: 'dir', targets: ['src/data'] },
  { id: '07', title: 'src tests & setup', slug: 'src-tests-and-setup', kind: 'dir', targets: ['src/__tests__', 'src/test'] },
  { id: '08', title: 'functions/src (Cloud Functions)', slug: 'functions-src', kind: 'dir', targets: ['functions/src'] },
  { id: '09', title: 'docs (root, design, legal)', slug: 'docs-root', kind: 'docs-root', targets: ['docs/design', 'docs/legal'] },
  { id: '10', title: 'docs/specs', slug: 'docs-specs', kind: 'dir', targets: ['docs/specs'] },
  { id: '11', title: 'docs/projects', slug: 'docs-projects', kind: 'dir', targets: ['docs/projects'] },
  { id: '12', title: 'docs (prompts, templates, reports)', slug: 'docs-misc', kind: 'dir', targets: ['docs/prompts', 'docs/templates', 'docs/reports'] },
  { id: '13', title: 'docs-site (VitePress)', slug: 'docs-site', kind: 'dir', targets: ['docs-site'] },
  { id: '14', title: 'scripts', slug: 'scripts', kind: 'dir', targets: ['scripts', 'check_models.js', 'generate_icons.py', 'export_codebase.js'] },
];

function resolveSectionFiles(section) {
  if (section.kind === 'explicit') {
    return resolveExplicitFiles(section.targets);
  }
  if (section.kind === 'docs-root') {
    const files = [...docsRootMarkdownFiles()];
    for (const target of section.targets) {
      files.push(...walkDir(path.join(ROOT, target)));
    }
    return files;
  }
  // kind === 'dir': targets may be directories or individual files
  const files = [];
  for (const target of section.targets) {
    const full = path.join(ROOT, target);
    if (!fs.existsSync(full)) continue;
    const stats = fs.lstatSync(full);
    if (stats.isDirectory()) {
      files.push(...walkDir(full));
    } else if (stats.isFile()) {
      const rel = toPosix(path.relative(ROOT, full));
      if (isExcludedFile(rel, path.basename(full)) || !isIncludedByExtension(path.basename(full))) continue;
      files.push(full);
    }
  }
  return files;
}

function rootDriftCheck(model) {
  const accountedPrefixes = new Set();
  for (const section of SECTIONS) {
    for (const target of section.targets) {
      accountedPrefixes.add(target.split('/')[0]);
    }
  }
  for (const seg of EXCLUDED_SEGMENTS) accountedPrefixes.add(seg.split('/')[0]);
  for (const name of EXCLUDED_FILENAMES) accountedPrefixes.add(name);
  accountedPrefixes.add('llm-export');
  accountedPrefixes.add('docs'); // docs/* fully covered across sections 09-12

  const entries = fs.readdirSync(ROOT, { withFileTypes: true });
  const unrecognized = [];
  for (const entry of entries) {
    const name = entry.name;
    if (accountedPrefixes.has(name)) continue;
    if (name.startsWith('.')) continue; // dotfiles/dirs are tooling config, not source scope
    if (name.startsWith('export_') || name.startsWith('service-account')) continue;
    if (EXCLUDED_FILENAMES.has(name)) continue;
    const ext = path.extname(name).toLowerCase();
    if (EXCLUDED_EXTENSIONS.has(ext)) continue;
    if (entry.isFile() && !TEXT_EXTENSIONS.has(ext)) continue; // binary/unrecognized files
    unrecognized.push(name);
  }
  return unrecognized;
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const model = []; // { section, chunks: [{ fileName, files, size, oversized }] }

  for (const section of SECTIONS) {
    const absFiles = resolveSectionFiles(section);
    const chunks = chunkSection(absFiles);
    model.push({ section, chunks });
  }

  let totalFiles = 0;
  let totalBytes = 0;

  for (const { section, chunks } of model) {
    chunks.forEach((chunk, idx) => {
      const fileName = chunkFileName(section, idx, chunks.length);
      const header = `# ${section.title}${chunks.length > 1 ? ` (Part ${idx + 1} of ${chunks.length})` : ''} — MRT2 LLM Export\n\n` +
        `> Generated ${new Date().toISOString()} · Section ${section.id} \`${section.slug}\` · Chunk ${idx + 1}/${chunks.length}\n` +
        `> Files in this chunk: ${chunk.files.length} · Approx size: ${formatKB(chunk.size)}\n` +
        (chunk.oversized ? `> NOTE: this file alone exceeds the ~${CHUNK_SOFT_CAP_BYTES / 1024}KB chunk cap and is emitted as its own dedicated chunk rather than being split.\n` : '') +
        `\n---\n\n`;
      const body = chunk.files.map((f) => f.block).join('');
      fs.writeFileSync(path.join(OUT_DIR, fileName), header + body, 'utf8');

      totalFiles += chunk.files.length;
      totalBytes += chunk.size;
    });
  }

  const drift = rootDriftCheck(model);

  // --- Master index ---
  const lines = [];
  lines.push('# MRT2 LLM Export — Master Index');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  const totalChunks = model.reduce((n, m) => n + m.chunks.length, 0);
  lines.push(`Total chunks: ${totalChunks}   Total files included: ${totalFiles}   Total files skipped: ${skipped.length}`);
  lines.push('');
  lines.push('## How to use in NotebookLM');
  lines.push('Upload this file first for orientation, then upload the numbered chunk files as additional sources.');
  lines.push('');
  lines.push('## Chunk Manifest');
  for (const { section, chunks } of model) {
    if (chunks.length === 1) {
      const fileName = chunkFileName(section, 0, 1);
      lines.push(`### ${section.id} — ${section.title} (\`${fileName}\`) — ~${formatKB(chunks[0].size)}, ${chunks[0].files.length} files`);
      for (const f of chunks[0].files) lines.push(`- ${f.rel}`);
      lines.push('');
    } else {
      lines.push(`### ${section.id} — ${section.title} (${chunks.length} parts, ~${formatKB(chunks.reduce((s, c) => s + c.size, 0))} total, ${chunks.reduce((n, c) => n + c.files.length, 0)} files)`);
      chunks.forEach((chunk, idx) => {
        const fileName = chunkFileName(section, idx, chunks.length);
        lines.push(`#### Part ${idx + 1}/${chunks.length} (\`${fileName}\`) — ~${formatKB(chunk.size)}, ${chunk.files.length} files`);
        for (const f of chunk.files) lines.push(`- ${f.rel}`);
      });
      lines.push('');
    }
  }

  lines.push('## Section → Size Summary');
  lines.push('| Section | Files | Chunks | Approx Size |');
  lines.push('|---|---|---|---|');
  for (const { section, chunks } of model) {
    const files = chunks.reduce((n, c) => n + c.files.length, 0);
    const size = chunks.reduce((s, c) => s + c.size, 0);
    lines.push(`| ${section.slug} | ${files} | ${chunks.length} | ${formatKB(size)} |`);
  }
  lines.push('');

  lines.push('## Skipped Files (walked but rejected)');
  if (skipped.length === 0) {
    lines.push('_None._');
  } else {
    lines.push('| Path | Reason |');
    lines.push('|---|---|');
    for (const s of skipped) lines.push(`| ${s.rel} | ${s.reason} |`);
  }
  lines.push('');

  lines.push('## Excluded Directories (not walked at all)');
  lines.push('- `node_modules/`, `functions/node_modules/` — dependencies (manifest-only per package.json)');
  lines.push('- `dist/`, `dist-ssr/`, `functions/lib/` — build output');
  lines.push('- `public/` — binary marketing/icon assets, out of scope for this export');
  lines.push('- `docs-site/.vitepress/cache`, `docs-site/.vitepress/dist`, `docs-site/public/screenshots` — generated/binary');
  lines.push('- `docs/projects/archive` — stale archived specs');
  lines.push('- `.git/`, `coverage/`, `.firebase/`, `android-build/` — VCS/build/deploy artifacts');
  lines.push('');

  lines.push('## Root-Level Drift Check');
  if (drift.length === 0) {
    lines.push('_No unaccounted top-level entries found._');
  } else {
    lines.push('The following top-level repo entries are not covered by any section and not on the exclude list — review whether they should be added:');
    for (const d of drift) lines.push(`- ${d}`);
  }
  lines.push('');

  fs.writeFileSync(path.join(OUT_DIR, '00-MASTER-INDEX.md'), lines.join('\n'), 'utf8');

  console.log(`Export complete: ${totalFiles} files, ${totalChunks} chunks, ${formatKB(totalBytes)} written to llm-export/`);
  if (drift.length) {
    console.warn(`Warning: ${drift.length} unaccounted top-level entries — see Root-Level Drift Check in 00-MASTER-INDEX.md: ${drift.join(', ')}`);
  }
}

main();
