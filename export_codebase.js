/**
 * GITHUB COMMENT:
 * [export_codebase.js]
 * ARCHITECTURAL EDITION (v3.0 - Deep Dive)
 * REFACTOR: Switched to WriteStreams to prevent V8 Heap Out of Memory errors on large repos.
 * SAFETY: Added Symlink detection to prevent infinite recursion loops.
 * FEATURE: Heuristic Binary File detection (checks buffer) to prevent garbage output.
 * FORMAT: optimized for LLM parsing (XML-style tagging).
 * UPGRADE: Auto-detects and respects .gitignore if present (basic parsing).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONTEXT SETUP ---
const __filename = fileURLToPath(import.meta.url);
const rootDir = process.cwd();

// --- CONFIGURATION ---
const OUTPUT_FILE = 'project_codebase.txt';
const MAX_FILE_SIZE_KB = 1024; // 1MB limit per file

// Global Ignore List (Base defaults)
const ALWAYS_IGNORE_DIRS = [
  'node_modules', '.git', 'dist', 'build', '.vscode', 'coverage', 
  '.firebase', '.github', '.idea', '__pycache__'
];

const ALWAYS_IGNORE_FILES = [
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
  OUTPUT_FILE, 'export_codebase.js', '.DS_Store', '.env', '.env.local',
  'thumbs.db'
];

// Extensions we explicitly WANT to read as text
const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json',
  '.md', '.yml', '.yaml', '.xml', '.txt', '.rules', '.env.example',
  '.sql', '.graphql', '.py', '.rb', '.java', '.c', '.cpp', '.h'
]);

// --- UTILITIES ---

// 1. Gitignore Parser (Basic)
function loadGitIgnore() {
  const gitIgnorePath = path.join(rootDir, '.gitignore');
  if (!fs.existsSync(gitIgnorePath)) return [];
  
  const content = fs.readFileSync(gitIgnorePath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.replace(/\/$/, '')); // Remove trailing slashes
}

// 2. Binary Detection (Heuristic)
function isBinaryFile(filePath) {
  // First check extension whitelist (fastest)
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return false;

  // If unknown extension, check the first 512 bytes for null bytes
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(512);
    const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
    fs.closeSync(fd);
    
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true; // Null byte indicates binary
    }
    return false;
  } catch (error) {
    return true; // Treat unreadable as binary
  }
}

// 3. Tree Generator (Recursive)
function generateTree(dir, prefix = '', ignoreList) {
  let tree = '';
  try {
    const files = fs.readdirSync(dir);
    // Filter out ignored items for the tree view to keep it clean
    const visibleFiles = files.filter(f => !ignoreList.includes(f) && !ALWAYS_IGNORE_DIRS.includes(f));
    
    visibleFiles.forEach((file, index) => {
      const fullPath = path.join(dir, file);
      const isLast = index === visibleFiles.length - 1;
      
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch (e) { return; } // Skip broken links

      tree += `${prefix}${isLast ? '└── ' : '├── '}${file}\n`;
      
      if (stats.isDirectory()) {
        tree += generateTree(fullPath, `${prefix}${isLast ? '    ' : '│   '}`, ignoreList);
      }
    });
  } catch (e) {
    return `[Error reading tree]\n`;
  }
  return tree;
}

// 4. File Walker (Recursive with Symlink protection)
function *walkSync(dir, ignoreList, visited = new Set()) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      if (ALWAYS_IGNORE_DIRS.includes(file) || ALWAYS_IGNORE_FILES.includes(file) || ignoreList.includes(file)) continue;
      
      const fullPath = path.join(dir, file);
      
      let stats;
      try {
        stats = fs.lstatSync(fullPath); // Use lstat to detect symlinks
      } catch (err) { continue; }

      if (stats.isSymbolicLink()) continue; // SKIP SYMLINKS to prevent recursion

      if (stats.isDirectory()) {
        if (!visited.has(fullPath)) {
          visited.add(fullPath);
          yield* walkSync(fullPath, ignoreList, visited);
        }
      } else {
        yield fullPath;
      }
    }
  } catch (e) {
    console.warn(`Could not access ${dir}: ${e.message}`);
  }
}

// --- MAIN EXECUTION ---

async function runExport() {
  console.log('🚀 Starting Deep Dive Codebase Export...');
  const writeStream = fs.createWriteStream(path.join(rootDir, OUTPUT_FILE), { flags: 'w' });
  
  // Load ignores
  const gitIgnores = loadGitIgnore();
  const allIgnores = [...gitIgnores]; // Combined list could be expanded here

  // Header
  writeStream.write(`PROJECT EXPORT - ${new Date().toISOString()}\n`);
  writeStream.write(`Note: Binary files and strictly ignored directories are excluded.\n\n`);

  // Write Tree
  console.log('🌳 Generating Directory Tree...');
  writeStream.write(`### PROJECT STRUCTURE ###\n`);
  writeStream.write(generateTree(rootDir, '', allIgnores));
  writeStream.write(`\n\n### FILE CONTENTS ###\n`);

  let fileCount = 0;
  let skippedCount = 0;
  let totalChars = 0;

  console.log('📝 Reading files and streaming to output...');

  for (const filePath of walkSync(rootDir, allIgnores)) {
    const relativePath = path.relative(rootDir, filePath);
    
    // Size Check
    const stats = fs.statSync(filePath);
    const fileSizeKB = stats.size / 1024;
    
    if (fileSizeKB > MAX_FILE_SIZE_KB) {
      writeStream.write(`\n\n`);
      skippedCount++;
      continue;
    }

    // Binary Check
    if (isBinaryFile(filePath)) {
      // writeStream.write(`\n\n`); 
      // Commented out to reduce noise, uncomment if you want a record of binary files
      continue;
    }

    // Write File Content
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // XML Format is often better for LLM context distinction
      writeStream.write(`\n<file path="${relativePath}">\n`);
      writeStream.write(content);
      writeStream.write(`\n</file>\n`);
      
      fileCount++;
      totalChars += content.length;
      
      // Progress indicator every 50 files
      if (fileCount % 50 === 0) process.stdout.write('.');

    } catch (err) {
      writeStream.write(`\n\n`);
    }
  }

  writeStream.end();

  console.log('\n\n=============================================');
  console.log(`✅ Export Complete: ${OUTPUT_FILE}`);
  console.log(`📊 Stats:`);
  console.log(`   - Files Included: ${fileCount}`);
  console.log(`   - Large Files Skipped: ${skippedCount}`);
  console.log(`   - Est. Tokens: ~${Math.ceil(totalChars / 4).toLocaleString()}`);
  console.log('=============================================\n');
}

runExport();