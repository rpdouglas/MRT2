import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const OUTPUT_FILE = 'project_codebase.txt';
const IGNORE_DIRS = [
  'node_modules', 
  '.git', 
  'dist', 
  'build', 
  '.vscode', 
  'coverage', 
  'public'
];
const INCLUDE_EXTS = [
  '.ts', 
  '.tsx', 
  '.js', 
  '.jsx', 
  '.css', 
  '.json',
  '.html' 
];
const IGNORE_FILES = [
  'package-lock.json',
  'yarn.lock',
  'project_codebase.txt',
  'export_codebase.js'
];

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
  console.log('🔍 Scanning project files...');
  
  try {
    const allFiles = getAllFiles(__dirname);
    let outputContent = `PROJECT EXPORT - ${new Date().toISOString()}\n\n`;

    const priorityFiles = allFiles.filter(f => f.includes('package.json') || f.includes('vite.config'));
    const otherFiles = allFiles.filter(f => !priorityFiles.includes(f));
    const sortedFiles = [...priorityFiles, ...otherFiles];

    console.log(`📝 Found ${sortedFiles.length} files. Writing to ${OUTPUT_FILE}...`);

    sortedFiles.forEach(filePath => {
      const relativePath = path.relative(__dirname, filePath);
      outputContent += `\n================================================================================\n`;
      outputContent += `FILE: ${relativePath}\n`;
      outputContent += `================================================================================\n`;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        outputContent += content + '\n';
      } catch (err) {
        outputContent += `[Error reading file: ${err.message}]\n`;
      }
    });

    fs.writeFileSync(OUTPUT_FILE, outputContent);
    console.log(`✅ Success! Codebase exported to: ${OUTPUT_FILE}`);
    console.log(`👉 Please upload this file to the chat.`);
    
  } catch (e) {
    console.error('❌ Error generating exports:', e);
  }
}

generateExport();