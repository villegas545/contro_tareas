const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    const elmoId = '45TDc7BbYdYk3TjnxBh8';
    const tomorrow = '2026-02-02';

    console.log(`\n=== TAREAS de Elmo para ${tomorrow} ===\n`);

    const tasks = await db.collection('tasks')
        .where('assignedTo', '==', elmoId)
        .where('dueDate', '==', tomorrow)
        .get();

    console.log(`Total: ${tasks.size}\n`);

    tasks.docs.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  Title: ${d.title}`);
        console.log(`  Status: ${d.status}`);
        console.log(`  ScheduleId: ${d.scheduleId || 'N/A'}`);
        console.log('');
    });

    // Check for duplicates
    const titles = tasks.docs.map(d => d.data().title);
    const duplicates = titles.filter((t, i) => titles.indexOf(t) !== i);

    if (duplicates.length > 0) {
        console.log('⚠️ DUPLICADOS ENCONTRADOS:', [...new Set(duplicates)]);
    }

    process.exit(0);
}
main();
