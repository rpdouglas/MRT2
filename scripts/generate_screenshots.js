import { chromium, devices } from 'playwright';
import { spawn, exec } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 5188;
const BASE_URL = `http://localhost:${PORT}`;

// 1. Ensure raw screenshots directory exists
const RAW_DIR = '_raw_screenshots';
if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR);
}

// 2. Start Vite server in background
console.log(`🚀 Starting Vite dev server on port ${PORT}...`);
const viteProcess = spawn('npx', ['vite', '--port', PORT.toString()], {
    shell: true,
    stdio: 'ignore'
});

// Helper to check if server is ready
const checkServerReady = () => {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            http.get(BASE_URL, (res) => {
                if (res.statusCode === 200) {
                    clearInterval(interval);
                    resolve(true);
                }
            }).on('error', () => {
                // Ignore error and retry
            });
        }, 200);

        // Timeout after 15 seconds
        setTimeout(() => {
            clearInterval(interval);
            resolve(false);
        }, 15000);
    });
};

async function captureScreenshots() {
    const serverReady = await checkServerReady();
    if (!serverReady) {
        console.error('❌ Timeout: Vite dev server did not start in time.');
        viteProcess.kill();
        process.exit(1);
    }
    console.log('✅ Vite dev server is ready.');

    console.log('🌐 Launching headless browser...');
    // Some sandboxed dev environments pre-install a Chromium build under a fixed,
    // unversioned path but can't reach the network to fetch the exact revision this
    // Playwright version's default headless-shell launch expects. Prefer that
    // pre-installed binary when present; every other environment (a real dev
    // machine, CI) won't have this path and falls through to normal resolution.
    const sandboxChromium = '/opt/pw-browsers/chromium';
    const browser = await chromium.launch({
        headless: true,
        ...(fs.existsSync(sandboxChromium) ? { executablePath: sandboxChromium } : {}),
    });
    
    // Pixel 7 emulation
    const pixel7 = devices['Pixel 7'];
    const context = await browser.newContext({
        ...pixel7,
        deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    const targets = [
        {
            name: 'ned-dashboard',
            url: `${BASE_URL}/dashboard?mockUser=ned`,
        },
        {
            name: 'maya-workbooks',
            url: `${BASE_URL}/workbooks?mockUser=maya`,
        },
        {
            name: 'david-urgesurfer',
            url: `${BASE_URL}/tools/urge-surfer?mockUser=david`,
        },
        {
            name: 'walt-insights',
            url: `${BASE_URL}/insights?mockUser=walt`,
        },
        {
            name: 'ned-journal-write',
            url: `${BASE_URL}/journal?mockUser=ned&tab=write`,
        },
        {
            name: 'ned-tasks',
            url: `${BASE_URL}/tasks?mockUser=ned`,
        },
        {
            name: 'ned-tools',
            url: `${BASE_URL}/tools?mockUser=ned`,
        },
        {
            name: 'ned-profile-general',
            url: `${BASE_URL}/profile/general?mockUser=ned`,
        },
        {
            name: 'ned-profile-security',
            url: `${BASE_URL}/profile/security?mockUser=ned`,
        },
        {
            name: 'walt-journal-history',
            url: `${BASE_URL}/journal?mockUser=walt&tab=history`,
        },
        {
            name: 'david-vitality',
            url: `${BASE_URL}/vitality?mockUser=david`,
        },
        {
            name: 'david-premium',
            url: `${BASE_URL}/premium?mockUser=david`,
        },
        {
            name: 'maya-thought-record',
            url: `${BASE_URL}/tools/thought-record?mockUser=maya`,
        },
        {
            name: 'david-sos-modal',
            url: `${BASE_URL}/dashboard?mockUser=david`,
            action: async (page) => {
                await page.click('button[aria-label="Emergency SOS"]');
            }
        },
        {
            // NOT a Service Module / sponsee-directory shot — that feature doesn't exist yet
            // (PROJ-05 is paused, no UI built). This captures the internal Admin Dashboard's
            // Users tab. Previously mislabeled 'lisa-sponsees' with a fabricated description
            // in docs/SCREENSHOTS_INDEX.md — never use this for public-facing marketing.
            name: 'admin-users-directory',
            url: `${BASE_URL}/admin?mockUser=admin`,
            action: async (page) => {
                await page.click('button:has-text("Users")');
            }
        },
        {
            name: 'jordan-mat-log',
            url: `${BASE_URL}/journal?mockUser=jordan&tab=write&template=mat_check_in`,
        },
        {
            name: 'walt-journal-insights',
            url: `${BASE_URL}/journal?mockUser=walt&tab=insights`,
        },
        {
            name: 'walt-journal-ai-wizard',
            url: `${BASE_URL}/journal?mockUser=walt&tab=history`,
            action: async (page) => {
                await page.click('button:has-text("Analyze")');
                await page.waitForTimeout(1000);
                await page.click('button:has-text("Begin Analysis")');
            }
        },
        {
            name: 'ned-games-hub',
            url: `${BASE_URL}/games?mockUser=ned`,
        },
        {
            name: 'david-craving-buster',
            url: `${BASE_URL}/games/craving-buster?mockUser=david`,
        },
        {
            name: 'lisa-recovery-jeopardy',
            url: `${BASE_URL}/games/recovery-jeopardy?mockUser=lisa`,
        },
        {
            name: 'walt-fast-lane',
            url: `${BASE_URL}/games/fast-lane?mockUser=walt`,
        },
        {
            name: 'ned-goal-ladder',
            url: `${BASE_URL}/games/goal-ladder?mockUser=ned`,
        },
        {
            name: 'lisa-thought-challenge',
            url: `${BASE_URL}/games/thought-challenge?mockUser=lisa`,
        },
        {
            name: 'walt-trigger-match',
            url: `${BASE_URL}/games/trigger-match?mockUser=walt`,
        },
        {
            name: 'maya-knowledge-quests',
            url: `${BASE_URL}/games/knowledge-quests?mockUser=maya`,
        },
        {
            name: 'ned-daily-crossword',
            url: `${BASE_URL}/games/daily-crossword?mockUser=ned`,
        },

        // --- TD-31: coverage completion (2026-09-04) ---
        // Individual CBT tool intro screens (8 of 9 — thought-record already covered above).
        // Admin's 3 remaining sub-tabs (Analytics/Health/Maintenance) are deliberately
        // scoped out — see docs/projects/63_SCREENSHOT_GENERATOR.md §6.
        { name: 'maya-cba', url: `${BASE_URL}/tools/cba?mockUser=maya` },
        { name: 'maya-abc', url: `${BASE_URL}/tools/abc?mockUser=maya` },
        { name: 'maya-dents', url: `${BASE_URL}/tools/dents?mockUser=maya` },
        { name: 'maya-personify', url: `${BASE_URL}/tools/personify?mockUser=maya` },
        { name: 'maya-lifestyle-balance', url: `${BASE_URL}/tools/lifestyle-balance?mockUser=maya` },
        { name: 'maya-five-questions', url: `${BASE_URL}/tools/five-questions?mockUser=maya` },
        { name: 'maya-morning-intent', url: `${BASE_URL}/tools/morning-intent?mockUser=maya` },
        { name: 'maya-resentment-burner', url: `${BASE_URL}/tools/resentment-burner?mockUser=maya` },

        // Tools → View History (CBA, since maya's mock journals include 2 real CBA/ABC entries).
        { name: 'maya-tools-history', url: `${BASE_URL}/tools/CBA/history?mockUser=maya` },

        // Insights → Recovery Capital (ROSC), split into 3 sub-screens this session.
        { name: 'walt-recovery-capital-snapshot', url: `${BASE_URL}/insights/rosc?mockUser=walt&tab=snapshot` },
        { name: 'walt-recovery-capital-trends', url: `${BASE_URL}/insights/rosc?mockUser=walt&tab=trends` },
        { name: 'walt-recovery-capital-history', url: `${BASE_URL}/insights/rosc?mockUser=walt&tab=history` },

        // Profile tabs not yet covered.
        { name: 'ned-profile-achievements', url: `${BASE_URL}/profile/achievements?mockUser=ned` },
        { name: 'ned-profile-data', url: `${BASE_URL}/profile/data?mockUser=ned` },

        // Workbooks — Detail and a Session (general_recovery/main, matching MAYA_WORKBOOK_ANSWERS).
        { name: 'maya-workbook-detail', url: `${BASE_URL}/workbooks/general_recovery?mockUser=maya` },
        { name: 'maya-workbook-session', url: `${BASE_URL}/workbooks/general_recovery/session/main?mockUser=maya` },

        // Tasks — Later and Log tabs (local component state, not a URL param — click to switch).
        {
            name: 'ned-tasks-later',
            url: `${BASE_URL}/tasks?mockUser=ned`,
            action: async (page) => { await page.click('button:has-text("Later")'); }
        },
        {
            name: 'ned-tasks-log',
            url: `${BASE_URL}/tasks?mockUser=ned`,
            action: async (page) => { await page.click('button:has-text("Log")'); }
        },

        // Public pages — deliberately no ?mockUser=. AuthContext persists the mock
        // login to localStorage ('mrt_mock_user'), not just the URL param, so a prior
        // target's persona would otherwise leak into these "logged-out" captures —
        // clearMockUser wipes it before navigating.
        { name: 'welcome', url: `${BASE_URL}/`, clearMockUser: true },
        { name: 'login', url: `${BASE_URL}/login`, clearMockUser: true },
        { name: 'links', url: `${BASE_URL}/links`, clearMockUser: true },

        // Account/admin utility pages.
        { name: 'delete-account', url: `${BASE_URL}/delete-account?mockUser=ned` },
        { name: 'debug-tools', url: `${BASE_URL}/debug?mockUser=admin` },

        // Exercises the Jordan/Lisa mock-data fix (TD-31) — previously these two personas
        // had auth but no profile/task/journal fixtures, so any non-game screen for them
        // rendered blank.
        { name: 'jordan-dashboard', url: `${BASE_URL}/dashboard?mockUser=jordan` },
        { name: 'lisa-vitality', url: `${BASE_URL}/vitality?mockUser=lisa` },
    ];

    for (const target of targets) {
        console.log(`📸 Capturing ${target.name} from ${target.url}...`);

        if (target.clearMockUser) {
            // localStorage is per-origin, not per-navigation — only safe to touch once
            // the page has actually loaded something on this origin at least once.
            await page.evaluate(() => localStorage.removeItem('mrt_mock_user')).catch(() => {});
        }

        // Go to URL and wait for page load to finish
        await page.goto(target.url, { waitUntil: 'load' });

        // Wait 3 seconds for layout calculations, mock state paints, and fonts to stabilize
        await page.waitForTimeout(3000);

        if (target.action) {
            await target.action(page);
            await page.waitForTimeout(1000);
        }

        const screenshotPath = path.join(RAW_DIR, `${target.name}.png`);
        await page.screenshot({ path: screenshotPath });
        console.log(`💾 Saved raw screenshot to ${screenshotPath}`);
    }

    console.log('🚪 Closing browser...');
    await browser.close();

    console.log('🛑 Stopping Vite dev server...');
    viteProcess.kill();

    // Run Python optimization script
    console.log('⚙️ Running optimize_screenshots.py...');
    exec('python3 scripts/optimize_screenshots.py', (err, stdout, stderr) => {
        if (err) {
            console.error(`❌ Optimization script failed: ${err.message}`);
            console.error(stderr);
            process.exit(1);
        }
        console.log(stdout);
        console.log('✨ Screenshot pipeline completed successfully!');
        process.exit(0);
    });
}

captureScreenshots().catch((err) => {
    console.error(`❌ Unexpected error: ${err.message}`);
    viteProcess.kill();
    process.exit(1);
});
