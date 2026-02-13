const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    console.log('\n=== HISTORIAL (últimos 10) ===\n');

    const history = await db.collection('taskHistory')
        .orderBy('completedAt', 'desc')
        .limit(10)
        .get();

    history.docs.forEach(doc => {
        const d = doc.data();
        console.log(`${d.date || 'N/A'} | ${d.title} | ${d.status} | ${d.points || 0} pts | assignedTo: ${d.assignedTo}`);
    });

    process.exit(0);
}
main();
