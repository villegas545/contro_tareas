/**
 * Firebase Database Debug Utility
 * 
 * Usage:
 *   node scripts/db_debug.js <command> [options]
 * 
 * Commands:
 *   users                    - List all users
 *   tasks                    - List all tasks (summary)
 *   tasks --full             - List all tasks (full details)
 *   tasks --user <userId>    - List tasks for a specific user
 *   tasks --date <YYYY-MM-DD> - List tasks for a specific date
 *   tasks --status <status>  - Filter by status (pending, completed, verified)
 *   task <taskId>            - Show full details of a specific task
 *   schedules                - List all schedules
 *   templates                - List all templates
 *   history                  - List task history
 *   query <collection>       - List all documents in a collection
 *   delete-task <taskId>     - Delete a specific task
 *   fix-orphans              - Find and optionally delete orphan tasks
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

// Helper: Get local date string
function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Cache for user names
let usersCache = {};

async function loadUsers() {
    const snap = await db.collection('users').get();
    snap.docs.forEach(doc => {
        usersCache[doc.id] = doc.data();
    });
    return usersCache;
}

function getUserName(userId) {
    return usersCache[userId]?.name || userId;
}

// Commands
async function listUsers() {
    await loadUsers();
    console.log('\n=== USERS ===\n');
    Object.entries(usersCache).forEach(([id, user]) => {
        console.log(`  ${id}: ${user.name} (${user.role}) - Points: ${user.points || 0}`);
    });
}

async function listTasks(options = {}) {
    await loadUsers();
    const today = getLocalDateString();
    console.log(`\n=== TASKS (Today: ${today}) ===\n`);

    let query = db.collection('tasks');

    if (options.user) {
        query = query.where('assignedTo', '==', options.user);
    }
    if (options.status) {
        query = query.where('status', '==', options.status);
    }

    const snap = await query.get();
    console.log(`Total tasks: ${snap.size}\n`);

    // Group by status
    const byStatus = {};
    const byDate = {};

    snap.docs.forEach(doc => {
        const task = doc.data();
        const status = task.status || 'unknown';
        const dueDate = task.dueDate || 'no-date';

        byStatus[status] = (byStatus[status] || 0) + 1;
        byDate[dueDate] = (byDate[dueDate] || 0) + 1;

        // Filter by date if specified
        if (options.date && task.dueDate !== options.date) return;

        if (options.full) {
            console.log(`\nTask: ${doc.id}`);
            console.log(`  Title: ${task.title}`);
            console.log(`  Status: ${task.status}`);
            console.log(`  AssignedTo: ${getUserName(task.assignedTo)}`);
            console.log(`  DueDate: ${task.dueDate || 'NONE'}`);
            console.log(`  Frequency: ${task.frequency}`);
            console.log(`  Points: ${task.points}`);
            console.log(`  Type: ${task.type}`);
            console.log(`  ScheduleId: ${task.scheduleId || 'NONE'}`);
            console.log(`  CreatedAt: ${task.createdAt || 'NONE'}`);
        } else {
            const marker = task.dueDate === today ? '📅' : (task.dueDate < today ? '⏰' : '📆');
            console.log(`${marker} ${doc.id.substring(0, 8)}... | ${task.title?.substring(0, 25).padEnd(25)} | ${task.status.padEnd(10)} | ${(task.dueDate || 'no-date').padEnd(12)} | ${getUserName(task.assignedTo)}`);
        }
    });

    console.log('\n--- Summary by Status ---');
    Object.entries(byStatus).forEach(([s, c]) => console.log(`  ${s}: ${c}`));

    console.log('\n--- Summary by Date (last 5) ---');
    const sortedDates = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);
    sortedDates.forEach(([d, c]) => console.log(`  ${d}: ${c}`));
}

async function showTask(taskId) {
    await loadUsers();
    const doc = await db.collection('tasks').doc(taskId).get();

    if (!doc.exists) {
        console.log(`Task ${taskId} not found.`);
        return;
    }

    const task = doc.data();
    console.log('\n=== TASK DETAILS ===\n');
    console.log(JSON.stringify({
        id: doc.id,
        ...task,
        assignedToName: getUserName(task.assignedTo)
    }, null, 2));
}

async function listSchedules() {
    await loadUsers();
    console.log('\n=== SCHEDULES ===\n');
    const snap = await db.collection('schedules').get();

    snap.docs.forEach(doc => {
        const s = doc.data();
        console.log(`${doc.id.substring(0, 8)}... | ${s.title?.substring(0, 25).padEnd(25)} | Active: ${s.active} | ${getUserName(s.assignedTo)} | Days: ${s.daysOfWeek?.join(',') || 'N/A'}`);
    });
}

async function listTemplates() {
    console.log('\n=== TEMPLATES ===\n');
    const snap = await db.collection('taskTemplates').get();

    snap.docs.forEach(doc => {
        const t = doc.data();
        console.log(`${doc.id.substring(0, 8)}... | ${t.title?.substring(0, 30).padEnd(30)} | Points: ${t.points} | Type: ${t.type}`);
    });
}

async function listHistory(limit = 20) {
    await loadUsers();
    console.log(`\n=== TASK HISTORY (last ${limit}) ===\n`);
    const snap = await db.collection('history').orderBy('date', 'desc').limit(limit).get();

    snap.docs.forEach(doc => {
        const h = doc.data();
        console.log(`${h.completedAt?.substring(0, 10) || 'N/A'} | ${h.title?.substring(0, 25).padEnd(25)} | ${h.status.padEnd(10)} | ${getUserName(h.assignedTo)}`);
    });
}

async function queryCollection(collectionName) {
    console.log(`\n=== ${collectionName.toUpperCase()} ===\n`);
    const snap = await db.collection(collectionName).get();
    console.log(`Total documents: ${snap.size}\n`);

    snap.docs.forEach(doc => {
        console.log(`--- ${doc.id} ---`);
        console.log(JSON.stringify(doc.data(), null, 2));
        console.log('');
    });
}

async function deleteTask(taskId) {
    const doc = await db.collection('tasks').doc(taskId).get();
    if (!doc.exists) {
        console.log(`Task ${taskId} not found.`);
        return;
    }

    const task = doc.data();
    console.log(`\nDeleting task: ${task.title}`);
    console.log(`  ID: ${taskId}`);
    console.log(`  Status: ${task.status}`);
    console.log(`  DueDate: ${task.dueDate}`);

    await db.collection('tasks').doc(taskId).delete();
    console.log('\n✅ Task deleted successfully.');
}

async function findOrphans(fix = false) {
    await loadUsers();
    const today = getLocalDateString();
    console.log(`\n=== ORPHAN TASKS ANALYSIS (Today: ${today}) ===\n`);

    const snap = await db.collection('tasks').get();
    const orphans = [];

    snap.docs.forEach(doc => {
        const task = doc.data();

        // Check for issues
        const issues = [];

        // 1. Past one-time verified tasks still in database
        if (task.frequency === 'one-time' && task.dueDate && task.dueDate < today && task.status === 'verified') {
            issues.push('Past verified one-time (should be in history only)');
        }

        // 2. Tasks with no assignee
        if (!task.assignedTo || task.assignedTo === '') {
            issues.push('No assignee');
        }

        // 3. Tasks assigned to non-existent user
        if (task.assignedTo && !usersCache[task.assignedTo] && task.assignedTo !== 'pool') {
            issues.push(`Assigned to non-existent user: ${task.assignedTo}`);
        }

        // 4. Very old pending tasks
        if (task.dueDate && task.dueDate < today && task.status === 'pending') {
            const daysDiff = Math.floor((new Date(today) - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
            if (daysDiff > 7) {
                issues.push(`Old pending task (${daysDiff} days old)`);
            }
        }

        if (issues.length > 0) {
            orphans.push({ id: doc.id, task, issues });
        }
    });

    console.log(`Found ${orphans.length} potentially problematic tasks:\n`);

    orphans.forEach(({ id, task, issues }) => {
        console.log(`${id}: "${task.title}"`);
        console.log(`  DueDate: ${task.dueDate}, Status: ${task.status}, AssignedTo: ${getUserName(task.assignedTo)}`);
        issues.forEach(i => console.log(`  ⚠️  ${i}`));
        console.log('');
    });

    if (fix && orphans.length > 0) {
        console.log('\n🔧 Fixing orphan tasks...\n');
        const batch = db.batch();
        orphans.forEach(({ id }) => {
            batch.delete(db.collection('tasks').doc(id));
        });
        await batch.commit();
        console.log(`✅ Deleted ${orphans.length} orphan tasks.`);
    }
}

async function resetSystem() {
    console.log('\n⚠️  WARNING: This will delete ALL tasks, history, and schedules. Templates and Users will be preserved.');

    console.log('Deleting Tasks...');
    await deleteCollection('tasks');

    console.log('Deleting History...');
    await deleteCollection('history');

    console.log('Deleting Schedules...');
    await deleteCollection('schedules');

    console.log('\n✅ System reset complete (Templates preserved).');
}

async function deleteCollection(collectionPath, batchSize = 100) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

// Main CLI handler
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log('Usage: node scripts/db_debug.js <command> [options]');
        console.log('\nCommands: users, tasks, task, schedules, templates, history, query, delete-task, fix-orphans, reset-system');
        process.exit(0);
    }

    try {
        switch (command) {
            case 'users':
                await listUsers();
                break;

            case 'tasks':
                const taskOpts = {
                    full: args.includes('--full'),
                    user: args.includes('--user') ? args[args.indexOf('--user') + 1] : null,
                    date: args.includes('--date') ? args[args.indexOf('--date') + 1] : null,
                    status: args.includes('--status') ? args[args.indexOf('--status') + 1] : null,
                };
                await listTasks(taskOpts);
                break;

            case 'task':
                await showTask(args[1]);
                break;

            case 'schedules':
                await listSchedules();
                break;

            case 'templates':
                await listTemplates();
                break;

            case 'history':
                await listHistory(parseInt(args[1]) || 20);
                break;

            case 'query':
                await queryCollection(args[1] || 'tasks');
                break;

            case 'delete-task':
                await deleteTask(args[1]);
                break;

            case 'fix-orphans':
                await findOrphans(args.includes('--fix'));
                break;

            case 'reset-system':
                await resetSystem();
                break;

            default:
                console.log(`Unknown command: ${command}`);
        }
    } catch (err) {
        console.error('Error:', err.message);
    }

    process.exit(0);
}

main();
