import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.cwd();

// Default values if export_config.json is missing
const DEFAULT_CONFIG = {
  maxChunkSizeBytes: 1024 * 1024, // 1MB
  ignorePaths: [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".firebase",
    "exports"
  ],
  ignoreFiles: [
    "package-lock.json",
    "yarn.lock",
    ".DS_Store",
    "mrt-release.keystore",
    "export_codebase.js",
    "export_config.json",
    "docs_dump.txt"
  ],
  groups: {
    "frontend_core": [
      "src/lib",
      "src/hooks",
      "src/data",
      "src/contexts"
    ],
    "frontend_ui": [
      "src/components",
      "src/pages",
      "src/App.tsx",
      "src/main.tsx",
      "src/App.css",
      "src/index.css"
    ],
    "backend": [
      "functions/src",
      "functions/package.json"
    ],
    "docs": [
      "docs",
      "docs-site",
      "README.md",
      "GEMINI.md",
      "CLAUDE.md",
      "AI_Maintenance.md",
      "AI_WORKFLOW.md"
    ],
    "configs": [
      "package.json",
      "tailwind.config.js",
      "firestore.rules",
      "firestore.indexes.json",
      "firebase.json",
      "tsconfig.json",
      "eslint.config.js",
      "tsconfig.app.json",
      "tsconfig.node.json",
      "vite.config.ts"
    ]
  }
};

const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.sass', '.less', '.json',
  '.md', '.yml', '.yaml', '.xml', '.txt', '.rules', '.py', '.sh', '.cjs', '.mts', '.mjs',
  '.jsonld', '.svg', '.config', '.gitignore', '.clinerules', '.eslintrc', '.firebaserc',
  '.env', '.env.example', '.env.production', '.env.local'
]);

function isTextFile(filePath) {
  const fileName = path.basename(filePath);
  if (fileName.startsWith('.')) {
    if (TEXT_EXTENSIONS.has(fileName.toLowerCase())) return true;
  }
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  return false;
}

function getFileGroup(relativePath, groups) {
  const normPath = relativePath.replace(/\\/g, '/');
  for (const [groupName, paths] of Object.entries(groups)) {
    for (const p of paths) {
      const normP = p.replace(/\\/g, '/');
      if (normPath === normP || normPath.startsWith(normP + '/')) {
        return groupName;
      }
    }
  }
  return 'unclassified';
}

function getFilesRecursively(dir, rootDir, ignorePaths, ignoreFiles, allFiles = []) {
  let items = [];
  try {
    items = fs.readdirSync(dir);
  } catch (e) {
    console.warn(`⚠️ Could not read directory ${dir}: ${e.message}`);
    return allFiles;
  }
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
    
    if (ignoreFiles.includes(item)) continue;
    if (item.startsWith('.env') && item !== '.env.example') continue;

    let stats;
    try {
      stats = fs.lstatSync(fullPath);
    } catch (e) {
      continue;
    }
    
    if (stats.isSymbolicLink()) continue;
    
    if (stats.isDirectory()) {
      const shouldIgnoreDir = ignorePaths.some(ip => {
        const normIp = ip.replace(/\\/g, '/');
        return relPath === normIp || 
               relPath.startsWith(normIp + '/') || 
               relPath.includes('/' + normIp + '/') || 
               relPath.endsWith('/' + normIp);
      });
      if (shouldIgnoreDir) continue;
      
      getFilesRecursively(fullPath, rootDir, ignorePaths, ignoreFiles, allFiles);
    } else if (stats.isFile()) {
      if (isTextFile(fullPath)) {
        allFiles.push({
          abs: fullPath,
          rel: relPath,
          sizeBytes: stats.size
        });
      }
    }
  }
  return allFiles;
}

// Tree logic
function buildTree(files) {
  const tree = {};
  for (const file of files) {
    const parts = file.rel.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast) {
        current[part] = { __leaf: true, file };
      } else {
        if (!current[part] || current[part].__leaf) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  return tree;
}

function renderTree(tree, prefix = '') {
  let result = '';
  const keys = Object.keys(tree).filter(k => k !== '__leaf').sort((a, b) => {
    const aIsDir = !tree[a].__leaf;
    const bIsDir = !tree[b].__leaf;
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const isLast = i === keys.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    
    const node = tree[key];
    if (node.__leaf) {
      const chunkName = node.file.chunkName || 'none';
      result += `${prefix}${connector}${key} *(→ ${chunkName})*\n`;
    } else {
      result += `${prefix}${connector}${key}/\n`;
      result += renderTree(node, prefix + childPrefix);
    }
  }
  return result;
}

function runExport() {
  console.log('🚀 Initializing Codebase Exporter...');
  
  // 1. Load config
  let config = DEFAULT_CONFIG;
  const configPath = path.join(rootDir, 'export_config.json');
  if (fs.existsSync(configPath)) {
    try {
      const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = {
        maxChunkSizeBytes: customConfig.maxChunkSizeBytes ?? DEFAULT_CONFIG.maxChunkSizeBytes,
        ignorePaths: customConfig.ignorePaths ?? DEFAULT_CONFIG.ignorePaths,
        ignoreFiles: customConfig.ignoreFiles ?? DEFAULT_CONFIG.ignoreFiles,
        groups: customConfig.groups ?? DEFAULT_CONFIG.groups
      };
      console.log('📖 Loaded configuration from export_config.json');
    } catch (e) {
      console.warn(`⚠️ Failed to parse export_config.json: ${e.message}. Using default presets.`);
    }
  } else {
    console.log('📖 Configuration file not found. Using default presets.');
  }

  const exportsDir = path.join(rootDir, 'exports');
  
  // 2. Setup exports directory
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
    console.log('📁 Created /exports directory');
  } else {
    // Clear previous export files in /exports
    const oldFiles = fs.readdirSync(exportsDir);
    for (const file of oldFiles) {
      try {
        fs.unlinkSync(path.join(exportsDir, file));
      } catch (err) {
        // Skip directory or failed delete
      }
    }
    console.log('🧹 Cleared previous export files in /exports');
  }

  // 3. Update .gitignore
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.split('\n').some(line => line.trim() === '/exports')) {
      fs.appendFileSync(gitignorePath, '\n# Codebase export output\n/exports/\n', 'utf8');
      console.log('📝 Added /exports/ to .gitignore');
    }
  }

  // 4. Crawl all codebase files
  console.log('🔍 Crawling codebase files...');
  const allFiles = getFilesRecursively(rootDir, rootDir, config.ignorePaths, config.ignoreFiles);
  console.log(`📁 Found ${allFiles.length} potential text files to export.`);

  // 5. Group files
  const groupedFiles = {};
  for (const groupName of Object.keys(config.groups)) {
    groupedFiles[groupName] = [];
  }
  groupedFiles['unclassified'] = [];

  for (const file of allFiles) {
    const groupName = getFileGroup(file.rel, config.groups);
    groupedFiles[groupName].push(file);
  }

  // 6. Write chunks
  console.log('💾 Writing logical chunks...');
  const chunkSummaries = [];
  const exportTime = new Date().toISOString();

  for (const groupName of Object.keys(groupedFiles)) {
    const files = groupedFiles[groupName];
    if (files.length === 0) continue;

    console.log(`📦 Processing group: ${groupName} (${files.length} files)...`);
    let tempChunks = [];
    let currentChunkText = '';

    for (const file of files) {
      let fileContent = '';
      try {
        fileContent = fs.readFileSync(file.abs, 'utf8');
      } catch (e) {
        console.warn(`⚠️ Failed to read file ${file.rel}: ${e.message}`);
        continue;
      }

      // Add line numbers and estimate characteristics
      const lines = fileContent.split('\n');
      file.linesCount = lines.length;
      file.charCount = fileContent.length;
      file.tokenEstimate = Math.ceil(fileContent.length / 4);

      const fileBlock = `<file path="${file.rel}">\n${fileContent}\n</file>\n\n`;
      const fileBlockBytes = Buffer.byteLength(fileBlock, 'utf8');

      if (currentChunkText.length > 0 && Buffer.byteLength(currentChunkText, 'utf8') + fileBlockBytes > config.maxChunkSizeBytes) {
        tempChunks.push(currentChunkText);
        currentChunkText = '';
      }

      file.tempChunkIndex = tempChunks.length;
      currentChunkText += fileBlock;
    }

    if (currentChunkText.length > 0) {
      tempChunks.push(currentChunkText);
    }

    // Write chunks and record mappings
    if (tempChunks.length === 1) {
      const fileName = `export_${groupName}.txt`;
      const fullPath = path.join(exportsDir, fileName);
      fs.writeFileSync(fullPath, tempChunks[0], 'utf8');
      
      let groupCharCount = 0;
      let groupLineCount = 0;
      for (const file of files) {
        file.chunkName = fileName;
        groupCharCount += file.charCount || 0;
        groupLineCount += file.linesCount || 0;
      }
      
      chunkSummaries.push({
        fileName,
        groupName,
        sizeBytes: Buffer.byteLength(tempChunks[0], 'utf8'),
        fileCount: files.length,
        linesCount: groupLineCount,
        tokenEstimate: Math.ceil(groupCharCount / 4)
      });
    } else {
      for (let i = 0; i < tempChunks.length; i++) {
        const fileName = `export_${groupName}_part${i + 1}.txt`;
        const fullPath = path.join(exportsDir, fileName);
        fs.writeFileSync(fullPath, tempChunks[i], 'utf8');
        
        let chunkCharCount = 0;
        let chunkLineCount = 0;
        let chunkFileCount = 0;
        
        for (const file of files) {
          if (file.tempChunkIndex === i) {
            file.chunkName = fileName;
            chunkCharCount += file.charCount || 0;
            chunkLineCount += file.linesCount || 0;
            chunkFileCount++;
          }
        }
        
        chunkSummaries.push({
          fileName,
          groupName: `${groupName} (part ${i + 1})`,
          sizeBytes: Buffer.byteLength(tempChunks[i], 'utf8'),
          fileCount: chunkFileCount,
          linesCount: chunkLineCount,
          tokenEstimate: Math.ceil(chunkCharCount / 4)
        });
      }
    }
  }

  // 7. Generate Reference Map (codebase_map.md)
  console.log('🗺️ Generating reference map (codebase_map.md)...');
  const treeStructure = buildTree(allFiles);
  const asciiTree = renderTree(treeStructure);

  const totalFiles = allFiles.length;
  const totalChunks = chunkSummaries.length;
  const totalSizeBytes = chunkSummaries.reduce((acc, c) => acc + c.sizeBytes, 0);
  const totalEstimatedTokens = chunkSummaries.reduce((acc, c) => acc + c.tokenEstimate, 0);
  const totalLines = chunkSummaries.reduce((acc, c) => acc + c.linesCount, 0);

  let mapContent = `# Codebase Export Reference Map

Generated on: \`${exportTime}\`
This reference guide details the contents and structure of the exported logical chunks in the \`/exports\` directory. Loading this map along with the chunk files provides LLMs and NotebookLM with a clear index for search, retrieval, and code review.

---

## 1. Export Overview & Statistics

| Metric | Value |
| :--- | :--- |
| **Total Exported Files** | ${totalFiles} |
| **Total Generated Chunks** | ${totalChunks} |
| **Total Code/Text Lines** | ${totalLines.toLocaleString()} |
| **Total Export Size** | ${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB (${totalSizeBytes.toLocaleString()} bytes) |
| **Estimated Total Tokens** | ${totalEstimatedTokens.toLocaleString()} |

---

## 2. Export Chunks Summary

| Chunk File Name | Domain Group | Size (KB) | Files Included | Lines of Code | Est. Tokens |
| :--- | :--- | :--- | :--- | :--- | :--- |
${chunkSummaries.map(c => `| [\`${c.fileName}\`](file:///workspaces/MRT2/exports/${c.fileName}) | \`${c.groupName}\` | ${(c.sizeBytes / 1024).toFixed(1)} KB | ${c.fileCount} | ${c.linesCount.toLocaleString()} | ${c.tokenEstimate.toLocaleString()} |`).join('\n')}

---

## 3. Visual Directory Tree

Below is the directory tree of all files included in this export. Files are annotated with the specific chunk file containing their content.

\`\`\`
.
${asciiTree}\`\`\`

---

## 4. Alphabetical File Index

Use this index to find exactly which chunk file contains the source code for any file in the workspace.

| File Path | Target Chunk | Lines | Size (KB) | Est. Tokens |
| :--- | :--- | :--- | :--- | :--- |
${allFiles.sort((a, b) => a.rel.localeCompare(b.rel)).map(f => `| [\`${f.rel}\`](file:///workspaces/MRT2/${f.rel}) | [\`${f.chunkName}\`](file:///workspaces/MRT2/exports/${f.chunkName}) | ${f.linesCount ?? 0} | ${((f.sizeBytes ?? 0) / 1024).toFixed(1)} KB | ${(f.tokenEstimate ?? 0).toLocaleString()} |`).join('\n')}
`;

  fs.writeFileSync(path.join(exportsDir, 'codebase_map.md'), mapContent, 'utf8');

  console.log('\n==================================================');
  console.log(`✅ Export Complete! Outputs written to /exports/`);
  console.log(`📊 Stats:`);
  console.log(`   - Files Exported: ${totalFiles}`);
  console.log(`   - Chunks Written: ${totalChunks}`);
  console.log(`   - Total Size: ${(totalSizeBytes / 1024).toFixed(1)} KB (~${(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`   - Est. Tokens: ~${totalEstimatedTokens.toLocaleString()}`);
  console.log(`   - Reference Map: /exports/codebase_map.md`);
  console.log('==================================================\n');
}

runExport();