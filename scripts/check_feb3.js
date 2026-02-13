const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    const elmoId = '45TDc7BbYdYk3TjnxBh8';
    const targetDate = '2026-02-03';

    console.log(`\n=== TAREAS de Elmo para ${targetDate} ===\n`);

    const tasks = await db.collection('tasks')
        .where('assignedTo', '==', elmoId)
        .where('dueDate', '==', targetDate)
        .get();

    console.log(`Total: ${tasks.size}\n`);

    tasks.docs.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  Title: ${d.title}`);
        console.log(`  Status: ${d.status}`);
        console.log(`  Points: ${d.points || 0}`);
        console.log(`  ScheduleId: ${d.scheduleId || 'N/A'}`);
        console.log('');
    });

    // También revisar historial
    console.log(`\n=== HISTORIAL con fecha ${targetDate} ===\n`);
    const history = await db.collection('taskHistory')
        .where('date', '==', targetDate)
        .get();

    console.log(`Total history: ${history.size}`);
    history.docs.forEach(doc => {
        const d = doc.data();
        console.log(`  ${d.title} | ${d.status} | ${d.points} pts`);
    });

    process.exit(0);
}
main();
