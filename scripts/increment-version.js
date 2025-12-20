// scripts/increment-version.js
const https = require('https');

// --- Configuration ---
const GITHUB_TOKEN = process.env.GH_PAT || process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY; // e.g., "username/repo"
const BRANCH = process.env.GITHUB_REF_NAME; // e.g., "main", "feature/login"

if (!GITHUB_TOKEN || !REPO) {
    console.error("❌ Missing GITHUB_TOKEN or GITHUB_REPOSITORY environment variables.");
    process.exit(1);
}

// Helper to make GitHub API requests
function ghRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${REPO}${path}`,
            method: method,
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'User-Agent': 'node.js-script',
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // 204 No Content handling
                    if (res.statusCode === 204) return resolve({});
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`GitHub API Error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    try {
        console.log(`🔍 Branch detected: ${BRANCH}`);

        // 1. Fetch current counter values
        // Note: We fetch individually because listing variables requires distinct parsing
        const getVar = async (name) => {
            try {
                const res = await ghRequest('GET', `/actions/variables/${name}`);
                return parseInt(res.value, 10) || 0;
            } catch (e) {
                console.warn(`⚠️ Variable ${name} not found or error. Defaulting to 0.`);
                return 0;
            }
        };

        let prod = await getVar('COUNT_PROD');
        let uat = await getVar('COUNT_UAT');
        let dev = await getVar('COUNT_DEV');

        console.log(`📉 Current Counts: PROD=${prod}, UAT=${uat}, DEV=${dev}`);

        // 2. Determine which counter to increment
        let targetVar = '';
        if (BRANCH === 'main') {
            prod++;
            targetVar = 'COUNT_PROD';
        } else if (BRANCH.startsWith('release/')) {
            uat++;
            targetVar = 'COUNT_UAT';
        } else {
            // Default to DEV for feature branches or others
            dev++;
            targetVar = 'COUNT_DEV';
        }

        const newVersion = `${prod}.${uat}.${dev}`;
        console.log(`🚀 New Version: ${newVersion} (Incrementing ${targetVar})`);

        // 3. Update the variable in GitHub
        if (targetVar) {
            try {
                // If variable exists, we PATCH it. If logic allowed creation, we'd POST, 
                // but Variables must exist via UI first usually or use POST to create. 
                // We assume they exist as per instructions.
                await ghRequest('PATCH', `/actions/variables/${targetVar}`, {
                    name: targetVar,
                    value: String(targetVar === 'COUNT_PROD' ? prod : targetVar === 'COUNT_UAT' ? uat : dev)
                });
                console.log(`✅ GitHub Variable ${targetVar} updated.`);
            } catch (e) {
                console.error(`❌ Failed to update variable ${targetVar}. Ensure GITHUB_TOKEN has 'variables:write' permission or use a PAT.`);
                console.error(e.message);
                // We don't fail the build, just warn, so the version string is locally valid for this build at least
            }
        }

        // 4. Export to GITHUB_ENV for the next steps in workflow
        const fs = require('fs');
        if (process.env.GITHUB_ENV) {
            fs.appendFileSync(process.env.GITHUB_ENV, `VITE_APP_VERSION=${newVersion}\n`);
            console.log(`📤 VITE_APP_VERSION set to ${newVersion}`);
        }

    } catch (error) {
        console.error("Script failed:", error);
        process.exit(1);
    }
}

main();