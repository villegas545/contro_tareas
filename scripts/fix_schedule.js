const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    const scheduleId = '6MPJrV7sHr7flgdYtO30';

    // Fix the schedule - add missing fields
    console.log('Fixing schedule "Lavarse los dientes desayuno"...\n');

    await db.collection('schedules').doc(scheduleId).update({
        points: 10,
        recurrenceDays: [0, 1, 2, 3, 4, 5, 6] // All days
    });

    console.log('✅ Schedule updated with points=10 and recurrenceDays=[0-6]\n');

    // Verify
    const scheduleDoc = await db.collection('schedules').doc(scheduleId).get();
    console.log('Updated schedule:');
    console.log(JSON.stringify(scheduleDoc.data(), null, 2));

    process.exit(0);
}
main();
