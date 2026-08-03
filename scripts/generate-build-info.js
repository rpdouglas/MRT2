// scripts/generate-build-info.js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(SRC_DIR, 'build-info.json');
const CHANGELOG_FILE = path.join(__dirname, '../docs-site/support/changelog.md');
const PACKAGE_JSON_FILE = path.join(__dirname, '../package.json');

// The changelog (docs-site/support/changelog.md) is the one hand-curated,
// user-facing source of truth for the app's version — read it here instead
// of maintaining a separate counter (the old GitHub Actions variable-based
// scheme in scripts/increment-version.cjs silently defaulted to 0.0.0-ish
// values every run because GITHUB_TOKEN has no permission to read/write
// repo variables).
function getChangelogVersion() {
    const content = fs.readFileSync(CHANGELOG_FILE, 'utf-8');
    const match = content.match(/^## \[v(\d+\.\d+\.\d+)\]/m);
    if (!match) {
        throw new Error(`Could not find a "## [vX.Y.Z]" heading in ${CHANGELOG_FILE}`);
    }
    return match[1];
}

// Keep package.json's version in lockstep so npm tooling and the changelog
// never drift apart again.
function syncPackageVersion(version) {
    const content = fs.readFileSync(PACKAGE_JSON_FILE, 'utf-8');
    const updated = content.replace(/^(\s*"version":\s*")[^"]*(")/m, `$1${version}$2`);
    if (updated !== content) {
        fs.writeFileSync(PACKAGE_JSON_FILE, updated);
    }
}

// Helper: Get Git Info
function getGitInfo() {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
        const hash = execSync('git rev-parse --short HEAD').toString().trim();
        return { branch, hash };
    } catch (e) {
        return { branch: 'unknown', hash: 'local' };
    }
}

// Helper: Calculate Hash of a File
function hashFile(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Helper: Recursive Walk to Hash a Directory (for Core Components)
function hashDirectory(dir) {
    let hashes = '';
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            hashes += hashDirectory(filePath);
        } else {
            hashes += hashFile(filePath);
        }
    }
    
    return crypto.createHash('md5').update(hashes).digest('hex').substring(0, 8);
}

function generate() {
    console.log('🏗️  Generating Build Manifest...');

    // 1. Environment Info
    const appVersion = getChangelogVersion();
    syncPackageVersion(appVersion);
    const git = getGitInfo();
    const timestamp = new Date().toISOString();
    // Rudimentary environment detection based on branch or args
    const isProd = git.branch === 'main' || git.branch === 'master';
    const env = isProd ? 'PRODUCTION' : (git.branch === 'develop' ? 'UAT' : 'DEV');

    // 2. Core Hash (Components + Libs)
    // If any shared component changes, effectively ALL pages change version
    const componentsHash = hashDirectory(path.join(SRC_DIR, 'components'));
    const libHash = hashDirectory(path.join(SRC_DIR, 'lib'));
    const coreHash = crypto.createHash('md5').update(componentsHash + libHash).digest('hex').substring(0, 8);

    // 3. Page Hashes
    const pagesDir = path.join(SRC_DIR, 'pages');
    const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
    
    const pages = {};
    pageFiles.forEach(file => {
        const pageName = file.replace(/\.tsx?$/, '');
        const fileHash = hashFile(path.join(pagesDir, file));
        // Page Version = CoreHash + FileHash (So if Core changes, Page version bumps)
        const combinedHash = crypto.createHash('md5').update(coreHash + fileHash).digest('hex').substring(0, 8);
        
        pages[pageName] = {
            hash: combinedHash,
            lastModified: timestamp
        };
    });

    // 4. Construct Manifest
    const buildInfo = {
        meta: {
            env,
            branch: git.branch,
            globalHash: git.hash,
            coreHash,
            buildTime: timestamp,
            appVersion
        },
        pages
    };

    // 5. Write to File
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(buildInfo, null, 2));
    console.log(`✅ Build Manifest generated at ${OUTPUT_FILE}`);
    console.log(`   App Version: ${appVersion} (from changelog.md)`);
    console.log(`   Global Hash: ${git.hash} [${env}]`);
}

generate();