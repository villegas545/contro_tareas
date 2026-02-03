const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
    const scheduleId = '6MPJrV7sHr7flgdYtO30';

    // Get the schedule data
    const scheduleDoc = await db.collection('schedules').doc(scheduleId).get();
    const sched = scheduleDoc.data();

    const today = '2026-02-01';
    const tomorrow = '2026-02-02';

    console.log('Creating tasks from schedule "Lavarse los dientes desayuno"...\n');

    // Create task for today
    const todayTask = await db.collection('tasks').add({
        scheduleId: scheduleId,
        templateId: sched.templateId,
        title: sched.title,
        description: sched.description || '',
        assignedTo: sched.assignedTo,
        createdBy: sched.createdBy,
        status: 'pending',
        type: sched.type,
        frequency: sched.frequency,
        points: sched.points || 10,
        dueDate: today,
        dueTime: sched.dueTime,
        isResponsibility: sched.isResponsibility,
        isSchool: sched.isSchool,
        shift: sched.shift,
        categoryId: sched.categoryId,
        createdAt: new Date().toISOString()
    });
    console.log('✅ Created task for TODAY:', todayTask.id);

    // Create task for tomorrow
    const tomorrowTask = await db.collection('tasks').add({
        scheduleId: scheduleId,
        templateId: sched.templateId,
        title: sched.title,
        description: sched.description || '',
        assignedTo: sched.assignedTo,
        createdBy: sched.createdBy,
        status: 'pending',
        type: sched.type,
        frequency: sched.frequency,
        points: sched.points || 10,
        dueDate: tomorrow,
        dueTime: sched.dueTime,
        isResponsibility: sched.isResponsibility,
        isSchool: sched.isSchool,
        shift: sched.shift,
        categoryId: sched.categoryId,
        createdAt: new Date().toISOString()
    });
    console.log('✅ Created task for TOMORROW:', tomorrowTask.id);

    console.log('\nDone! Reload the app to see the tasks.');
    process.exit(0);
}
main();
