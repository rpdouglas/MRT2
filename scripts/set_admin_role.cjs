/**
 * 🔐 ADMIN ROLE MANAGER
 * Usage: node scripts/set_admin_role.js <email>
 * Prerequisite: npm install firebase-admin
 * Service Account: Must be present at ./service-account.json
 */
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

const args = process.argv.slice(2);
const email = args[0];

if (!email) {
    console.error('❌ Usage: node set_admin_role.js <email>');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function setAdmin(email) {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        console.log(`✅ Success! ${email} is now an Admin (Custom Claims).`);
        console.log('👉 They must sign out and sign back in for changes to take effect.');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit();
    }
}

setAdmin(email);
