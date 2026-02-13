/**
 * Debug script to check Elmo's tasks in Firestore
 * Run with: node scripts/debug_elmo_tasks.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Load service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function debugElmoTasks() {
    console.log('=== DEBUG: Checking Tasks ===\n');

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    console.log(`Today's date: ${todayStr}\n`);

    // List all users
    console.log('=== All Users ===\n');
    const usersSnap = await db.collection('users').get();
    const users = {};
    usersSnap.docs.forEach(doc => {
        const data = doc.data();
        users[doc.id] = data.name;
        console.log(`  ${doc.id}: ${data.name} (${data.role})`);
    });
    console.log('');

    // Get all tasks
    console.log('=== All Tasks (looking for issues) ===\n');
    const tasksSnap = await db.collection('tasks').get();

    console.log(`Total tasks in database: ${tasksSnap.size}\n`);

    // Group by status
    const byStatus = {};
    const problematicTasks = [];

    tasksSnap.docs.forEach(doc => {
        const task = doc.data();
        const status = task.status || 'unknown';
        byStatus[status] = (byStatus[status] || 0) + 1;

        // Check for problematic tasks: verified but showing today
        const isVerified = task.status === 'verified';
        const isForToday = task.dueDate === todayStr;
        const isForPast = task.dueDate && task.dueDate < todayStr;

        // Look for "Alistar" specifically
        if (task.title && task.title.toLowerCase().includes('alistar')) {
            console.log(`\n>>> FOUND "Alistar" task:`);
            console.log(`    ID: ${doc.id}`);
            console.log(`    Title: ${task.title}`);
            console.log(`    Status: ${task.status}`);
            console.log(`    AssignedTo: ${task.assignedTo} (${users[task.assignedTo] || 'unknown'})`);
            console.log(`    DueDate: ${task.dueDate || 'NONE'}`);
            console.log(`    Frequency: ${task.frequency}`);
            console.log(`    Points: ${task.points}`);
            console.log(`    CompletedAt: ${task.completedAt || 'NONE'}`);
            console.log(`    VerifiedAt: ${task.verifiedAt || 'NONE'}`);
            console.log(`    ScheduleId: ${task.scheduleId || 'NONE'}`);
            console.log(`    CreatedAt: ${task.createdAt || 'NONE'}`);

            // Determine visibility
            let shouldShow = false;
            let reason = '';

            if (task.frequency === 'one-time') {
                if (task.dueDate && task.dueDate > todayStr) {
                    reason = 'HIDDEN: future one-time';
                } else if (task.dueDate && task.dueDate < todayStr && task.status === 'pending') {
                    reason = 'HIDDEN: old pending one-time';
                } else {
                    shouldShow = true;
                    reason = 'VISIBLE: one-time due today or past completed';
                }
            } else if (task.dueDate) {
                if (task.dueDate === todayStr) {
                    shouldShow = true;
                    reason = 'VISIBLE: dueDate matches today';
                } else {
                    reason = `HIDDEN: dueDate ${task.dueDate} != today ${todayStr}`;
                }
            } else {
                reason = 'HIDDEN: no dueDate';
            }

            console.log(`    >>> Should show to child: ${shouldShow} - ${reason}`);
        }
    });

    console.log('\n=== Tasks by Status ===');
    Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
    });

    // Show tasks for today
    console.log(`\n=== Tasks with dueDate = ${todayStr} ===\n`);
    tasksSnap.docs.forEach(doc => {
        const task = doc.data();
        if (task.dueDate === todayStr) {
            console.log(`  ${doc.id}: "${task.title}" - ${task.status} - ${users[task.assignedTo] || task.assignedTo}`);
        }
    });

    // Show verified tasks that might be causing issues (past dates but showing)
    console.log(`\n=== Verified tasks with past dueDate (potential problems) ===\n`);
    tasksSnap.docs.forEach(doc => {
        const task = doc.data();
        if (task.status === 'verified' && task.dueDate && task.dueDate < todayStr) {
            console.log(`  ${doc.id}: "${task.title}" - dueDate: ${task.dueDate} - ${users[task.assignedTo] || task.assignedTo}`);
        }
    });
}

debugElmoTasks().then(() => {
    console.log('\n=== Debug complete ===');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
