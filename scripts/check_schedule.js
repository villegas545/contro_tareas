const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    // Get the schedule for "Lavarse los dientes"
    const scheduleDoc = await db.collection('schedules').doc('6MPJrV7sHr7flgdYtO30').get();
    console.log('\n=== Schedule "Lavarse los dientes desayuno" ===\n');
    console.log(JSON.stringify(scheduleDoc.data(), null, 2));

    // Check if there are ANY tasks with this scheduleId
    console.log('\n=== Tareas generadas desde este schedule ===\n');
    const tasks = await db.collection('tasks')
        .where('scheduleId', '==', '6MPJrV7sHr7flgdYtO30')
        .get();

    if (tasks.empty) {
        console.log('❌ No hay tareas generadas desde este schedule');
    } else {
        tasks.docs.forEach(doc => {
            const d = doc.data();
            console.log(`- ${d.dueDate}: ${d.title} (${d.status})`);
        });
    }

    process.exit(0);
}
main();
