/**
 * GITHUB COMMENT:
 * [export_codebase.js]
 * CONTEXT MANAGEMENT EDITION (v4.0.1)
 * FIX: Updated ignore logic to prevent partial string matches (e.g., '.git' blocking '.github').
 * UPGRADE: Implemented CLI targeting. E.g., `node export_codebase.js src/components`
 * UPGRADE: Implemented strict Whitelisting. Default run only targets root files, src, docs, docs-site, and .github.
 * FIX: Added aggressive path-based ignores to block massive cache directories like .vitepress/cache.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONTEXT SETUP ---
const __filename = fileURLToPath(import.meta.url);
const rootDir = process.cwd();

// --- CONFIGURATION ---
const OUTPUT_FILE = 'project_codebase.txt';
const MAX_FILE_SIZE_KB = 500; // Lowered to 500kb to prevent silent bloat

// 1. Target Defaults (If no CLI arguments are provided)
const DEFAULT_TARGET_DIRS = ['src', 'docs', 'docs-site', '.github'];
const INCLUDE_ROOT_FILES = true; 

// 2. Aggressive Path Ignores (Matches against the relative path)
const AGGRESSIVE_IGNORE_PATHS = [
  '.vitepress/cache',
  '.vitepress/dist',
  'node_modules',
  '.git',
  'dist',
  'build',
  'public/Marketing',
  'coverage',
  '.firebase'
];

const ALWAYS_IGNORE_FILES = [
  'package-lock.json', 'yarn.lock', OUTPUT_FILE, 'export_codebase.js', 
  '.DS_Store', '.env', '.env.local'
];

const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json',
  '.md', '.yml', '.yaml', '.xml', '.txt', '.rules', '.env.example',
  '.py', '.sh', '.cjs', '.mts'
]);

// --- UTILITIES ---

function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return false;
  if (!ext) return false; // allow extensionless files like Dockerfile
  return true; // Aggressive binary exclusion based on whitelist
}

function shouldIgnorePath(relativePath, fileName) {
  if (ALWAYS_IGNORE_FILES.includes(fileName)) return true;
  
  const normalizedPath = relativePath.replace(/\\/g, '/');
  for (const ignore of AGGRESSIVE_IGNORE_PATHS) {
    // Use path boundaries to prevent partial matches (e.g., '.git' matching '.github')
    // Escape dots in the ignore string so they are treated as literal dots
    const escapedIgnore = ignore.replace(/\./g, '\\.');
    const regex = new RegExp(`(^|/)${escapedIgnore}(/|$)`);
    
    if (regex.test(normalizedPath)) return true;
  }
  return false;
}

// 4. File Walker (Yields relative paths)
function *walkSync(dir, targets = null, currentDepth = 0) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const relativePath = path.relative(rootDir, fullPath);
      
      if (shouldIgnorePath(relativePath, file)) continue;

      let stats;
      try { stats = fs.lstatSync(fullPath); } catch (err) { continue; }
      if (stats.isSymbolicLink()) continue;

      if (stats.isDirectory()) {
        // If we are at the root level, and we have targets, enforce the whitelist
        if (currentDepth === 0 && targets && !targets.includes(file)) {
           continue; 
        }
        yield* walkSync(fullPath, targets, currentDepth + 1);
      } else {
        // If we are at root level, and we have targets, but INCLUDE_ROOT_FILES is false, skip.
        if (currentDepth === 0 && targets && !INCLUDE_ROOT_FILES) {
            continue;
        }
        yield fullPath;
      }
    }
  } catch (e) {
    console.warn(`Could not access ${dir}: ${e.message}`);
  }
}

// --- MAIN EXECUTION ---

async function runExport() {
  // Parse CLI Arguments (Skip node executable and script name)
  const userTargets = process.argv.slice(2);
  const isTargetedRun = userTargets.length > 0;
  
  console.log(`🚀 Starting Codebase Export (v4.0.1)...`);
  
  let filesToProcess = [];

  if (isTargetedRun) {
    console.log(`🎯 Targeted mode active. Scanning: ${userTargets.join(', ')}`);
    for (const target of userTargets) {
      const fullTargetPath = path.join(rootDir, target);
      if (!fs.existsSync(fullTargetPath)) {
          console.warn(`⚠️ Target not found: ${target}`);
          continue;
      }
      const stats = fs.statSync(fullTargetPath);
      if (stats.isDirectory()) {
          filesToProcess.push(...Array.from(walkSync(fullTargetPath, null, 1)));
      } else {
          filesToProcess.push(fullTargetPath);
      }
    }
  } else {
    console.log(`🌐 Full Context mode active. Scanning Defaults + Root files...`);
    filesToProcess = Array.from(walkSync(rootDir, DEFAULT_TARGET_DIRS));
  }

  const writeStream = fs.createWriteStream(path.join(rootDir, OUTPUT_FILE), { flags: 'w' });
  
  writeStream.write(`PROJECT EXPORT - ${new Date().toISOString()}\n`);
  writeStream.write(`Mode: ${isTargetedRun ? 'Targeted (' + userTargets.join(', ') + ')' : 'Default Whitelist'}\n\n`);
  writeStream.write(`### FILE CONTENTS ###\n`);

  let fileCount = 0;
  let skippedCount = 0;
  let totalChars = 0;

  for (const filePath of filesToProcess) {
    const relativePath = path.relative(rootDir, filePath);
    
    // Safety Checks
    if (shouldIgnorePath(relativePath, path.basename(filePath))) continue;
    if (isBinaryFile(filePath)) continue;

    const stats = fs.statSync(filePath);
    if ((stats.size / 1024) > MAX_FILE_SIZE_KB) {
      skippedCount++;
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      writeStream.write(`\n<file path="${relativePath}">\n`);
      writeStream.write(content);
      writeStream.write(`\n</file>\n`);
      
      fileCount++;
      totalChars += content.length;
    } catch (err) {
      console.warn(`Failed to read: ${relativePath}`);
    }
  }

  writeStream.end();

  console.log('\n=============================================');
  console.log(`✅ Export Complete: ${OUTPUT_FILE}`);
  console.log(`📊 Stats:`);
  console.log(`   - Files Included: ${fileCount}`);
  console.log(`   - Large Files Skipped: ${skippedCount}`);
  console.log(`   - Est. Tokens: ~${Math.ceil(totalChars / 4).toLocaleString()}`);
  console.log('=============================================\n');
}

runExport();