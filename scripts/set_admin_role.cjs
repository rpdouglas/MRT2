/**
 * 🔐 ADMIN ROLE MANAGER
 * Usage: node scripts/set_admin_role.js <email> [path-to-service-account.json]
 * Prerequisite: npm install firebase-admin
 * Service Account: defaults to ./service-account.json; pass a second arg to use
 * a differentiated key instead (e.g. service-account-dev.json/-uat.json/-prod.json).
 */
const path = require('node:path');
const admin = require('firebase-admin');

const args = process.argv.slice(2);
const email = args[0];
const serviceAccountPath = args[1] ?? '../service-account.json';

if (!email) {
    console.error('❌ Usage: node set_admin_role.js <email> [path-to-service-account.json]');
    process.exit(1);
}

const serviceAccount = require(path.resolve(__dirname, serviceAccountPath));

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
