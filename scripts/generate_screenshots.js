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
    const browser = await chromium.launch({ headless: true });
    
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
            name: 'lisa-sponsees',
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
        }
    ];

    for (const target of targets) {
        console.log(`📸 Capturing ${target.name} from ${target.url}...`);
        
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
