const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    console.log('\n=== SCHEDULES para Elmo Riyo ===\n');
    const schedules = await db.collection('schedules')
        .where('assignedTo', '==', '45TDc7BbYdYk3TjnxBh8')
        .get();

    schedules.docs.forEach(doc => {
        const d = doc.data();
        console.log('ID:', doc.id);
        console.log('  Title:', d.title);
        console.log('  Active:', d.active);
        console.log('  Frequency:', d.frequency);
        console.log('  TemplateId:', d.templateId);
        console.log('');
    });

    console.log('\n=== TAREAS de HOY para Elmo ===\n');
    const tasks = await db.collection('tasks')
        .where('assignedTo', '==', '45TDc7BbYdYk3TjnxBh8')
        .where('dueDate', '==', '2026-02-01')
        .get();

    if (tasks.empty) {
        console.log('No hay tareas para hoy');
    } else {
        tasks.docs.forEach(doc => {
            const d = doc.data();
            console.log('ID:', doc.id);
            console.log('  Title:', d.title);
            console.log('  Status:', d.status);
            console.log('  DueDate:', d.dueDate);
            console.log('  ScheduleId:', d.scheduleId || 'N/A');
            console.log('');
        });
    }

    process.exit(0);
}
main();
