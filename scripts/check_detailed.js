const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    const elmoId = '45TDc7BbYdYk3TjnxBh8';

    console.log('\n=== TODAS LAS TAREAS de Elmo (detallado) ===\n');

    const allTasks = await db.collection('tasks')
        .where('assignedTo', '==', elmoId)
        .get();

    console.log(`Total: ${allTasks.size}\n`);

    allTasks.docs.forEach(doc => {
        const d = doc.data();
        console.log(`${doc.id.substring(0, 8)} | ${d.title.substring(0, 25).padEnd(25)} | ${d.dueDate} | ${d.status.padEnd(10)} | sched: ${(d.scheduleId || 'N/A').substring(0, 8)}`);
    });

    console.log('\n\n=== SCHEDULES ===\n');
    const schedules = await db.collection('schedules').get();
    schedules.docs.forEach(doc => {
        const d = doc.data();
        console.log(`${doc.id.substring(0, 8)} | ${d.title.substring(0, 30)} | ${d.frequency}`);
    });

    process.exit(0);
}
main();
