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
        console.log(`  ${collectionName}: vacía (0)`);
        return 0;
    }

    // Delete in batches of 500
    let deleted = 0;
    const batchSize = 500;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = docs.slice(i, i + batchSize);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        deleted += chunk.length;
    }

    console.log(`  ${collectionName}: ${deleted} eliminados`);
    return deleted;
}

async function main() {
    console.log('\n🗑️  LIMPIEZA COMPLETA DE TAREAS\n');
    console.log('Eliminando:');

    let total = 0;

    // Limpiar todas las colecciones de tareas
    total += await deleteCollection('tasks');
    total += await deleteCollection('history');
    total += await deleteCollection('taskHistory');
    total += await deleteCollection('schedules');  // Los schedules también

    console.log(`\n✅ Total: ${total} documentos eliminados`);
    console.log('\n📋 Preservados:');
    console.log('  - taskTemplates (plantillas base)');
    console.log('  - users');
    console.log('  - settings');
    console.log('  - categories');

    // Mostrar templates que quedan
    console.log('\n📝 Templates disponibles:');
    const templates = await db.collection('taskTemplates').get();
    templates.docs.forEach(doc => {
        const d = doc.data();
        console.log(`  - ${d.title} (${d.frequency})`);
    });

    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
