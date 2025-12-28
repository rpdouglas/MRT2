/**
 * GITHUB COMMENT:
 * [export_codebase.js]
 * IMPROVED: Added directory tree generation for structural context.
 * IMPROVED: Explicitly ignores auto-generated build manifests (build-info.json).
 * IMPROVED: Enhanced LLM-friendly separators.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname); 

// --- CONFIGURATION ---
const OUTPUT_FILE = 'project_codebase.txt';
const IGNORE_DIRS = [
  'node_modules', 
  '.git', 
  'dist', 
  'build', 
  '.vscode', 
  'coverage', 
  'public',
  'assets'
];
const INCLUDE_EXTS = [
  '.ts', 
  '.tsx', 
  '.js', 
  '.jsx', 
  '.css', 
  '.json',
  '.html',
  '.rules' // Added for Firebase Security Rules
];
const IGNORE_FILES = [
  'package-lock.json',
  'yarn.lock',
  'project_codebase.txt',
  'export_codebase.js',
  'build-info.json', // Ignore auto-generated hashes [cite: 147]
  '.env',
  '.env.local'
];

function generateTree(dir, prefix = '') {
  let tree = '';
  const files = fs.readdirSync(dir);
  
  files.forEach((file, index) => {
    const fullPath = path.join(dir, file);
    const isLast = index === files.length - 1;
    const stats = fs.statSync(fullPath);
    
    if (IGNORE_DIRS.includes(file) || IGNORE_FILES.includes(file)) return;

    tree += `${prefix}${isLast ? '└── ' : '├── '}${file}\n`;
    
    if (stats.isDirectory()) {
      tree += generateTree(fullPath, `${prefix}${isLast ? '    ' : '│   '}`);
    }
  });
  return tree;
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
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
  
  try {
    const allFiles = getAllFiles(rootDir);
    let outputContent = `PROJECT EXPORT - ${new Date().toISOString()}\n`;
    outputContent += `ENVIRONMENT: PRODUCTION_READY_V3.8\n\n`;

    outputContent += `### DIRECTORY STRUCTURE ###\n`;
    outputContent += generateTree(rootDir);
    outputContent += `\n\n### SOURCE FILES ###\n`;

    // Prioritize config files for context
    const priorityFiles = allFiles.filter(f => 
        f.includes('package.json') || 
        f.includes('vite.config') || 
        f.includes('firestore.rules') ||
        f.includes('theme.ts')
    );
    const otherFiles = allFiles.filter(f => !priorityFiles.includes(f));
    const sortedFiles = [...priorityFiles, ...otherFiles];

    sortedFiles.forEach(filePath => {
      const relativePath = path.relative(rootDir, filePath);
      outputContent += `\n--- START_FILE: ${relativePath} ---\n`;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        outputContent += content + '\n';
      } catch (err) {
        outputContent += `[Error reading file: ${err.message}]\n`;
      }
      outputContent += `--- END_FILE: ${relativePath} ---\n`;
    });

    fs.writeFileSync(path.join(rootDir, OUTPUT_FILE), outputContent);
    console.log(`✅ Success! Codebase exported to: ${OUTPUT_FILE}`);
    
  } catch (e) {
    console.error('❌ Error generating exports:', e);
  }
}

generateExport();