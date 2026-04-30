import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONTEXT SETUP ---
const __filename = fileURLToPath(import.meta.url);
const rootDir = process.cwd();

const MAX_FILE_SIZE_KB = 500;

// 1. Aggressive Path Ignores
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
  'package-lock.json', 'yarn.lock', 'export_codebase.js', 
  '.DS_Store', '.env', '.env.local'
];

const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.json',
  '.md', '.yml', '.yaml', '.xml', '.txt', '.rules', '.env.example',
  '.py', '.sh', '.cjs', '.mts'
]);

// --- MACRO PROFILES ---
const MACROS = {
  '--core': ['src/lib', 'src/hooks', 'src/data', 'src/__tests__', 'firebase.json', 'firestore.rules', 'package.json'],
  '--ui': ['src/components', 'src/pages', 'src/contexts', 'src/App.tsx'],
  '--docs': ['docs', 'docs-site']
};

function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return false;
  if (!ext) return false; 
  return true; 
}

function shouldIgnorePath(relativePath, fileName) {
  if (ALWAYS_IGNORE_FILES.includes(fileName) || fileName.startsWith('export_')) return true;
  
  const normalizedPath = relativePath.replace(/\\/g, '/');
  for (const ignore of AGGRESSIVE_IGNORE_PATHS) {
    const escapedIgnore = ignore.replace(/\./g, '\\.');
    const regex = new RegExp(`(^|/)${escapedIgnore}(/|$)`);
    if (regex.test(normalizedPath)) return true;
  }
  return false;
}

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
        if (currentDepth === 0 && targets && !targets.includes(file)) continue; 
        yield* walkSync(fullPath, targets, currentDepth + 1);
      } else {
        if (currentDepth === 0 && targets && !targets.includes(file) && !targets.includes(relativePath)) continue;
        yield fullPath;
      }
    }
  } catch (e) {
    console.warn(`Could not access ${dir}: ${e.message}`);
  }
}

async function runExport() {
  let userTargets = process.argv.slice(2);
  
  // Resolve Macros
  if (userTargets.length === 1 && MACROS[userTargets[0]]) {
      userTargets = MACROS[userTargets[0]];
  }

  const isTargetedRun = userTargets.length > 0;
  if (!isTargetedRun) {
      console.log("❌ Error: Please provide targets or a macro (e.g., node export_codebase.js --core)");
      return;
  }
  
  console.log(`🚀 Starting Context Export (v5.0.0)...`);
  console.log(`🎯 Targeting: ${userTargets.join(', ')}`);
  
  let filesToProcess = [];
  
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

  // Dynamic Output Naming
  const safeNames = userTargets.map(t => t.replace(/[/\\:]/g, '_')).slice(0, 3).join('-');
  const outputFile = `export_${safeNames}.txt`;

  const writeStream = fs.createWriteStream(path.join(rootDir, outputFile), { flags: 'w' });
  
  writeStream.write(`CONTEXT EXPORT - ${new Date().toISOString()}\n`);
  writeStream.write(`Mode: Targeted (${userTargets.join(', ')})\n\n`);
  
  // Create Table of Contents
  writeStream.write(`### TABLE OF CONTENTS ###\n`);
  const validFiles = [];
  
  for (const filePath of filesToProcess) {
    const relativePath = path.relative(rootDir, filePath);
    if (shouldIgnorePath(relativePath, path.basename(filePath))) continue;
    if (isBinaryFile(filePath)) continue;
    const stats = fs.statSync(filePath);
    if ((stats.size / 1024) > MAX_FILE_SIZE_KB) continue;
    
    validFiles.push({ path: filePath, rel: relativePath });
    writeStream.write(`- ${relativePath}\n`);
  }

  writeStream.write(`\n### FILE CONTENTS ###\n`);

  let totalChars = 0;

  for (const fileObj of validFiles) {
    try {
      const content = fs.readFileSync(fileObj.path, 'utf8');
      writeStream.write(`\n<file path="${fileObj.rel}">\n`);
      writeStream.write(content);
      writeStream.write(`\n</file>\n`);
      totalChars += content.length;
    } catch (err) {
      console.warn(`Failed to read: ${fileObj.rel}`);
    }
  }

  writeStream.end();

  console.log('\n=============================================');
  console.log(`✅ Export Complete: ${outputFile}`);
  console.log(`📊 Stats:`);
  console.log(`   - Files Included: ${validFiles.length}`);
  console.log(`   - Est. Tokens: ~${Math.ceil(totalChars / 4).toLocaleString()}`);
  console.log('=============================================\n');
}

runExport();