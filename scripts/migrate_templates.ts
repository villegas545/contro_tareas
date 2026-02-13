
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

async function migrate() {
    console.log("🚀 Starting Migration: Splitting Templates from Tasks...");

    const tasksRef = db.collection('tasks');
    const templatesRef = db.collection('templates');

    const snapshot = await tasksRef.get();
    const allDocs = snapshot.docs;

    console.log(`📊 Found ${allDocs.length} total documents in 'tasks'.`);

    let templatesMoved = 0;
    let assignmentsUpdated = 0;
    const batchSize = 400; // Firestore batch limit is 500
    let batch = db.batch();
    let opCheck = 0;

    const commitBatch = async () => {
        if (opCheck > 0) {
            await batch.commit();
            batch = db.batch();
            opCheck = 0;
            console.log("   --> Committed batch.");
        }
    };

    for (const doc of allDocs) {
        const data = doc.data();
        const docId = doc.id;

        if (data.assignedTo === 'pool') {
            // It is a TEMPLATE
            // 1. Create in 'templates' collection
            // Ensure ID is same to keep references valid
            const newTemplateRef = templatesRef.doc(docId);

            // Clean up fields only relevant to assignments if any? 
            // Actually, keep exactly as is for safety, maybe remove 'assignedTo'.
            // But removing assignedTo might confuse some validation if strict?
            // Let's keep data as is, just new collection.
            const templateData = { ...data };
            delete templateData.assignedTo; // No needed in templates collection
            delete templateData.status; // Templates don't have status usually, but UI might use pending default.

            batch.set(newTemplateRef, templateData);

            // 2. Delete from 'tasks' collection
            batch.delete(doc.ref);

            templatesMoved++;
            opCheck += 2;
        } else {
            // It is an ASSIGNMENT
            // Check if it needs `templateId` migration
            if (data.originalTaskId && !data.templateId) {
                batch.update(doc.ref, { templateId: data.originalTaskId });
                assignmentsUpdated++;
                opCheck++;
            }
        }

        if (opCheck >= batchSize) {
            await commitBatch();
        }
    }

    await commitBatch();

    console.log("✅ Migration Complete!");
    console.log(`   - Templates Moved: ${templatesMoved}`);
    console.log(`   - Assignments Updated (Legacy Link Fix): ${assignmentsUpdated}`);
}

migrate().catch(console.error);
