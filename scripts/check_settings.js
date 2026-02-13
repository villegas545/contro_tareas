const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    const settingsDoc = await db.collection('settings').doc('general').get();
    console.log('\nCurrent globalSettings:');
    console.log(JSON.stringify(settingsDoc.data(), null, 2));
    process.exit(0);
}
main();
