/**
 * 📝 TRIAGE REPORT GENERATOR
 * Usage: node scripts/generate_triage_report.cjs
 * Prerequisite: npm install firebase-admin
 * Service Account: Must be present at ./service-account.json
 * 
 * This script pulls feedback from Firestore that is marked as 'investigating',
 * 'new', or 'backlog' and generates a markdown triage report for sprint planning.
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

let serviceAccount;
try {
    serviceAccount = require('../service-account-prod.json');
} catch (e) {
    console.error('❌ Error: Could not load service-account.json. Please ensure it exists in the root directory.');
    process.exit(1);
}

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function generateReport() {
    console.log('Fetching feedback from Firestore...');
    try {
        const feedbackRef = db.collection('feedback');
        const snapshot = await feedbackRef.orderBy('timestamp', 'desc').get();
        
        if (snapshot.empty) {
            console.log('No feedback found.');
            process.exit(0);
        }

        const reports = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            reports.push({
                id: doc.id,
                ...data,
                status: data.status || 'new',
                category: data.category || 'unknown'
            });
        });

        // Filter for active/actionable issues
        const activeStatuses = ['new', 'investigating', 'backlog'];
        const activeReports = reports.filter(r => activeStatuses.includes(r.status));

        const investigating = activeReports.filter(r => r.status === 'investigating');
        const newReports = activeReports.filter(r => r.status === 'new');
        const backlog = activeReports.filter(r => r.status === 'backlog');

        const groupedByRoute = investigating.reduce((acc, report) => {
            const route = report.route || 'Global/Unknown';
            if (!acc[route]) acc[route] = [];
            acc[route].push(report);
            return acc;
        }, {});

        let markdown = `# 🐛 Sprint Planning Triage Report\n`;
        markdown += `**Generated:** ${new Date().toLocaleDateString()}\n`;
        markdown += `**Total Actionable Issues:** ${activeReports.length} (Investigating: ${investigating.length}, New: ${newReports.length}, Backlog: ${backlog.length})\n\n`;

        markdown += `## 🔍 Active Investigations (Prioritized for Sprint)\n`;
        if (investigating.length === 0) {
            markdown += `*No bugs currently marked for investigation.*\n\n`;
        } else {
            Object.entries(groupedByRoute).forEach(([route, bugs], index) => {
                markdown += `### Phase ${index + 1}: ${route} Polish\n`;
                bugs.forEach(bug => {
                    const dateStr = bug.timestamp ? bug.timestamp.toDate().toLocaleDateString() : 'Unknown Date';
                    markdown += `- [ ] **[${bug.category.toUpperCase()}]** ${bug.message.split('\n')[0]}\n`;
                    markdown += `  - *Details:* \`${bug.environment || 'N/A'}\` | Vault Unlocked: \`${bug.vaultUnlocked}\` | Reported: ${dateStr}\n`;
                    markdown += `  - *ID:* \`${bug.id}\`\n`;
                });
                markdown += `\n`;
            });
        }

        markdown += `## 📥 New Inbox (Needs Triage)\n`;
        if (newReports.length === 0) {
            markdown += `*Inbox zero!*\n\n`;
        } else {
            newReports.forEach(bug => {
                const dateStr = bug.timestamp ? bug.timestamp.toDate().toLocaleDateString() : 'Unknown Date';
                markdown += `- **[${bug.category.toUpperCase()}]** ${bug.message.split('\n')[0]}\n`;
                markdown += `  - *Route:* \`${bug.route || 'N/A'}\` | Reported: ${dateStr} | ID: \`${bug.id}\`\n`;
            });
            markdown += `\n`;
        }

        markdown += `## 📚 Backlog (Deferred)\n`;
        if (backlog.length === 0) {
            markdown += `*Backlog empty!*\n\n`;
        } else {
            backlog.forEach(bug => {
                const dateStr = bug.timestamp ? bug.timestamp.toDate().toLocaleDateString() : 'Unknown Date';
                markdown += `- **[${bug.category.toUpperCase()}]** ${bug.message.split('\n')[0]}\n`;
                markdown += `  - *Route:* \`${bug.route || 'N/A'}\` | Reported: ${dateStr} | ID: \`${bug.id}\`\n`;
            });
            markdown += `\n`;
        }

        const outputPath = path.join(__dirname, '..', 'docs', 'TRIAGE_REPORT.md');
        fs.writeFileSync(outputPath, markdown);
        
        console.log(`✅ Success! Triage report generated at: ${outputPath}`);

    } catch (error) {
        console.error('❌ Error fetching data:', error);
    } finally {
        process.exit();
    }
}

generateReport();
