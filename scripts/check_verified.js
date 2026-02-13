const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    const elmoId = '45TDc7BbYdYk3TjnxBh8';

    console.log('\n=== TAREAS VERIFIED de Elmo ===\n');

    const tasks = await db.collection('tasks')
        .where('assignedTo', '==', elmoId)
        .where('status', '==', 'verified')
        .get();

    console.log(`Total verified: ${tasks.size}\n`);

    tasks.docs.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  Title: ${d.title}`);
        console.log(`  DueDate: ${d.dueDate}`);
        console.log(`  Points: ${d.points || 0}`);
        console.log('');
    });

    process.exit(0);
}
main();
