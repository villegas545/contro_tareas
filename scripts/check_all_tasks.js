const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    const elmoId = '45TDc7BbYdYk3TjnxBh8';
    const today = '2026-02-01';

    console.log('\n=== TODAS LAS TAREAS de Elmo ===\n');

    const allTasks = await db.collection('tasks')
        .where('assignedTo', '==', elmoId)
        .get();

    console.log(`Total tareas: ${allTasks.size}\n`);

    // Group by title
    const byTitle = {};
    allTasks.docs.forEach(doc => {
        const d = doc.data();
        const key = d.title;
        if (!byTitle[key]) byTitle[key] = [];
        byTitle[key].push({
            id: doc.id,
            dueDate: d.dueDate || 'NO DATE',
            status: d.status,
            scheduleId: d.scheduleId || 'N/A'
        });
    });

    console.log('--- Por Título ---\n');
    Object.entries(byTitle).forEach(([title, tasks]) => {
        console.log(`${title}: ${tasks.length} tareas`);
        tasks.forEach(t => {
            console.log(`  - ${t.dueDate} | ${t.status} | scheduleId: ${t.scheduleId.substring(0, 8)}...`);
        });
        console.log('');
    });

    process.exit(0);
}
main();
