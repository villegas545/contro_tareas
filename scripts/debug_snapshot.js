/**
 * Firebase Debug Snapshot
 * Generates a JSON file with the current state of all Firebase collections
 * Run with: node scripts/debug_snapshot.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function getCollection(name) {
    const snapshot = await db.collection(name).get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    console.log('📸 Generating Firebase Debug Snapshot...\n');

    const snapshot = {
        generatedAt: new Date().toISOString(),
        collections: {}
    };

    // Get all relevant collections
    const collections = ['tasks', 'schedules', 'history', 'taskHistory', 'users', 'settings'];

    for (const colName of collections) {
        try {
            const data = await getCollection(colName);
            snapshot.collections[colName] = {
                count: data.length,
                documents: data
            };
            console.log(`  ✅ ${colName}: ${data.length} documents`);
        } catch (err) {
            snapshot.collections[colName] = { error: err.message };
            console.log(`  ❌ ${colName}: ${err.message}`);
        }
    }

    // Add summary
    snapshot.summary = {
        tasks: {
            total: snapshot.collections.tasks?.count || 0,
            byStatus: {},
            byDate: {}
        },
        schedules: {
            total: snapshot.collections.schedules?.count || 0,
            active: 0
        }
    };

    // Calculate task stats
    if (snapshot.collections.tasks?.documents) {
        for (const task of snapshot.collections.tasks.documents) {
            // By status
            const status = task.status || 'unknown';
            snapshot.summary.tasks.byStatus[status] = (snapshot.summary.tasks.byStatus[status] || 0) + 1;

            // By date
            const date = task.dueDate || 'no-date';
            snapshot.summary.tasks.byDate[date] = (snapshot.summary.tasks.byDate[date] || 0) + 1;
        }
    }

    // Calculate schedule stats
    if (snapshot.collections.schedules?.documents) {
        snapshot.summary.schedules.active = snapshot.collections.schedules.documents.filter(s => s.active).length;
    }

    // Write to file
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    const filename = `debug_${timestamp}.json`;
    const filepath = path.join(logsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));

    console.log(`\n📁 Snapshot saved to: logs/${filename}`);
    console.log('\n--- SUMMARY ---');
    console.log(`Tasks: ${snapshot.summary.tasks.total}`);
    console.log(`  By Status:`, snapshot.summary.tasks.byStatus);
    console.log(`  By Date:`, snapshot.summary.tasks.byDate);
    console.log(`Schedules: ${snapshot.summary.schedules.total} (${snapshot.summary.schedules.active} active)`);

    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
