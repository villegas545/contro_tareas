const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function deleteCollection(collectionName) {
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
        console.log(`  ${collectionName}: ya está vacía`);
        return 0;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`  ${collectionName}: ${snapshot.size} documentos eliminados`);
    return snapshot.size;
}

async function main() {
    console.log('\n🗑️  LIMPIANDO BASE DE DATOS\n');
    console.log('Colecciones a limpiar:');

    let total = 0;

    // Limpiar tasks
    total += await deleteCollection('tasks');

    // Limpiar history
    total += await deleteCollection('history');

    // Limpiar taskHistory (por si existe con otro nombre)
    total += await deleteCollection('taskHistory');

    console.log(`\n✅ Total eliminados: ${total} documentos`);
    console.log('\n📋 Colecciones preservadas:');
    console.log('  - schedules (templates)');
    console.log('  - users');
    console.log('  - settings');
    console.log('  - rewards');
    console.log('  - redemptions');
    console.log('  - categories');

    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
