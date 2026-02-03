const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    console.log('\n=== SCHEDULES (detallado) ===\n');

    const schedules = await db.collection('schedules').get();

    schedules.docs.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  Title: ${d.title}`);
        console.log(`  Frequency: ${d.frequency}`);
        console.log(`  Active: ${d.active}`);
        console.log(`  AssignedTo: ${d.assignedTo}`);
        console.log(`  RecurrenceDays: ${JSON.stringify(d.recurrenceDays)}`);
        console.log('');
    });

    process.exit(0);
}
main();
