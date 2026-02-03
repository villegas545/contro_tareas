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

    console.log('\n=== LIMPIANDO TAREAS DUPLICADAS de Elmo ===\n');

    const allTasks = await db.collection('tasks')
        .where('assignedTo', '==', elmoId)
        .get();

    console.log(`Total tareas encontradas: ${allTasks.size}`);

    // Keep only ONE task per title for today, delete all others
    const seen = new Map(); // title -> kept task id
    const toDelete = [];

    allTasks.docs.forEach(doc => {
        const d = doc.data();
        const title = d.title;
        const dueDate = d.dueDate;

        // Key for deduplication
        const key = `${title}|${dueDate}`;

        if (!seen.has(key)) {
            // First occurrence, keep it
            seen.set(key, doc.id);
        } else {
            // Duplicate, mark for deletion
            toDelete.push({ id: doc.id, title, dueDate, reason: 'duplicate' });
        }

        // Also delete tasks with dates before today (past tasks that are pending)
        if (dueDate && dueDate < today && d.status === 'pending') {
            if (!toDelete.find(t => t.id === doc.id)) {
                toDelete.push({ id: doc.id, title, dueDate, reason: 'old pending' });
            }
        }
    });

    console.log(`\nTareas a eliminar: ${toDelete.length}`);
    toDelete.forEach(t => {
        console.log(`  - ${t.title} (${t.dueDate}) - ${t.reason}`);
    });

    if (toDelete.length > 0) {
        console.log('\nEliminando...');
        const batch = db.batch();
        toDelete.forEach(t => {
            batch.delete(db.collection('tasks').doc(t.id));
        });
        await batch.commit();
        console.log('✅ Eliminadas');
    }

    // Verify
    const remaining = await db.collection('tasks')
        .where('assignedTo', '==', elmoId)
        .get();

    console.log(`\nTareas restantes: ${remaining.size}`);
    remaining.docs.forEach(doc => {
        const d = doc.data();
        console.log(`  - ${d.title} | ${d.dueDate} | ${d.status}`);
    });

    process.exit(0);
}
main();
