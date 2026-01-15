
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialise Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../control-tareas-c526c-firebase-adminsdk-fbsvc-1609fa70ce.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ Service Account not found at:", serviceAccountPath);
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function wipeAssignments() {
    console.log("🔥 Starting WIPEOUT of 'tasks' collection (Assignments)...");

    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.get();

    if (snapshot.empty) {
        console.log("✅ 'tasks' collection is already empty.");
        return;
    }

    console.log(`📊 Found ${snapshot.size} assignments to delete.`);

    const batchSize = 400;
    let batch = db.batch();
    let count = 0;
    let totalDeleted = 0;

    for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        count++;

        if (count >= batchSize) {
            await batch.commit();
            totalDeleted += count;
            console.log(`   Deleted ${totalDeleted} docs...`);
            batch = db.batch();
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
        totalDeleted += count;
    }

    console.log(`✅ Successfully deleted ${totalDeleted} assignments.`);
    console.log("   The 'tasks' collection is now empty. Templates are SAFE in 'templates'.");
}

wipeAssignments().catch(console.error);
