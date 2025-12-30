const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, where, deleteDoc, addDoc } = require("firebase/firestore");

// Configuración de Firebase - Asegúrate de que las variables de entorno estén definidas
// O reemplaza estos valores con tus credenciales reales si ejecutas localmente sin env vars
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Polyfill para fetch si es necesario (Node < 18)
if (typeof globalThis.fetch === 'undefined') {
    console.warn("Fetch API no detectada. Asegúrate de usar Node 18+ o instalar node-fetch.");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedTemplates() {
    try {
        console.log("🚀 Iniciando proceso de siembra de plantillas...");

        // 1. Leer el archivo JSON
        const templatesPath = path.join(__dirname, 'task_templates_seed.json');
        if (!fs.existsSync(templatesPath)) {
            throw new Error("El archivo task_templates_seed.json no existe.");
        }

        const rawData = fs.readFileSync(templatesPath, 'utf-8');
        let templates = [];
        try {
            templates = JSON.parse(rawData);
        } catch (e) {
            console.error("Error parseando JSON:", e);
            return;
        }

        console.log(`📄 Encontradas ${templates.length} plantillas en el JSON.`);

        // 2. Limpiar plantillas existentes (assignedTo == 'pool')
        console.log("🧹 Limpiando plantillas existentes en Firestore...");
        const q = query(collection(db, "tasks"), where("assignedTo", "==", "pool"));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            console.log(`✅ ${snapshot.size} plantillas antiguas eliminadas.`);
        } else {
            console.log("ℹ️ No se encontraron plantillas antiguas para borrar.");
        }

        // 3. Insertar nuevas plantillas
        if (templates.length === 0) {
            console.log("⚠️ El JSON está vacío. No se insertarán nuevas plantillas.");
            process.exit(0);
        }

        console.log("🌱 Insertando nuevas plantillas...");
        const insertPromises = templates.map(template => {
            // Sanitizar y asegurar campos obligatorios
            const newTemplate = {
                title: template.title || "Sin Título",
                description: template.description || "",
                points: template.points !== undefined ? template.points : 10,
                assignedTo: 'pool', // Forzar que sea plantilla
                createdBy: 'system-seed',
                status: 'pending',
                type: template.isResponsibility ? 'obligatory' : 'additional',
                frequency: template.frequency || 'daily',
                isResponsibility: template.isResponsibility !== undefined ? template.isResponsibility : true,
                isSchool: template.isSchool !== undefined ? template.isSchool : false,
                createdAt: new Date().toISOString(),
                // Campos opcionales
                ...(template.timeWindow ? { timeWindow: template.timeWindow } : {}),
                ...(template.dueTime ? { dueTime: template.dueTime } : {})
            };
            return addDoc(collection(db, "tasks"), newTemplate);
        });

        await Promise.all(insertPromises);
        console.log(`✨ ¡Éxito! ${templates.length} plantillas insertadas correctamente.`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Error en el proceso:", error);
        process.exit(1);
    }
}

seedTemplates();
