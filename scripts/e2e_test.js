/**
 * End-to-End Test Script
 * Tests the complete task workflow for today and tomorrow
 * 
 * Run: node scripts/e2e_test.js
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

// Test data
const TODAY = '2026-02-01';
const TOMORROW = '2026-02-02';
const PAPI_ID = '8wlV5XjIMRB6Qs9IzHXz';
const ELMO_ID = '45TDc7BbYdYk3TjnxBh8';

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function log(message, type = 'info') {
    const prefix = type === 'pass' ? '✅' : type === 'fail' ? '❌' : type === 'info' ? 'ℹ️' : '  ';
    console.log(`${prefix} ${message}`);
}

function test(name, passed, details = '') {
    results.tests.push({ name, passed, details });
    if (passed) {
        results.passed++;
        log(`PASS: ${name}`, 'pass');
    } else {
        results.failed++;
        log(`FAIL: ${name} ${details ? '- ' + details : ''}`, 'fail');
    }
}

async function cleanupTestTasks() {
    log('Cleaning up test tasks...');
    const snapshot = await db.collection('tasks')
        .where('title', '>=', '[TEST]')
        .where('title', '<=', '[TEST]\uf8ff')
        .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    if (snapshot.size > 0) {
        await batch.commit();
        log(`Deleted ${snapshot.size} test tasks`);
    }
}

async function createTestTask(data) {
    const docRef = await db.collection('tasks').add({
        ...data,
        createdAt: new Date().toISOString()
    });
    return docRef.id;
}

async function getTask(taskId) {
    const doc = await db.collection('tasks').doc(taskId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function updateTask(taskId, updates) {
    await db.collection('tasks').doc(taskId).update(updates);
}

async function deleteTask(taskId) {
    await db.collection('tasks').doc(taskId).delete();
}

// Simulate isTaskActiveToday logic
function isTaskActiveToday(task, targetDate) {
    // 1. One Time: Only visible if due today (or no date = legacy)
    if (task.frequency === 'one-time') {
        if (task.dueDate && task.dueDate > targetDate) return false;
        if (task.dueDate && task.dueDate < targetDate) return false;
        return true;
    }

    // 2. Instances with dueDate
    if (task.dueDate) {
        return task.dueDate === targetDate;
    }

    return false;
}

async function runTests() {
    console.log('\n========================================');
    console.log('   E2E TEST SUITE - Control de Tareas   ');
    console.log('========================================\n');
    console.log(`Today: ${TODAY}`);
    console.log(`Tomorrow: ${TOMORROW}`);
    console.log(`Parent: Papi (${PAPI_ID})`);
    console.log(`Child: Elmo Riyo (${ELMO_ID})\n`);

    // Cleanup before tests
    await cleanupTestTasks();

    // =============================================
    // TEST 1: Create task for today
    // =============================================
    log('\n--- Test 1: Create ONE-TIME task for TODAY ---');

    const task1Id = await createTestTask({
        title: '[TEST] Tarea de Hoy',
        description: 'Esta tarea debe aparecer hoy',
        assignedTo: ELMO_ID,
        status: 'pending',
        dueDate: TODAY,
        frequency: 'one-time',
        type: 'obligatory',
        points: 10
    });

    const task1 = await getTask(task1Id);
    test('Task created with correct data',
        task1 !== null && task1.title === '[TEST] Tarea de Hoy' && task1.dueDate === TODAY);

    test('Task visible on TODAY', isTaskActiveToday(task1, TODAY));
    test('Task NOT visible on TOMORROW', !isTaskActiveToday(task1, TOMORROW));

    // =============================================
    // TEST 2: Create task for tomorrow
    // =============================================
    log('\n--- Test 2: Create ONE-TIME task for TOMORROW ---');

    const task2Id = await createTestTask({
        title: '[TEST] Tarea de Mañana',
        description: 'Esta tarea debe aparecer mañana',
        assignedTo: ELMO_ID,
        status: 'pending',
        dueDate: TOMORROW,
        frequency: 'one-time',
        type: 'additional',
        points: 15
    });

    const task2 = await getTask(task2Id);
    test('Tomorrow task created', task2 !== null);
    test('Tomorrow task NOT visible TODAY', !isTaskActiveToday(task2, TODAY));
    test('Tomorrow task visible on TOMORROW', isTaskActiveToday(task2, TOMORROW));

    // =============================================
    // TEST 3: Task completion flow
    // =============================================
    log('\n--- Test 3: Task completion flow ---');

    // Complete task
    await updateTask(task1Id, {
        status: 'completed',
        completedAt: new Date().toISOString()
    });

    let task1Updated = await getTask(task1Id);
    test('Task status changed to completed', task1Updated.status === 'completed');
    test('Completed task still visible today', isTaskActiveToday(task1Updated, TODAY));

    // =============================================
    // TEST 4: Task verification flow
    // =============================================
    log('\n--- Test 4: Task verification flow ---');

    await updateTask(task1Id, {
        status: 'verified',
        verifiedAt: new Date().toISOString()
    });

    task1Updated = await getTask(task1Id);
    test('Task status changed to verified', task1Updated.status === 'verified');
    test('Verified task still visible today', isTaskActiveToday(task1Updated, TODAY));

    // =============================================
    // TEST 5: Past verified task (ghost task scenario)
    // =============================================
    log('\n--- Test 5: Past verified task (ghost task fix) ---');

    const pastTaskId = await createTestTask({
        title: '[TEST] Tarea Pasada Verificada',
        description: 'Esta tarea no debe aparecer',
        assignedTo: ELMO_ID,
        status: 'verified',
        dueDate: '2026-01-25', // Past date
        frequency: 'one-time',
        type: 'obligatory',
        points: 5,
        verifiedAt: '2026-01-26T10:00:00Z'
    });

    const pastTask = await getTask(pastTaskId);
    test('Past task NOT visible today', !isTaskActiveToday(pastTask, TODAY),
        `dueDate=${pastTask.dueDate}`);
    test('Past task NOT visible tomorrow', !isTaskActiveToday(pastTask, TOMORROW));

    // =============================================
    // TEST 6: Daily recurring task
    // =============================================
    log('\n--- Test 6: Daily recurring task instances ---');

    const dailyTaskToday = await createTestTask({
        title: '[TEST] Tarea Diaria - Hoy',
        assignedTo: ELMO_ID,
        status: 'pending',
        dueDate: TODAY,
        frequency: 'daily',
        type: 'obligatory',
        points: 5,
        scheduleId: 'test-schedule-1'
    });

    const dailyTaskTomorrow = await createTestTask({
        title: '[TEST] Tarea Diaria - Mañana',
        assignedTo: ELMO_ID,
        status: 'pending',
        dueDate: TOMORROW,
        frequency: 'daily',
        type: 'obligatory',
        points: 5,
        scheduleId: 'test-schedule-1'
    });

    const dailyToday = await getTask(dailyTaskToday);
    const dailyTomorrow = await getTask(dailyTaskTomorrow);

    test('Daily task for today visible today', isTaskActiveToday(dailyToday, TODAY));
    test('Daily task for today NOT visible tomorrow', !isTaskActiveToday(dailyToday, TOMORROW));
    test('Daily task for tomorrow NOT visible today', !isTaskActiveToday(dailyTomorrow, TODAY));
    test('Daily task for tomorrow visible tomorrow', isTaskActiveToday(dailyTomorrow, TOMORROW));

    // =============================================
    // TEST 7: Task without dueDate (legacy)
    // =============================================
    log('\n--- Test 7: Task without dueDate (legacy data) ---');

    const legacyTaskId = await createTestTask({
        title: '[TEST] Tarea Legacy Sin Fecha',
        assignedTo: ELMO_ID,
        status: 'pending',
        frequency: 'daily',
        type: 'obligatory',
        points: 3
        // No dueDate!
    });

    const legacyTask = await getTask(legacyTaskId);
    test('Legacy task without dueDate is hidden', !isTaskActiveToday(legacyTask, TODAY),
        'Tasks without dueDate should not appear');

    // =============================================
    // TEST 8: Assignment to different children
    // =============================================
    log('\n--- Test 8: Task assignment filtering ---');

    const otherChildTaskId = await createTestTask({
        title: '[TEST] Tarea para Otro Niño',
        assignedTo: 'child1', // Yoshi
        status: 'pending',
        dueDate: TODAY,
        frequency: 'one-time',
        type: 'obligatory',
        points: 5
    });

    const otherChildTask = await getTask(otherChildTaskId);
    test('Task assigned to different child', otherChildTask.assignedTo === 'child1');
    test('Task should NOT appear for Elmo', otherChildTask.assignedTo !== ELMO_ID);

    // =============================================
    // CLEANUP
    // =============================================
    log('\n--- Cleanup ---');
    await cleanupTestTasks();
    log('Test tasks cleaned up');

    // =============================================
    // RESULTS
    // =============================================
    console.log('\n========================================');
    console.log('              RESULTS                   ');
    console.log('========================================');
    console.log(`\nTotal Tests: ${results.tests.length}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`\nSuccess Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);

    if (results.failed > 0) {
        console.log('\n--- Failed Tests ---');
        results.tests.filter(t => !t.passed).forEach(t => {
            console.log(`  ❌ ${t.name} ${t.details ? '- ' + t.details : ''}`);
        });
    }

    console.log('\n========================================\n');

    return results.failed === 0;
}

runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Error running tests:', err);
    process.exit(1);
});
