
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURATION ---
// User must place the Admin SDK JSON here.
// Getting it from: Firebase Console -> Project Settings -> Service Accounts -> Generate Private Key
const SERVICE_ACCOUNT_PATH = './control-tareas-c526c-firebase-adminsdk-fbsvc-1609fa70ce.json';
const BACKUP_DIR = './backups';

async function backupDatabase() {
    console.log("----------------------------------------");
    console.log("      STARTING DATABASE BACKUP");
    console.log("----------------------------------------");

    // 1. Check Credentials
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error(`❌ ERROR: Service account file not found at: ${SERVICE_ACCOUNT_PATH}`);
        console.error("   Please download your private key from Firebase Console and save it as 'service-account.json' in the root folder.");
        console.error("   (Note: google-services.json is NOT the service account key)");
        process.exit(1);
    }

    // 2. Initialize Firebase
    try {
        const serviceAccount = require(path.resolve(SERVICE_ACCOUNT_PATH));
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
    } catch (error) {
        console.error("❌ ERROR: Failed to initialize Firebase Admin.", error);
        process.exit(1);
    }

    const db = admin.firestore();

    // 3. Prepare Backup Directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
        console.log(`Created backup directory: ${BACKUP_DIR}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const collections = ['users', 'tasks', 'categories', 'rewards', 'redemptions', 'history', 'messages', 'settings'];

    console.log(`Target Collections: ${collections.join(', ')}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log("----------------------------------------");

    // 4. Backup Loop
    for (const colName of collections) {
        process.stdout.write(`Processing '${colName}'... `);
        try {
            const snapshot = await db.collection(colName).get();
            if (snapshot.empty) {
                console.log("EMPTY (Skipped)");
                continue;
            }

            const data: any[] = [];
            snapshot.forEach(doc => {
                data.push({ _id: doc.id, ...doc.data() });
            });

            const filename = `${colName}_${timestamp}.json`;
            const filePath = path.join(BACKUP_DIR, filename);

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ SAVED (${data.length} docs) -> ${filename}`);

        } catch (error) {
            console.log(`❌ FAILED`);
            console.error(`   Error backing up ${colName}:`, error);
        }
    }

    console.log("----------------------------------------");
    console.log("      BACKUP COMPLETED");
    console.log("----------------------------------------");
}

backupDatabase().catch(err => {
    console.error("Fatal Error:", err);
});
