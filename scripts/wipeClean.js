const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const COLLECTION_NAME = process.argv[2];
const BATCH_SIZE = 50;

if (!COLLECTION_NAME) {
    console.error("❌ Error: Debes especificar el nombre de la colección a borrar.");
    console.error("Uso: node scripts/wipeClean.js <nombre_coleccion>");
    process.exit(1);
}

// Check for Service Account Key
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error("\n⚠️  FALTA ARCHIVO DE CREDENCIALES ⚠️");
    console.error(`No encontré el archivo: ${serviceAccountPath}`);
    console.error("\nPARA SOLUCIONARLO:");
    console.error("1. Ve a la Consola de Firebase > Configuración del proyecto > Cuentas de servicio.");
    console.error("2. Haz clic en 'Generar nueva clave privada'.");
    console.error("3. Descarga el archivo, renómbralo a 'serviceAccountKey.json' y ponlo en la raíz de este proyecto.");
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
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

async function deleteCollection(collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function main() {
    console.log(`\n🔥 Iniciando borrado masivo de la colección: '${COLLECTION_NAME}'...`);
    console.log("   (Esto puede tardar unos segundos dependiendo de la cantidad de datos)\n");

    try {
        await deleteCollection(COLLECTION_NAME, BATCH_SIZE);
        console.log(`\n✅ ÉXITO: La colección '${COLLECTION_NAME}' ha sido eliminada por completo.`);
    } catch (error) {
        console.error("\n❌ ERROR al intentar borrar:");
        console.error(error);
    }
}

main();
