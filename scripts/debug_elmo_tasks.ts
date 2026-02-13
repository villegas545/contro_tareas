/**
 * Debug script to check Elmo's tasks in Firestore
 * Run with: npx ts-node scripts/debug_elmo_tasks.ts
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Load service account
const serviceAccountPath = path.join(__dirname, '..', 'control-tareas-c526c-firebase-adminsdk-fbsvc-1609fa70ce.json');
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

async function debugElmoTasks() {
    console.log('=== DEBUG: Checking Elmo\'s Tasks ===\n');

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    console.log(`Today's date: ${todayStr}\n`);

    // First, find Elmo's user ID
    const usersSnap = await db.collection('users').where('name', '==', 'Elmo Riyo').get();
    let elmoId: string | null = null;

    if (!usersSnap.empty) {
        elmoId = usersSnap.docs[0].id;
        const elmoData = usersSnap.docs[0].data();
        console.log(`Found Elmo: ID=${elmoId}, Role=${elmoData.role}\n`);
    } else {
        // Try searching by partial name
        const allUsers = await db.collection('users').get();
        allUsers.docs.forEach(doc => {
            const data = doc.data();
            if (data.name && data.name.toLowerCase().includes('elmo')) {
                elmoId = doc.id;
                console.log(`Found Elmo (partial match): ID=${elmoId}, Name=${data.name}\n`);
            }
        });
    }

    if (!elmoId) {
        console.log('Could not find Elmo user. Listing all users:');
        const allUsers = await db.collection('users').get();
        allUsers.docs.forEach(doc => {
            console.log(`  - ${doc.id}: ${doc.data().name} (${doc.data().role})`);
        });
        return;
    }

    // Get all tasks assigned to Elmo
    console.log('=== All tasks assigned to Elmo ===\n');
    const tasksSnap = await db.collection('tasks').where('assignedTo', '==', elmoId).get();

    console.log(`Total tasks assigned to Elmo: ${tasksSnap.size}\n`);

    tasksSnap.docs.forEach(doc => {
        const task = doc.data();
        console.log(`Task ID: ${doc.id}`);
        console.log(`  Title: ${task.title}`);
        console.log(`  Status: ${task.status}`);
        console.log(`  DueDate: ${task.dueDate || 'NONE'}`);
        console.log(`  Frequency: ${task.frequency}`);
        console.log(`  Points: ${task.points}`);
        console.log(`  ScheduleId: ${task.scheduleId || 'NONE'}`);
        console.log(`  OriginalTaskId: ${task.originalTaskId || 'NONE'}`);
        console.log(`  CreatedAt: ${task.createdAt}`);
        console.log(`  CompletedAt: ${task.completedAt || 'NONE'}`);
        console.log(`  --- isTaskActiveToday check ---`);

        // Simulate isTaskActiveToday logic
        if (task.frequency === 'one-time') {
            if (task.dueDate && task.dueDate > todayStr) {
                console.log(`  Result: HIDDEN (future one-time)`);
            } else if (task.dueDate && task.dueDate < todayStr && task.status === 'pending') {
                console.log(`  Result: HIDDEN (old pending one-time)`);
            } else {
                console.log(`  Result: VISIBLE (one-time, due today or past completed)`);
            }
        } else if (task.dueDate) {
            if (task.dueDate === todayStr) {
                console.log(`  Result: VISIBLE (dueDate matches today)`);
            } else {
                console.log(`  Result: HIDDEN (dueDate ${task.dueDate} != today ${todayStr})`);
            }
        } else {
            console.log(`  Result: HIDDEN (no dueDate, weird data)`);
        }
        console.log('');
    });

    // Look specifically for "Alistar lo de la escuela" task
    console.log('\n=== Search for "Alistar lo de la escuela" ===\n');
    const allTasks = await db.collection('tasks').get();
    let foundAlistar = false;

    allTasks.docs.forEach(doc => {
        const task = doc.data();
        if (task.title && task.title.toLowerCase().includes('alistar')) {
            foundAlistar = true;
            console.log(`Found task: ${doc.id}`);
            console.log(`  Title: ${task.title}`);
            console.log(`  Status: ${task.status}`);
            console.log(`  AssignedTo: ${task.assignedTo}`);
            console.log(`  DueDate: ${task.dueDate || 'NONE'}`);
            console.log(`  Frequency: ${task.frequency}`);
            console.log(`  Points: ${task.points}`);
            console.log(`  All data:`, JSON.stringify(task, null, 2));
            console.log('');
        }
    });

    if (!foundAlistar) {
        console.log('No tasks found with "alistar" in the title.');
    }
}

debugElmoTasks().then(() => {
    console.log('\n=== Debug complete ===');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
