import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';

// --- INLINED DATA TO AVOID IMPORT ISSUES ---

const USERS = [
    {
        id: 'parent1',
        name: 'Papá',
        role: 'parent',
        username: 'papa',
        password: '123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix',
        color: '#6366F1', // Indigo for parent
    },
    {
        id: 'child1',
        name: 'Hijo 1',
        role: 'child',
        username: 'hijo1',
        password: '123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka',
        color: '#3B82F6', // Blue
    },
    {
        id: 'child2',
        name: 'Hijo 2',
        role: 'child',
        username: 'hijo2',
        password: '123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Bob',
        color: '#10B981', // Emerald
    },
    {
        id: 'child3',
        name: 'Hijo 3',
        role: 'child',
        username: 'hijo3',
        password: '123',
        avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Charlie',
        color: '#F59E0B', // Amber
    },
];

const TASKS = [
    // --- TAREAS ASIGNADAS (Ejemplo inicial para hijo1) ---
    {
        id: '1',
        title: 'Lavarse los dientes (Mañana)',
        description: 'Cepillarse los dientes después de desayunar',
        assignedTo: 'child1',
        createdBy: 'parent1',
        status: 'pending',
        type: 'obligatory',
        frequency: 'daily',
        dueTime: '09:00',
    },
    {
        id: '2',
        title: 'Bañarse',
        description: 'Darse un baño completo',
        assignedTo: 'child1',
        createdBy: 'parent1',
        status: 'pending',
        type: 'obligatory',
        frequency: 'daily',
        dueTime: '20:00',
    },

    // --- PLANTILLAS DE TAREAS (POOL DE TAREAS) ---
    // Higiene y Cuidado Personal
    {
        id: 'pool_hygiene_1',
        title: 'Lavarse las manos',
        description: 'Lavarse las manos antes de comer',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'obligatory',
        frequency: 'daily',
        points: 2
    },
    {
        id: 'pool_hygiene_2',
        title: 'Cortarse las uñas',
        description: 'Revisar y cortar uñas de manos y pies si es necesario',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'obligatory',
        frequency: 'weekly',
        points: 5
    },

    // Hogar y Orden
    {
        id: 'pool_home_1',
        title: 'Hacer la cama',
        description: 'Estirar sábanas y acomodar almohadas al levantarse',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'obligatory',
        frequency: 'daily',
        points: 5,
        dueTime: '10:00'
    },
    {
        id: 'pool_home_2',
        title: 'Limpiar su habitación',
        description: 'Guardar juguetes, ropa sucia al cesto y despejar el suelo',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'obligatory',
        frequency: 'weekly',
        points: 20
    },
    {
        id: 'pool_home_3',
        title: 'Sacar la basura',
        description: 'Recoger la basura de los baños y cocina y llevarla al contenedor',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'additional',
        frequency: 'weekly',
        points: 15
    },
    {
        id: 'pool_home_4',
        title: 'Lavar los platos',
        description: 'Lavar, secar y guardar los platos después de la comida',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'additional',
        frequency: 'daily',
        points: 15
    },
    {
        id: 'pool_home_5',
        title: 'Poner la mesa',
        description: 'Colocar platos, vasos y cubiertos antes de comer',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'obligatory',
        frequency: 'daily',
        points: 3
    },
    {
        id: 'pool_home_6',
        title: 'Doblar ropa limpia',
        description: 'Ayudar a doblar la ropa seca y separarla',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'additional',
        frequency: 'weekly',
        points: 10
    },
    {
        id: 'pool_home_7',
        title: 'Regar las plantas',
        description: 'Echar agua a las macetas de la casa',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'additional',
        frequency: 'weekly',
        points: 5
    },
    {
        id: 'pool_home_8',
        title: 'Aspirar/Barrer la sala',
        description: 'Limpiar el piso de la sala de estar',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'additional',
        frequency: 'weekly',
        points: 15
    },

    // Estudio y Desarrollo
    {
        id: 'pool_study_1',
        title: 'Hacer la tarea',
        description: 'Completar los deberes escolares del día',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'obligatory',
        frequency: 'daily',
        points: 10,
        timeWindow: {
            start: '15:00',
            end: '19:00'
        }
    },
    {
        id: 'pool_study_2',
        title: 'Leer 20 minutos',
        description: 'Lectura de un libro de su elección',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'obligatory',
        frequency: 'daily',
        points: 10
    },
    {
        id: 'pool_study_3',
        title: 'Practicar instrumento/deporte',
        description: '30 minutos de práctica enfocada',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'additional',
        frequency: 'daily',
        points: 15
    },
    {
        id: 'pool_study_4',
        title: 'Organizar mochila',
        description: 'Preparar los libros y cuadernos para el día siguiente',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'obligatory',
        frequency: 'daily',
        points: 3,
        dueTime: '21:00'
    },

    // Mascotas
    {
        id: 'pool_pet_1',
        title: 'Pasear al perro',
        description: 'Salir a caminar con la mascota por 15 min',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'additional',
        frequency: 'daily',
        points: 10
    },
    {
        id: 'pool_pet_2',
        title: 'Alimentar mascota',
        description: 'Servir comida y cambiar el agua',
        assignedTo: 'pool',
        createdBy: 'system',
        status: 'pending',
        type: 'obligatory',
        frequency: 'daily',
        points: 5
    }
];

// --- END INLINED DATA ---

const seedDatabase = async () => {
    // ... inicio de función existente ...
    console.log('🌱 Starting database initialization...');

    // Validate Env Vars
    if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY) {
        console.error('❌ Error: Environment variables not loaded correctly.');
        process.exit(1);
    }

    const firebaseConfig = {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    try {
        const batch = writeBatch(db);

        // 1. Seed Users
        console.log('Creating users...');
        USERS.forEach((user) => {
            const userRef = doc(db, 'users', user.id);
            const { id: _id, ...userData } = user; // eslint-disable-line @typescript-eslint/no-unused-vars
            batch.set(userRef, userData);
        });

        // 2. Seed Tasks
        console.log('Creating tasks...');
        TASKS.forEach((task) => {
            const taskRef = doc(db, 'tasks', task.id);
            const { id: _id, ...taskData } = task; // eslint-disable-line @typescript-eslint/no-unused-vars
            batch.set(taskRef, taskData);
        });

        // 3. Seed Messages
        console.log('Creating default messages...');
        const defaultMsgs = [
            "¡Tú puedes con todo! 🚀",
            "El esfuerzo de hoy es el éxito de mañana. 💪",
            "¡Gran trabajo! Sigue así. 🌟",
            "No te rindas, cada paso cuenta. 👣",
            "Eres más capaz de lo que imaginas. ✨",
            "La disciplina es el puente entre metas y logros. 🌉",
            "¡Hoy es un buen día para tener un gran día! ☀️",
            "Tu actitud determina tu dirección. 🧭",
            "Cree en ti mismo y serás imparable. 🦅",
            "Pequeños progresos cada día suman grandes resultados. 📈",
            "¡Bien hecho! Estoy orgulloso de tu esfuerzo. 👏",
            "La constancia es la clave del éxito. 🗝️",
            "Sé la mejor versión de ti mismo. 💎",
            "¡Sigue brillando! ✨",
            "Cada error es una nueva lección. 📚",
            "Hacer lo correcto te hace sentir bien. 😌",
            "¡Vamos! Tú tienes el control. 🎮",
            "Gracias por ayudar en casa. 🏡",
            "Tu ayuda es muy valiosa para la familia. ❤️",
            "¡Impresionante trabajo! 😎"
        ];
        defaultMsgs.forEach((msg) => {
            const msgRef = doc(collection(db, 'messages'));
            batch.set(msgRef, { text: msg });
        });
        // ... end of function ...

        await batch.commit();
        console.log('✅ Database initialized successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
};

seedDatabase();
