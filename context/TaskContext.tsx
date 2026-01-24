import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, User, TaskHistory, Reward, Redemption, GlobalSettings, Category, TaskTemplate, JustificationReason, Language } from '../types';
import { translations } from '../utils/translations';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, deleteField, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { sendPushNotification, scheduleRemindersForTasks } from '../utils/notifications';
import { USERS, TASKS } from '../data/mockData';

// Helper to check for Test Mode
const isTestMode = () => {
    // Check for a specific window property set by Cypress or URL param
    // Standard Cypress detection: window.Cypress exists
    // Since we are inside the app, we check if window is defined
    if (typeof window !== 'undefined') {
        // @ts-ignore
        return !!window.Cypress;
    }
    return false;
};

interface TaskContextType {
    currentUser: User | null;
    tasks: Task[];
    templates: TaskTemplate[];
    users: User[];
    history: TaskHistory[];
    login: (username: string, password?: string) => boolean;
    logout: () => void;
    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    completeTask: (taskId: string, evidenceUrl?: string) => void;
    verifyTask: (taskId: string) => void;
    failTask: (taskId: string) => void;
    rejectTask: (taskId: string) => void;
    messages: string[];
    addMessage: (text: string) => void;
    updateMessage: (index: number, newText: string) => void;
    deleteMessage: (index: number) => void;
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (userId: string, updates: Partial<User>) => void;
    deleteUser: (userId: string) => void;

    // Rewards System
    rewards: Reward[];
    redemptions: Redemption[];
    addReward: (reward: Omit<Reward, 'id'>) => void;
    deleteReward: (rewardId: string) => void;
    redeemReward: (redemption: Omit<Redemption, 'id' | 'requestDate' | 'status'>) => void;
    approveRedemption: (redemptionId: string) => void;
    rejectRedemption: (redemptionId: string) => void;
    isTaskActiveToday: (task: Task) => boolean;
    globalSettings: GlobalSettings | null;
    updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
    getLocalDateString: () => string;

    // Categories
    categories: Category[];
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (categoryId: string, updates: Partial<Category>) => void;
    deleteCategory: (categoryId: string) => void;
    reorderCategories: (newOrder: Category[]) => void;
    // Justifications
    justificationReasons: JustificationReason[];
    addJustificationReason: (text: string) => void;
    deleteJustificationReason: (id: string) => void;

    // I18n
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [rawTasks, setRawTasks] = useState<Task[]>([]);
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [justificationReasons, setJustificationReasons] = useState<JustificationReason[]>([]);
    const [history, setHistory] = useState<TaskHistory[]>([]);
    const [messages, setMessages] = useState<string[]>([]);
    const [messageIds, setMessageIds] = useState<string[]>([]); // To track IDs for deletion

    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
    const [language, setLanguageState] = useState<Language>('es');
    const sessionChecked = React.useRef(false);

    // Subscribe to Firestore collections OR Load Mocks
    // Expose Context for Testing (Refresh when state changes)
    useEffect(() => {
        if (isTestMode() && typeof window !== 'undefined') {
            // @ts-ignore
            window.testContext = {
                reset: () => {
                    // Resets to initial Mocks
                    setUsers(USERS);
                    setRawTasks(TASKS);
                    setRewards([]);
                    setRedemptions([]);
                    setMessages([]);
                    setCategories([]);
                    setHistory([]);
                    setTemplates([]);
                },
                getState: () => ({ users, rawTasks, rewards, redemptions, messages, templates }),
                setUsers,
                setRawTasks,
                setRewards,
                setMessages,
                setRedemptions,
                setHistory,
                setTemplates,
            };
        }
    }, [users, rawTasks, rewards, redemptions, messages, templates]);



    // Subscribe to Firestore collections OR Load Mocks (Initial Load)
    useEffect(() => {
        if (isTestMode()) {
            console.log("⚠️ Running in TEST MODE - Using Mock Data");
            if (rawTasks.length === 0 && users.length === 0) {
                setUsers(USERS);
                setRawTasks(TASKS);
            }
            return () => { };
        }

        const usersUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(list);
        });

        const templatesUnsub = onSnapshot(collection(db, "templates"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskTemplate));
            setTemplates(list);
        });

        const tasksUnsub = onSnapshot(collection(db, "tasks"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            setRawTasks(list);
        });

        // History
        const historyUnsub = onSnapshot(collection(db, "history"), (snapshot) => {
            const historyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskHistory));
            setHistory(historyList);
        });

        // Messages
        const messagesUnsub = onSnapshot(collection(db, "messages"), (snapshot) => {
            const ids = snapshot.docs.map(doc => doc.id);
            const texts = snapshot.docs.map(doc => doc.data().text as string);
            setMessageIds(ids);
            setMessages(texts);
        });

        // Rewards
        const rewardsUnsub = onSnapshot(collection(db, "rewards"), (snapshot) => {
            const rewardsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
            setRewards(rewardsList);
        });

        // Redemptions
        const redemptionsUnsub = onSnapshot(collection(db, "redemptions"), (snapshot) => {
            const redemptionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Redemption));
            setRedemptions(redemptionsList);
        });

        // Categories
        const categoriesUnsub = onSnapshot(collection(db, "categories"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            list.sort((a, b) => (a.order || 0) - (b.order || 0));
            setCategories(list);
        });

        // Settings
        const settingsUnsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as GlobalSettings;
                setGlobalSettings(data);
                if (data.language) setLanguageState(data.language);
            } else {
                setGlobalSettings({ id: 'general', isVacationMode: false, language: 'es' });
            }
        });

        // Justifications
        const justificationsUnsub = onSnapshot(collection(db, "justification_reasons"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JustificationReason));
            setJustificationReasons(list);
        });

        return () => {
            usersUnsub();
            templatesUnsub();
            tasksUnsub();
            historyUnsub();
            messagesUnsub();
            rewardsUnsub();
            redemptionsUnsub();
            categoriesUnsub();
            settingsUnsub();
            justificationsUnsub();
        };
    }, []);

    // HYDRATION: Merge Templates + RawTasks -> Public Tasks
    useEffect(() => {
        // 1. Convert Templates to "Pool Tasks" for UI compatibility
        const templateTasks = templates.map(t => ({
            ...t,
            assignedTo: 'pool',
            status: 'pending',
        } as Task));

        // 2. Hydrate Assignments
        const hydratedAssignments = rawTasks.map(assignment => {
            // Filter legacy pool tasks from rawTasks (we use templates collection now)
            if (assignment.assignedTo === 'pool') return null;

            const tId = assignment.templateId || assignment.originalTaskId;
            if (tId) {
                const template = templates.find(t => t.id === tId);
                if (template) {
                    return {
                        ...assignment, // Base
                        ...template,   // Overwrite with Template Latest Data
                        // Restore Assignment Specifics that might be overwritten if template has them undefined?
                        // Template fields are: title, description, points, type, etc.
                        // Assignment fields are: id, assignedTo, status, dates.
                        // We want Template to Win for Title/Points.
                        // We want Assignment to Win for Status/Dates.
                        id: assignment.id,
                        assignedTo: assignment.assignedTo,
                        status: assignment.status,
                        dueDate: assignment.dueDate,
                        dueTime: assignment.dueTime || assignment.dueTime, // assignment wins
                        completedAt: assignment.completedAt,
                        verifiedAt: assignment.verifiedAt,
                        evidenceUrl: assignment.evidenceUrl,
                        templateId: tId,
                        originalTaskId: tId,
                        recurrenceDays: assignment.recurrenceDays, // Restore recurrenceDays override
                        shift: assignment.shift, // Restore shift override if applicable
                    } as Task;
                }
            }
            return assignment;
        }).filter(Boolean) as Task[];

        setTasks([...templateTasks, ...hydratedAssignments]);
    }, [rawTasks, templates]);

    const updateGlobalSettings = async (settings: Partial<GlobalSettings>) => {
        if (isTestMode()) {
            // @ts-ignore
            setGlobalSettings(prev => ({ ...prev, ...settings }));
            return;
        }
        await setDoc(doc(db, "settings", "general"), settings, { merge: true });
    };

    const addMessage = async (text: string) => {
        if (isTestMode()) {
            setMessages(prev => [...prev, text]);
            setMessageIds(prev => [...prev, Date.now().toString()]);
            return;
        }
        await addDoc(collection(db, "messages"), { text });
    };

    const updateMessage = async (index: number, newText: string) => {
        if (isTestMode()) {
            setMessages(prev => prev.map((msg, i) => i === index ? newText : msg));
            return;
        }
        const idToUpdate = messageIds[index];
        if (idToUpdate) await updateDoc(doc(db, "messages", idToUpdate), { text: newText });
    };

    const deleteMessage = async (index: number) => {
        if (isTestMode()) {
            setMessages(prev => prev.filter((_, i) => i !== index));
            setMessageIds(prev => prev.filter((_, i) => i !== index));
            return;
        }
        const idToDelete = messageIds[index];
        if (idToDelete) await deleteDoc(doc(db, "messages", idToDelete));
    };

    const addUser = async (newUser: Omit<User, 'id'>) => {
        if (isTestMode()) {
            // @ts-ignore
            setUsers(prev => [...prev, { id: Date.now().toString(), ...newUser }]);
            return;
        }
        await addDoc(collection(db, "users"), newUser);
    };

    const updateUser = async (userId: string, updates: Partial<User>) => {
        if (isTestMode()) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
            return;
        }
        await updateDoc(doc(db, "users", userId), updates);
    };

    const deleteUser = async (userId: string) => {
        if (isTestMode()) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            return;
        }
        await deleteDoc(doc(db, "users", userId));
    };

    // Sync currentUser with real-time updates from users collection
    useEffect(() => {
        if (currentUser) {
            const updatedUser = users.find(u => u.id === currentUser.id);
            // Update only if data changed to avoid infinite loops
            if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
                setCurrentUser(updatedUser);
            }
        }
    }, [users]);

    // Restore Session on Mount
    useEffect(() => {
        if (!sessionChecked.current && users.length > 0) {
            const restore = async () => {
                try {
                    const savedId = await AsyncStorage.getItem('loggedInUserId');
                    if (savedId) {
                        const user = users.find(u => u.id === savedId);
                        if (user) setCurrentUser(user);
                    }
                } catch (e) {
                    console.error("Failed to restore session", e);
                } finally {
                    sessionChecked.current = true;
                }
            };
            restore();
        }
    }, [users]);

    const login = (username: string, password?: string) => {
        const user = users.find((u) => u.username === username);
        if (user && user.password === password) {
            setCurrentUser(user);
            AsyncStorage.setItem('loggedInUserId', user.id);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        AsyncStorage.removeItem('loggedInUserId');
    };

    const addTask = async (newTask: Omit<Task, 'id'>) => {
        if (isTestMode()) {
            if (newTask.assignedTo === 'pool') {
                // @ts-ignore
                setTemplates(prev => [...prev, { id: Date.now().toString(), ...newTask }]);
            } else {
                // @ts-ignore
                setRawTasks(prev => {
                    const updated = [...prev, { id: Date.now().toString(), ...newTask }];
                    return updated;
                });
            }
            return;
        }

        if (newTask.assignedTo === 'pool') {
            // Create Template
            // We use 'addDoc' but we need to match TaskTemplate type.
            // Omit irrelevant fields for template if needed, or just cast.
            const { id, ...templateData } = newTask as any;
            await addDoc(collection(db, "templates"), templateData);
        } else {
            // Create Assignment
            await addDoc(collection(db, "tasks"), newTask);

            // Notify Child
            const child = users.find(u => u.id === newTask.assignedTo);
            console.log(`[Notification] Attempting to notify child selected for task: ${child?.name}`);

            if (child && child.pushToken) {
                if (child.id === currentUser?.id) {
                    console.log("[Notification] Skipping notification: User assigned task to themselves.");
                } else {
                    console.log(`[Notification] Sending Push to token: ${child.pushToken.substring(0, 10)}...`);
                    sendPushNotification(child.pushToken, "Nueva Tarea", `Tienes una nueva tarea: "${newTask.title}"`);
                }
            } else {
                console.log("[Notification] Cannot notify: Child not found or has no Push Token.");
            }
        }
    };

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        // Check if it's a template
        const isTemplate = templates.some(t => t.id === taskId);

        if (isTestMode()) {
            if (isTemplate) {
                setTemplates(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
            } else {
                setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
            }
            return;
        }

        if (isTemplate) {
            console.log(`[Update] Updating Template ${taskId}`);
            await updateDoc(doc(db, "templates", taskId), updates);
            // No manual propagation needed - Hydration handles it!
        } else {
            console.log(`[Update] Updating Assignment ${taskId}`);
            await updateDoc(doc(db, "tasks", taskId), updates);
        }
    };

    const deleteTask = async (taskId: string) => {
        if (isTestMode()) {
            const isTemplate = templates.some(t => t.id === taskId);
            if (isTemplate) {
                setTemplates(prev => prev.filter(t => t.id !== taskId));
                setRawTasks(prev => prev.filter(t => t.templateId !== taskId && t.originalTaskId !== taskId));
            } else {
                setRawTasks(prev => prev.filter(t => t.id !== taskId));
            }
            return;
        }

        const isTemplate = templates.some(t => t.id === taskId);

        if (isTemplate) {
            console.log(`[Delete] Deleting Template ${taskId} and linked assignments`);
            await deleteDoc(doc(db, "templates", taskId));

            // Cascade Delete Assignments linked to this template
            // Use rawTasks to find them
            const linked = rawTasks.filter(t => t.templateId === taskId || t.originalTaskId === taskId);
            const promises = linked.map(t => deleteDoc(doc(db, "tasks", t.id)));
            await Promise.all(promises);
        } else {
            console.log(`[Delete] Deleting Assignment ${taskId}`);
            await deleteDoc(doc(db, "tasks", taskId));
        }
    };

    const completeTask = async (taskId: string, evidenceUrl?: string) => {
        // Validation logic remains, but ensure we check hydrated tasks
        const task = tasks.find(t => t.id === taskId); // Hydrated lookup
        if (!task) return;

        if (task.timeWindow) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            if (currentTime < task.timeWindow.start || currentTime > task.timeWindow.end) {
                throw new Error(`Esta tarea solo se puede completar entre ${task.timeWindow.start} y ${task.timeWindow.end}`);
            }
        }

        if (isTestMode()) {
            setRawTasks(prev => prev.map(t => {
                if (t.id === taskId) {
                    return {
                        ...t,
                        status: 'completed',
                        completedAt: new Date().toISOString(),
                        evidenceUrl: evidenceUrl || t.evidenceUrl
                    };
                }
                return t;
            }));
            return;
        }

        const updates: any = {
            status: 'completed',
            completedAt: new Date().toISOString()
        };
        if (evidenceUrl) updates.evidenceUrl = evidenceUrl;

        await updateDoc(doc(db, "tasks", taskId), updates);

        // Notify Parents (Debounced)
        const child = users.find(u => u.id === task.assignedTo);
        if (child) {
            queueTaskCompletionNotification(child.id, child.name, task.title);
        }
    };

    // Notification Queue Ref
    const notificationQueue = React.useRef<Record<string, { childName: string, tasks: string[], timeout: NodeJS.Timeout }>>({});

    const queueTaskCompletionNotification = (childId: string, childName: string, taskTitle: string) => {
        // Clear existing timeout
        if (notificationQueue.current[childId]) {
            clearTimeout(notificationQueue.current[childId].timeout);
            notificationQueue.current[childId].tasks.push(taskTitle);
        } else {
            notificationQueue.current[childId] = {
                childName,
                tasks: [taskTitle],
                timeout: setTimeout(() => { }, 0) // Placeholder
            };
        }

        // Set new timeout (60 seconds)
        notificationQueue.current[childId].timeout = setTimeout(() => {
            const entry = notificationQueue.current[childId];
            if (!entry) return;

            const count = entry.tasks.length;
            let title = "Tareas Realizadas";
            let body = "";

            if (count === 1) {
                body = `${entry.childName} completó: "${entry.tasks[0]}"`;
            } else if (count <= 3) {
                body = `${entry.childName} completó ${count} tareas: ${entry.tasks.join(", ")}`;
            } else {
                const firstTwo = entry.tasks.slice(0, 2).join(", ");
                const remaining = count - 2;
                body = `${entry.childName} completó ${count} tareas: ${firstTwo} y ${remaining} más.`;
            }

            // Send to all parents
            const parents = users.filter(u => u.role === 'parent');
            parents.forEach(parent => {
                if (parent.pushToken) {
                    sendPushNotification(parent.pushToken, title, body);
                }
            });

            // Cleanup
            delete notificationQueue.current[childId];
        }, 60000); // 1 minute delay
    };

    const verifyTask = async (taskId: string) => {
        if (isTestMode()) {
            setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'verified', verifiedAt: new Date().toISOString() } : t));
            return;
        }

        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            console.warn(`[verifyTask] Task ${taskId} not found`);
            return;
        }

        // Add to history
        await addDoc(collection(db, "history"), {
            taskId: task.id,
            taskTitle: task.title,
            assignedTo: task.assignedTo,
            points: task.points || 0,
            status: 'verified',
            isResponsibility: task.isResponsibility || false,
            date: new Date().toISOString().split('T')[0],
            completedAt: task.completedAt || new Date().toISOString(),
        });

        // Update task status
        await updateDoc(doc(db, "tasks", taskId), {
            status: 'verified',
            verifiedAt: new Date().toISOString(),
        });
    };

    const failTask = async (taskId: string) => {
        if (isTestMode()) {
            const task = tasks.find(t => t.id === taskId);
            setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'expired' } : t));

            if (task) {
                // @ts-ignore
                setHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    taskId: task.id,
                    taskTitle: task.title,
                    assignedTo: task.assignedTo,
                    points: 0,
                    status: 'missed',
                    isResponsibility: task.isResponsibility || false,
                    date: new Date().toISOString().split('T')[0]
                }]);
            }
            return;
        }

        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            console.warn(`[failTask] Task ${taskId} not found`);
            return;
        }

        await addDoc(collection(db, "history"), {
            taskId: task.id,
            taskTitle: task.title,
            assignedTo: task.assignedTo,
            points: 0,
            status: 'missed',
            isResponsibility: task.isResponsibility || false,
            date: new Date().toISOString().split('T')[0],
        });

        await updateDoc(doc(db, "tasks", taskId), { status: 'expired' });
    };

    const rejectTask = async (taskId: string) => {
        if (isTestMode()) {
            setRawTasks(prev => prev.map(t => t.id === taskId ? {
                ...t,
                status: 'pending',
                completedAt: undefined
            } : t));
            return;
        }

        await updateDoc(doc(db, "tasks", taskId), {
            status: 'pending',
            completedAt: deleteField()
        });

        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const child = users.find(u => u.id === task.assignedTo);
            if (child && child.pushToken) {
                sendPushNotification(child.pushToken, "Tarea Rechazada", `Tu tarea "${task.title}" ha sido rechazada.`);
            }
        }
    };

    // Rewards & Redemptions Logic
    const addReward = async (reward: Omit<Reward, 'id'>) => {
        if (isTestMode()) {
            // @ts-ignore
            setRewards(prev => [...prev, { id: Date.now().toString(), ...reward }]);
            return;
        }
        await addDoc(collection(db, "rewards"), reward);
    };

    const deleteReward = async (rewardId: string) => {
        if (isTestMode()) {
            setRewards(prev => prev.filter(r => r.id !== rewardId));
            return;
        }
        await deleteDoc(doc(db, "rewards", rewardId));
    };

    const redeemReward = async (redemption: Omit<Redemption, 'id' | 'requestDate' | 'status'>) => {
        if (isTestMode()) {
            // @ts-ignore
            setRedemptions(prev => [...prev, {
                id: Date.now().toString(),
                ...redemption,
                status: 'pending',
                requestDate: new Date().toISOString()
            }]);
            return;
        }

        // We do NOT deduct points yet. Only when approved.
        await addDoc(collection(db, "redemptions"), {
            ...redemption,
            status: 'pending',
            requestDate: new Date().toISOString()
        });
    };

    const approveRedemption = async (redemptionId: string) => {
        if (isTestMode()) {
            setRedemptions(prev => prev.map(r => r.id === redemptionId ? { ...r, status: 'approved', redeemedDate: new Date().toISOString() } : r));
            // Add negative history
            const r = redemptions.find(x => x.id === redemptionId);
            if (r) {
                // @ts-ignore
                setHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    taskId: 'redemption-' + r.id,
                    taskTitle: `Canje: ${r.rewardTitle}`,
                    assignedTo: r.childId,
                    points: -Math.abs(r.cost),
                    status: 'verified',
                    date: new Date().toISOString().split('T')[0],
                    completedAt: new Date().toISOString()
                }]);
            }
            return;
        }

        const redemption = redemptions.find(r => r.id === redemptionId);
        if (!redemption || redemption.status !== 'pending') return;

        // Deduct points from history?
        // Actually, we calculate points dynamically from history. 
        // So we need to add a NEGATIVE entry to history to represent "Usage" or "Redemption".
        // Let's create a special history type entry for this.

        await addDoc(collection(db, "history"), {
            taskId: 'redemption-' + redemptionId, // Fake ID
            taskTitle: `Canje: ${redemption.rewardTitle}`,
            assignedTo: redemption.childId,
            points: -Math.abs(redemption.cost), // Negative points
            status: 'verified', // Automatically verified
            date: new Date().toISOString().split('T')[0],
            completedAt: new Date().toISOString()
        });

        await updateDoc(doc(db, "redemptions", redemptionId), {
            status: 'approved',
            redeemedDate: new Date().toISOString()
        });
    };

    const rejectRedemption = async (redemptionId: string) => {
        if (isTestMode()) {
            setRedemptions(prev => prev.map(r => r.id === redemptionId ? { ...r, status: 'rejected' } : r));
            return;
        }
        await updateDoc(doc(db, "redemptions", redemptionId), { status: 'rejected' });
    };

    // Recurring tasks check logic - Adapted for centralized execution?
    // In a real app, this should be a backend function. 
    // Here, we can let ONLY the logged-in parent run this check to avoid conflicts, or just run it locally.
    // Helper: Local Date String YYYY-MM-DD (Timezone Aware)
    const getLocalDateString = (date: Date = new Date()) => {
        try {
            const timeZone = globalSettings?.timezone || 'America/Chicago';
            return new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone
            }).format(date);
        } catch (e) {
            // Fallback if timezone invalid or en-CA not supported
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    };

    // Recurring tasks check logic
    const processDailyReset = async () => {
        if (tasks.length === 0 || history.length === 0) return;

        // Check Global Vacation Mode
        if (globalSettings?.isVacationMode) return;

        const now = new Date();
        const todayStr = getLocalDateString(now);

        // Yesterday for checking missed daily tasks
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);

        // We need to iterate carefully. 
        // Note: Running this on every client is risky for writes. 
        // Ideally, we check "Has this been processed?" via a daily log doc or similar.
        // For this local-first simpler scope, we check if the *result* exists (History entry).

        for (const task of tasks) {
            // 1. One Time Tasks: Check Expiration
            if (task.frequency === 'one-time' && task.status === 'pending' && task.dueDate) {
                // Check if due date is clearly in the past
                // task.dueDate is YYYY-MM-DD
                if (task.dueDate < todayStr) {
                    // Mark as expired and add missed history
                    // Check if already logged?
                    const alreadyLogged = history.some(h => h.taskId === task.id && h.status === 'missed' && h.date === task.dueDate);

                    if (!alreadyLogged) {
                        await addDoc(collection(db, "history"), {
                            taskId: task.id,
                            taskTitle: task.title,
                            assignedTo: task.assignedTo,
                            points: 0,
                            status: 'missed',
                            isResponsibility: task.isResponsibility || false,
                            date: task.dueDate,
                        });
                    }

                    await updateDoc(doc(db, "tasks", task.id), { status: 'expired' });
                }
            }

            // 2. Daily Tasks: Reset and Log Misses
            if (task.frequency === 'daily') {
                // Determine if yesterday was a required day for this task
                // If recurrenceDays is empty, assume every day.
                // If not empty, check if yesterday's day index was in it.
                const yesterdayDayIndex = yesterday.getDay();
                let wasActiveYesterday = task.recurrenceDays?.length ? task.recurrenceDays.includes(yesterdayDayIndex) : true;

                // School Check for Yesterday
                if (task.isSchool) {
                    let isSchoolDayYesterday = yesterdayDayIndex >= 1 && yesterdayDayIndex <= 5;
                    if (globalSettings?.nonSchoolDays?.some(d => d.date === yesterdayStr)) {
                        isSchoolDayYesterday = false;
                    }
                    if (!isSchoolDayYesterday) wasActiveYesterday = false;
                }

                if (wasActiveYesterday) {
                    const hasHistoryForYesterday = history.some(h => h.taskId === task.id && h.date === yesterdayStr);

                    if (!hasHistoryForYesterday) {
                        // It was missed!
                        await addDoc(collection(db, "history"), {
                            taskId: task.id,
                            taskTitle: task.title,
                            assignedTo: task.assignedTo,
                            points: 0,
                            status: 'missed',
                            isResponsibility: task.isResponsibility || false,
                            date: yesterdayStr,
                        });
                    }
                }

                // Reset logic: If task is verified (from old days) or pending (from old days), reset to fresh pending for TODAY.
                // We reset if verifyAt < today.
                // OR if status is pending (which implies it's "leftover" from yesterday).

                let shouldReset = false;
                let shouldLogAsMissed = false;

                if (task.status === 'verified' && task.verifiedAt) {
                    const verifiedDate = task.verifiedAt.split('T')[0];
                    if (verifiedDate < todayStr) shouldReset = true;
                } else if (task.status === 'pending') {
                    // ⚠️ FIX: Pending tasks from previous days should be logged as missed
                    // If there's no history entry for yesterday and the task was active, it was missed
                    // Then we reset it to pending for today

                    // Check if we already processed this task today by looking at existing history
                    const hasHistoryForYesterday = history.some(h => h.taskId === task.id && h.date === yesterdayStr);

                    if (wasActiveYesterday && !hasHistoryForYesterday) {
                        // This pending task from yesterday was NOT completed - it was missed
                        shouldLogAsMissed = true;
                        // Note: We already logged it above in the "missed" check, so we just reset
                    }

                    // Clear any stale data and keep as pending for today
                    // We reset to clear any partial data from previous days
                    if (task.completedAt || task.evidenceUrl) {
                        shouldReset = true;
                    }
                } else if (task.status === 'completed') {
                    // ⚠️ FIX: Task is waiting for parent review from a PREVIOUS day
                    // If it was completed yesterday, and not verified by now, it should be treated as missed
                    // Parents had a chance to verify, but didn't

                    if (task.completedAt) {
                        const completedDate = task.completedAt.split('T')[0];
                        if (completedDate < todayStr) {
                            // This task was completed yesterday but never verified
                            // Log it as missed and reset for today
                            const alreadyLoggedForCompletedDate = history.some(
                                h => h.taskId === task.id && h.date === completedDate
                            );

                            if (!alreadyLoggedForCompletedDate) {
                                await addDoc(collection(db, "history"), {
                                    taskId: task.id,
                                    taskTitle: task.title,
                                    assignedTo: task.assignedTo,
                                    points: 0,
                                    status: 'missed', // Treated as missed since parent didn't verify
                                    isResponsibility: task.isResponsibility || false,
                                    date: completedDate,
                                });
                            }

                            shouldReset = true;
                        }
                    }
                } else if (task.status === 'expired') {
                    // Daily tasks shouldn't really stay expired if they recur daily?
                    // Currently checking reuse. If it expired yesterday, today is a new day!
                    shouldReset = true;
                }

                if (shouldReset) {
                    // NEW LOGIC: With Weekly Generation, we do NOT reset/recycle tasks essentially.
                    // If a daily task instance from yesterday wasn't done, it expires.
                    // We rely on the generator to have created a NEW instance for today.

                    if (task.originalTaskId) {
                        // It's an instance. Expire it, don't reset it.
                        if (task.status !== 'expired') {
                            await updateDoc(doc(db, "tasks", task.id), { status: 'expired' });
                        }
                    } else {
                        // It's a Master/Generator or old task.
                        // If it's a generator, we shouldn't really touch it, but if it was legacy recycled,
                        // we might want to reset it? No, generators should just stay distinct.
                        // Safe bet: Do nothing or reset if strictly legacy.
                        // Let's assume we migrated to instances.
                        if (task.status !== 'expired') {
                            // await updateDoc(doc(db, "tasks", task.id), { status: 'expired' }); 
                            // Updating master to expired might stop generation? 
                            // No, generation filters out expired.
                            // But masters shouldn't ever "expire" day to day.
                        }
                    }
                }
            }

            // 3. Weekly Tasks (Simple Reset)
            if (task.status === 'verified' && task.frequency === 'weekly' && task.verifiedAt) {
                const diffTime = Math.abs(now.getTime() - new Date(task.verifiedAt).getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 7) {
                    await updateDoc(doc(db, "tasks", task.id), {
                        status: 'pending',
                        completedAt: deleteField(),
                        verifiedAt: deleteField(),
                        evidenceUrl: deleteField(),
                    });
                }
            }
        }
    };

    // Checking logic
    useEffect(() => {
        if (tasks.length > 0) {
            processDailyReset();
        }
    }, [tasks.length, history.length]); // Dependencies updated

    // Schedule Reminders (Child only)
    useEffect(() => {
        if (currentUser?.role === 'child') {
            const pendingTasks = tasks.filter(t => t.assignedTo === currentUser.id && t.status === 'pending');
            scheduleRemindersForTasks(pendingTasks);
        }
    }, [tasks, currentUser]);

    // Weekly Task Generation Logic
    const checkAndGenerateWeeklyTasks = async () => {
        if (!currentUser || tasks.length === 0) return;

        console.log("[WeeklyGen] Checking for tasks to generate...");

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDate = now.getDate();
        const currentDay = now.getDay(); // 0=Sun, 1=Mon...

        // Calculate start of week (Monday)
        // If today is Sunday (0), we go back 6 days. If Mon (1), go back 0 days...
        const diff = currentDay === 0 ? 6 : currentDay - 1;
        const mondayDate = new Date(currentYear, currentMonth, currentDate - diff);
        mondayDate.setHours(0, 0, 0, 0);

        // We will generate tasks for the whole week (Mon-Sun)
        const weekDates: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(mondayDate);
            d.setDate(mondayDate.getDate() + i);
            weekDates.push(getLocalDateString(d));
        }

        const batch = writeBatch(db);
        let batchCount = 0;

        // Find "Generator" Tasks: Recurring tasks that are NOT instances (no originalTaskId)
        // and are actively assigned (not pool, though pool tasks are templates)
        // actually we only care about tasks assigned to REAL users (active assignments)
        const generators = tasks.filter(t =>
            (t.frequency === 'daily' || t.frequency === 'weekly') &&
            !t.originalTaskId &&
            t.assignedTo !== 'pool' &&
            t.status !== 'expired' // master tasks shouldn't be expired usually, but just in case
        );

        console.log(`[WeeklyGen] Found ${generators.length} generators.`);

        for (const gen of generators) {
            // Determine assumed recurrence days
            // If weekly: use recurrenceDays. If daily: use recurrenceDays OR [1,2,3,4,5,6,0] (all)
            let targetDays: number[] = [];
            if (gen.frequency === 'weekly') {
                targetDays = gen.recurrenceDays || [];
            } else {
                // DAILY
                if (gen.recurrenceDays && gen.recurrenceDays.length > 0) {
                    targetDays = gen.recurrenceDays;
                } else {
                    targetDays = [1, 2, 3, 4, 5, 6, 0]; // All days
                }
            }

            // For each target day in this week, check if instance exists
            for (let i = 0; i < 7; i++) {
                const dateStr = weekDates[i]; // YYYY-MM-DD
                // Convert dateStr to Day Index (0-6)
                // We know weekDates[0] is Monday (1), ..., weekDates[6] is Sunday (0)
                // Monday is index 0 in our loop, but Day 1.
                // i=0 (Mon) -> 1
                // i=1 (Tue) -> 2
                // ...
                // i=6 (Sun) -> 0
                const dayIndex = i === 6 ? 0 : i + 1;

                if (targetDays.includes(dayIndex)) {
                    // Check if instance already exists for this date
                    const exists = tasks.some(t =>
                        t.originalTaskId === gen.id &&
                        t.dueDate === dateStr
                    );

                    if (!exists) {
                        // Create Instance
                        // Exclude non-school days logic if applicable
                        let shouldCreate = true;
                        if (gen.isSchool) {
                            // Check global settings for holidays
                            if (globalSettings?.nonSchoolDays?.some(d => d.date === dateStr)) {
                                shouldCreate = false;
                            }
                            // Also native school logic usually Mon-Fri, but targetDays handles that if set correctly.
                            // However, if targetDays includes Sat/Sun for school task, we respect it?
                            // Default school is usually Mon-Fri.
                        }

                        if (shouldCreate) {
                            const newRef = doc(collection(db, "tasks"));
                            const newTaskData: any = {
                                ...gen,
                                id: newRef.id,
                                originalTaskId: gen.id,
                                dueDate: dateStr,
                                status: 'pending',
                                createdAt: new Date().toISOString(),
                                // Reset fields that shouldn't be copied from master state
                                completedAt: deleteField(),
                                verifiedAt: deleteField(),
                                evidenceUrl: deleteField(),
                            };
                            // Remove ID from spread to avoid overwrite (handled by ...gen but safely explicitly set new ID)
                            delete newTaskData.id;

                            batch.set(newRef, newTaskData);
                            batchCount++;
                        }
                    }
                }
            }
        }

        if (batchCount > 0) {
            console.log(`[WeeklyGen] Creating ${batchCount} new task instances.`);
            await batch.commit();
        } else {
            console.log(`[WeeklyGen] No new tasks needed.`);
        }
    };

    // Trigger Generation on Login / Init
    useEffect(() => {
        if (currentUser && tasks.length > 0) {
            checkAndGenerateWeeklyTasks().catch(console.error);
        }
    }, [currentUser?.id, tasks.length]); // tasks.length dep ensures we retry if tasks load late

    const isTaskActiveToday = (task: Task) => {
        const today = new Date();
        const dateStr = getLocalDateString(today);

        // 0. Hide Generators from Daily View
        // If a task is recurring (daily/weekly) AND has NO originalTaskId (it's a master)
        // AND we are in a mode where instances are generated (we assume so now),
        // THEN hide the master task to avoid duplication.
        // UNLESS... it was just created and instances haven't generated yet? 
        // But the generation runs fast.
        if ((task.frequency === 'daily' || task.frequency === 'weekly') && !task.originalTaskId) {
            return false;
        }

        // Calculate Day Of Week based on the Timezone-Adjusted Date
        // Construct a date object from the string components to get the correct weekday for that date
        const [y, m, d] = dateStr.split('-').map(Number);
        const zDate = new Date(y, m - 1, d);
        const dayOfWeek = zDate.getDay(); // 0 = Sunday, 1 = Monday, ...

        // 0. Hide Completed/Verified tasks from previous days
        // If a task is done, it should only appear if it was done TODAY.
        if (task.status === 'completed' || task.status === 'verified') {
            const completionDate = task.completedAt || task.verifiedAt;
            if (completionDate) {
                const cDate = new Date(completionDate);
                const cDateStr = getLocalDateString(cDate);
                // If it wasn't done today, hide it from "Today's" dashboard
                if (cDateStr !== dateStr) return false;
            } else {
                // If no date, maybe hide it? Or assume old.
                return false;
            }
        }

        // Hide EXPIRED tasks - they should move to history, not show up again
        if (task.status === 'expired') {
            return false;
        }

        // School Day Logic: Mon-Fri by default, overridden by nonSchoolDays setting
        let isSchoolDay = dayOfWeek >= 1 && dayOfWeek <= 5;

        if (globalSettings?.nonSchoolDays?.some(d => d.date === dateStr)) {
            isSchoolDay = false;
        }

        // 1. One Time: Visible if due today or past (or no date), BUT NOT FUTURE
        if (task.frequency === 'one-time') {
            // If it has a due date in the future, hide it
            if (task.dueDate && task.dueDate > dateStr) return false;

            // ⚠️ FIX: If it's a past one-time task that is still pending, HIDE IT
            // One-time tasks from previous days should not carry over
            if (task.dueDate && task.dueDate < dateStr && task.status === 'pending') {
                return false;
            }

            return true;
        }

        // For instances (which have dueDate), show ONLY if due today
        if (task.originalTaskId && task.dueDate) {
            if (task.dueDate === dateStr) return true;
            return false; // Hide instances for other days
        }

        // Fallback for any legacy task (shouldn't happen with new logic, but safe to keep)
        // Check Vacation Mode (Global)
        const isVacationMode = globalSettings?.isVacationMode || false;

        // 2. School Check
        // If Vacation Mode is ON, school tasks are hidden regardless of day
        if (task.isSchool && isVacationMode) return false;
        // Regular School Day Check (only if not already hidden by vacation)
        if (task.isSchool && !isSchoolDay) return false;

        // 3. Responsibility Check - Does not restrict visibility, only counts for stats
        // if (task.isResponsibility && !isSchoolDay) return false; // REMOVED per user request

        // 4. Specific Recurrence Check
        if (task.frequency === 'weekly') {
            if (task.recurrenceDays && task.recurrenceDays.length > 0) {
                if (!task.recurrenceDays.includes(dayOfWeek)) return false;
            } else {
                // Weekly task without days? Treat as inactive or hidden to avoid preventing "every day" spam.
                return false;
            }
        }

        // 5. Daily tasks: always visible today if not expired/completed
        // (Already handled above, but this is the default fallthrough for 'daily' frequency)

        return true;
    };

    const addCategory = async (category: Omit<Category, 'id'>) => {
        if (isTestMode()) {
            // @ts-ignore
            const maxOrder = Math.max(...categories.map(c => c.order || 0), -1);
            setCategories(prev => [...prev, { id: Date.now().toString(), ...category, order: maxOrder + 1 }]);
            return;
        }
        const maxOrder = Math.max(...categories.map(c => c.order || 0), -1);
        await addDoc(collection(db, "categories"), { ...category, order: maxOrder + 1 });
    };

    const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
        if (isTestMode()) {
            setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updates } : c));
            return;
        }
        await updateDoc(doc(db, "categories", categoryId), updates);
    };

    const deleteCategory = async (categoryId: string) => {
        if (isTestMode()) {
            setCategories(prev => prev.filter(c => c.id !== categoryId));
            return;
        }
        await deleteDoc(doc(db, "categories", categoryId));
    };

    const reorderCategories = async (newOrder: Category[]) => {
        const batch = writeBatch(db);
        newOrder.forEach((cat, index) => {
            if (cat.order !== index) {
                const ref = doc(db, "categories", cat.id);
                batch.update(ref, { order: index });
            }
        });
        await batch.commit();
    };

    const addJustificationReason = async (text: string) => {
        if (isTestMode()) {
            // @ts-ignore
            setJustificationReasons(prev => [...prev, { id: Date.now().toString(), text }]);
            return;
        }
        await addDoc(collection(db, "justification_reasons"), { text });
    };

    const deleteJustificationReason = async (id: string) => {
        if (isTestMode()) {
            setJustificationReasons(prev => prev.filter(j => j.id !== id));
            return;
        }
        await deleteDoc(doc(db, "justification_reasons", id));
    };

    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        await updateGlobalSettings({ language: lang });
    };

    const t = (key: string) => {
        const lang = language || 'es';
        return translations[lang]?.[key] || translations['es'][key] || key;
    };

    return (
        <TaskContext.Provider
            value={{
                currentUser,
                tasks,
                users,
                history,
                login,
                categories,
                templates,
                addCategory,
                updateCategory,
                deleteCategory,
                reorderCategories,
                justificationReasons,
                addJustificationReason,
                deleteJustificationReason,
                logout,
                addTask,
                updateTask,
                deleteTask,
                completeTask,
                verifyTask,
                failTask,
                rejectTask,
                messages,
                addMessage,
                updateMessage,
                deleteMessage,
                addUser,
                updateUser,
                deleteUser,
                rewards,
                redemptions,
                addReward,
                deleteReward,
                redeemReward,
                approveRedemption,
                rejectRedemption,
                isTaskActiveToday,
                globalSettings,
                updateGlobalSettings,
                getLocalDateString: () => getLocalDateString(),
                language,
                setLanguage,
                t
            }}
        >
            {children}
        </TaskContext.Provider>
    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
};
