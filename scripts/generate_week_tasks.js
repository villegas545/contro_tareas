const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// Simulate the weekly task generation logic
async function generateTasks() {
    const debugDate = '2026-02-03'; // Debug date
    const now = new Date(debugDate);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    const currentDay = now.getDay();

    // Calculate start of week (Monday)
    const diff = currentDay === 0 ? 6 : currentDay - 1;
    const mondayDate = new Date(currentYear, currentMonth, currentDate - diff);
    mondayDate.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + i);
        weekDates.push(d.toISOString().split('T')[0]);
    }

    console.log('Week dates:', weekDates);

    // Get existing tasks
    const existingSnap = await db.collection('tasks')
        .where('dueDate', '>=', weekDates[0])
        .where('dueDate', '<=', weekDates[6])
        .get();
    const existingTasks = existingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Existing tasks: ${existingTasks.length}`);

    // Get schedules
    const schedulesSnap = await db.collection('schedules').where('active', '==', true).get();
    const schedules = schedulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Active schedules: ${schedules.length}`);

    let created = 0;
    for (const sched of schedules) {
        let targetDays = [];
        if (sched.frequency === 'weekly') {
            targetDays = sched.recurrenceDays || [];
        } else {
            targetDays = sched.recurrenceDays && sched.recurrenceDays.length > 0
                ? sched.recurrenceDays
                : [1, 2, 3, 4, 5, 6, 0];
        }

        console.log(`\nSchedule: ${sched.title} (${sched.frequency})`);
        console.log(`  Target days: ${JSON.stringify(targetDays)}`);

        for (let i = 0; i < 7; i++) {
            const dateStr = weekDates[i];
            const dayIndex = i === 6 ? 0 : i + 1;

            if (targetDays.includes(dayIndex)) {
                const exists = existingTasks.some(t =>
                    t.scheduleId === sched.id && t.dueDate === dateStr
                );

                if (!exists) {
                    console.log(`  Creating for ${dateStr} (day ${dayIndex})`);
                    await db.collection('tasks').add({
                        title: sched.title,
                        description: sched.description || '',
                        assignedTo: sched.assignedTo,
                        createdBy: sched.createdBy || '',
                        status: 'pending',
                        type: sched.type || 'obligatory',
                        frequency: sched.frequency,
                        points: sched.points || 0,
                        scheduleId: sched.id,
                        templateId: sched.templateId || '',
                        dueDate: dateStr,
                        categoryId: sched.categoryId || '',
                        isResponsibility: sched.isResponsibility || false,
                        isSchool: sched.isSchool || false,
                        shift: sched.shift || 'no-time',
                        createdAt: new Date().toISOString()
                    });
                    created++;
                } else {
                    console.log(`  Already exists for ${dateStr}`);
                }
            }
        }
    }

    console.log(`\n✅ Created ${created} tasks`);
    process.exit(0);
}

generateTasks().catch(console.error);
