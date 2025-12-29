/**
 * GITHUB COMMENT:
 * [export_codebase.js]
 * ARCHITECTURAL EDITION (v2.0)
 * FIX: 'rootDir' now correctly resolves to CWD when run from root.
 * UPGRADE: Includes CI/CD (.yml) and Documentation (.md) for full context.
 * UPGRADE: Adds Token Estimator to manage LLM Context Window limits.
 * UPGRADE: Adds 'Large File Warning' to prevent token waste.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. PATH FIX: Assume script is run from root ---
const rootDir = process.cwd(); 

// --- CONFIGURATION ---
const OUTPUT_FILE = 'project_codebase.txt';
const MAX_FILE_SIZE_KB = 500; // Skip massive files (e.g., package-lock.json)

// Directories to completely ignore
const IGNORE_DIRS = [
  'node_modules', '.git', 'dist', 'build', '.vscode', 'coverage', 'assets', '.firebase', '.github/actions' // Keep workflows, ignore actions if generic
];

// Extensions to include (Added .md, .yml, .yaml for CI/CD & Docs)
const INCLUDE_EXTS = [
  '.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.html', '.rules', 
  '.md', '.yml', '.yaml' 
];

// Specific files to ignore
const IGNORE_FILES = [
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'project_codebase.txt', 'export_codebase.js',
  'build-info.json', '.DS_Store', '.env', '.env.local',
  'logo.png', 'favicon.ico'
];

// --- UTILITIES ---

// Rough token estimator (1 token ~= 4 chars)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function generateTree(dir, prefix = '') {
  let tree = '';
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach((file, index) => {
      const fullPath = path.join(dir, file);
      const isLast = index === files.length - 1;
      
      // Skip ignored directories/files immediately for tree clarity
      if (IGNORE_DIRS.includes(file) || IGNORE_FILES.includes(file)) return;

      const stats = fs.statSync(fullPath);
      tree += `${prefix}${isLast ? '└── ' : '├── '}${file}\n`;
      
      if (stats.isDirectory()) {
        tree += generateTree(fullPath, `${prefix}${isLast ? '    ' : '│   '}`);
      }
    });
  } catch (e) {
    return `[Error reading tree for ${dir}]\n`;
  }
  return tree;
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    const stats = fs.statSync(fullPath);

    if (IGNORE_DIRS.includes(file)) return;

    if (stats.isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      const ext = path.extname(file);
      if (INCLUDE_EXTS.includes(ext) && !IGNORE_FILES.includes(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function generateExport() {
  console.log('🔍 Architectural Scan starting...');
  console.log(`📂 Scanning Root: ${rootDir}`);
  
  let totalTokens = 0;
  let skippedFiles = 0;

  try {
    const allFiles = getAllFiles(rootDir);
    let outputContent = `PROJECT EXPORT - ${new Date().toISOString()}\n`;
    outputContent += `ENVIRONMENT: PRODUCTION_READY_V4.8 (Architectural Edition)\n`;
    outputContent += `NOTE: Includes Source Code, CI/CD Workflows, and Documentation.\n\n`;

    outputContent += `### DIRECTORY STRUCTURE ###\n`;
    outputContent += generateTree(rootDir);
    outputContent += `\n\n### SOURCE FILES ###\n`;

    // Priority Sort: Configs -> Docs -> CI/CD -> Code
    const priorityFiles = allFiles.filter(f => 
        f.includes('package.json') || 
        f.includes('vite.config') || 
        f.includes('firestore.rules') ||
        f.includes('deploy.yml') ||
        f.endsWith('.md')
    );
    const otherFiles = allFiles.filter(f => !priorityFiles.includes(f));
    const sortedFiles = [...priorityFiles, ...otherFiles];

    sortedFiles.forEach(filePath => {
      const relativePath = path.relative(rootDir, filePath);
      const stats = fs.statSync(filePath);
      const fileSizeKB = stats.size / 1024;

      if (fileSizeKB > MAX_FILE_SIZE_KB) {
        console.warn(`⚠️ Skipping Large File: ${relativePath} (${fileSizeKB.toFixed(2)} KB)`);
        outputContent += `\n--- SKIPPED LARGE FILE: ${relativePath} (${fileSizeKB.toFixed(2)} KB) ---\n`;
        skippedFiles++;
        return;
      }

      outputContent += `\n--- START_FILE: ${relativePath} ---\n`;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        outputContent += content + '\n';
        totalTokens += estimateTokens(content);
      } catch (err) {
        outputContent += `[Error reading file: ${err.message}]\n`;
      }
      outputContent += `--- END_FILE: ${relativePath} ---\n`;
    });

    const outputPath = path.join(rootDir, OUTPUT_FILE);
    fs.writeFileSync(outputPath, outputContent);
    
    console.log('\n=============================================');
    console.log(`✅ Success! Export generated at: ${OUTPUT_FILE}`);
    console.log(`📊 Stats:`);
    console.log(`   - Files Processed: ${sortedFiles.length - skippedFiles}`);
    console.log(`   - Files Skipped:   ${skippedFiles}`);
    console.log(`   - Est. Context:    ~${totalTokens.toLocaleString()} tokens`);
    console.log('=============================================\n');
    
  } catch (e) {
    console.error('❌ Error generating exports:', e);
  }
}

generateExport();