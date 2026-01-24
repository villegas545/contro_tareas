import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, User, TaskHistory, Reward, Redemption, GlobalSettings, Category, TaskTemplate, JustificationReason, Language, TaskSchedule, WalletTransaction } from '../types';
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
    schedules: TaskSchedule[];
    templates: TaskTemplate[];
    users: User[];
    history: TaskHistory[];
    login: (username: string, password?: string) => boolean;
    logout: () => void;
    addTask: (task: Omit<Task, 'id'>) => void;
    addSchedule: (schedule: Omit<TaskSchedule, 'id'>) => void;
    deleteSchedule: (scheduleId: string) => void;
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
    isTaskActiveToday: (task: Task, includeGenerators?: boolean) => boolean;
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

    // Wallet
    transactions: WalletTransaction[];
    addTransaction: (childId: string, amount: number, type: 'deposit' | 'withdrawal', description: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [schedules, setSchedules] = useState<TaskSchedule[]>([]);
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
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
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

        const schedulesUnsub = onSnapshot(collection(db, "schedules"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskSchedule));
            setSchedules(list);
        });

        const transactionsUnsub = onSnapshot(collection(db, "wallet_transactions"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletTransaction));
            // Sort by date desc
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(list);
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
            schedulesUnsub();
            transactionsUnsub();
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

    // Recurring tasks check logic - Process Expirations
    const processDailyReset = async () => {
        if (tasks.length === 0) return; // History might be empty initially, that's fine

        // Check Global Vacation Mode
        if (globalSettings?.isVacationMode) return;

        const now = new Date();
        const todayStr = getLocalDateString(now);

        // Iterate all active tasks to verify expiration
        for (const task of tasks) {
            // Only care about tasks with Due Date that are pending
            if (task.status === 'pending' && task.dueDate) {
                if (task.dueDate < todayStr) {
                    // It's missed!
                    // Log to history
                    const alreadyLogged = history.some(h => h.taskId === task.id && h.status === 'missed');

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

                    // Expire it
                    await updateDoc(doc(db, "tasks", task.id), { status: 'expired' });
                }
            }
        }
    };

    // Auto-run reset check 
    useEffect(() => {
        if (tasks.length > 0) {
            processDailyReset();
        }
    }, [tasks.length, history.length]);

    // Schedule Reminders (Child only)
    useEffect(() => {
        if (currentUser?.role === 'child') {
            const pendingTasks = tasks.filter(t => t.assignedTo === currentUser.id && t.status === 'pending');
            scheduleRemindersForTasks(pendingTasks);
        }
    }, [tasks, currentUser]);

    const addSchedule = async (schedule: Omit<TaskSchedule, 'id'>) => {
        if (isTestMode()) {
            setSchedules(prev => [...prev, {
                id: 'test-sched-' + Date.now(),
                ...schedule,
                active: schedule.active !== undefined ? schedule.active : true,
                createdAt: schedule.createdAt || new Date().toISOString()
            }]);
            return;
        }
        await addDoc(collection(db, "schedules"), {
            active: true,
            createdAt: new Date().toISOString(),
            ...schedule
        });
    };

    const deleteSchedule = async (scheduleId: string) => {
        if (isTestMode()) {
            setSchedules(prev => prev.filter(s => s.id !== scheduleId));
            return;
        }
        await deleteDoc(doc(db, "schedules", scheduleId));
    };

    // Weekly Task Generation Logic (From Schedules -> Tasks)
    const checkAndGenerateWeeklyTasks = async () => {
        if (!currentUser || schedules.length === 0) return;

        console.log("[WeeklyGen] Checking for tasks to generate from Schedules...");

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDate = now.getDate();
        const currentDay = now.getDay(); // 0=Sun, 1=Mon...

        // Calculate start of week (Monday)
        const diff = currentDay === 0 ? 6 : currentDay - 1;
        const mondayDate = new Date(currentYear, currentMonth, currentDate - diff);
        mondayDate.setHours(0, 0, 0, 0);

        const weekDates: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(mondayDate);
            d.setDate(mondayDate.getDate() + i);
            weekDates.push(getLocalDateString(d));
        }

        const batch = writeBatch(db);
        let batchCount = 0;

        // Filter active schedules assigned to real users
        const activeSchedules = schedules.filter(s => s.active && s.assignedTo !== 'pool');

        console.log(`[WeeklyGen] Found ${activeSchedules.length} active schedules.`);

        for (const sched of activeSchedules) {
            let targetDays: number[] = [];

            // Determine days
            if (sched.frequency === 'weekly') {
                targetDays = sched.recurrenceDays || [];
            } else {
                // DAILY - default to all days if not specified
                if (sched.recurrenceDays && sched.recurrenceDays.length > 0) {
                    targetDays = sched.recurrenceDays;
                } else {
                    targetDays = [1, 2, 3, 4, 5, 6, 0];
                }
            }

            for (let i = 0; i < 7; i++) {
                const dateStr = weekDates[i];
                // Convert dateStr to Day Index (0-6)
                // i=0(Mon)->1, ..., i=6(Sun)->0
                const dayIndex = i === 6 ? 0 : i + 1;

                if (targetDays.includes(dayIndex)) {
                    // Check if instance already exists linked to this schedule
                    const exists = tasks.some(t =>
                        t.scheduleId === sched.id &&
                        t.dueDate === dateStr
                    );

                    if (!exists) {
                        // Check exclusions
                        let shouldCreate = true;
                        if (sched.isSchool && globalSettings?.nonSchoolDays?.some(d => d.date === dateStr)) {
                            shouldCreate = false;
                        }

                        if (shouldCreate) {
                            const newRef = doc(collection(db, "tasks"));
                            const newTaskData: any = {
                                // Core Data
                                title: sched.title,
                                description: sched.description || '',
                                assignedTo: sched.assignedTo,
                                createdBy: sched.createdBy || '',

                                // Status & Type
                                status: 'pending',
                                type: sched.type,
                                frequency: sched.frequency,
                                points: sched.points,

                                // Linkage
                                scheduleId: sched.id,
                                templateId: sched.templateId,

                                // Instance Specifics
                                dueDate: dateStr,

                                // Metadata
                                categoryId: sched.categoryId,
                                isResponsibility: sched.isResponsibility,
                                isSchool: sched.isSchool,
                                shift: sched.shift,

                                createdAt: new Date().toISOString(),
                            };

                            if (sched.timeWindow) newTaskData.timeWindow = sched.timeWindow;

                            batch.set(newRef, newTaskData);
                            batchCount++;
                        }
                    }
                }
            }
        }

        if (batchCount > 0) {
            console.log(`[WeeklyGen] Creating ${batchCount} new task instances from schedules.`);
            await batch.commit();
        } else {
            console.log(`[WeeklyGen] No new tasks needed.`);
        }
    };


    // Trigger Generation (Updated dep to schedules.length)
    useEffect(() => {
        if (currentUser && schedules.length > 0) {
            checkAndGenerateWeeklyTasks().catch(console.error);
        }
    }, [currentUser?.id, schedules.length, tasks.length]); // include tasks.length to know what exists

    // Migration Trigger
    useEffect(() => {
        if (tasks.length > 0 && currentUser?.role === 'parent') {
            (async () => {
                if (!isTestMode()) {
                    // Only parent triggers migration to avoid conflicts
                    const legacyMasters = tasks.filter(t =>
                        !t.originalTaskId && !t.scheduleId &&
                        (t.frequency === 'daily' || t.frequency === 'weekly') &&
                        t.assignedTo !== 'pool'
                    );

                    if (legacyMasters.length > 0) {
                        const batch = writeBatch(db);
                        let hasMigration = false;

                        legacyMasters.forEach(t => {
                            // 3-Table Migration Logic: Legacy Master Tasks -> Schedules
                            if (!t.originalTaskId && !t.scheduleId && (t.frequency === 'daily' || t.frequency === 'weekly')) {
                                console.log(`[Migration] Migrating legacy task ${t.title} to Schedule...`);
                                const scheduleData: any = {
                                    active: true,
                                    templateId: t.templateId || 'legacy',
                                    assignedTo: t.assignedTo,
                                    createdBy: (t as any).createdBy || 'system',
                                    title: t.title,
                                    description: t.description || '',
                                    type: t.type,
                                    frequency: t.frequency,
                                    points: t.points || 0,
                                    isResponsibility: t.isResponsibility || false,
                                    isSchool: t.isSchool || false,
                                    recurrenceDays: (t as any).recurrenceDays || [],
                                    categoryId: t.categoryId,
                                    shift: t.shift,
                                    createdAt: new Date().toISOString()
                                };

                                if ((t as any).timeWindow) scheduleData.timeWindow = (t as any).timeWindow;

                                // Create Schedule
                                batch.set(doc(collection(db, "schedules")), scheduleData);
                                // Delete Legacy Task
                                batch.delete(doc(db, "tasks", t.id));
                                hasMigration = true;
                            }
                        });


                        if (hasMigration) {
                            console.log("[Migration] Committing migration batch...");
                            await batch.commit();
                        }
                    }
                }
            })();
        }
    }, [tasks.length, currentUser?.id]); // Run only when tasks loaded

    const isTaskActiveToday = (task: Task, includeGenerators: boolean = false) => {
        // If includeGenerators is true, we simply ignore this check because we want to see everything
        // But wait, with 3-table architecture, "Generators" are no longer in the 'tasks' list!
        // So 'tasks' list ONLY contains instances or one-times.
        // Thus, isTaskActiveToday just filters instances.

        // However, MonitoringTab might want to see Schedules too?
        // MonitoringTab should access 'schedules' context separately if it wants to show them.
        // For 'tasks' filtering:

        const today = new Date();
        const dateStr = getLocalDateString(today);

        // 1. One Time: Visible if due today or past (or no date), BUT NOT FUTURE
        if (task.frequency === 'one-time') {
            if (task.dueDate && task.dueDate > dateStr) return false;
            // Hide old pending one-times
            if (task.dueDate && task.dueDate < dateStr && task.status === 'pending') return false;
            return true;
        }

        // 2. Instances (Standard)
        // Should have dueDate.
        if (task.dueDate) {
            // Only show today's instances
            if (task.dueDate === dateStr) return true;

            // Optionally show PAST instances if they are not verified?
            // No, requirement is "Only show tasks for today". 
            // Unfinished past tasks should be expired or hidden.
            return false;
        }

        // Fallback for weird data
        return false;
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

    const addTransaction = async (childId: string, amount: number, type: 'deposit' | 'withdrawal', description: string) => {
        const user = users.find(u => u.id === childId);
        if (!user) return;

        const currentBalance = user.walletBalance || 0;
        const newBalance = type === 'deposit' ? currentBalance + amount : currentBalance - amount;

        // 1. Update User Balance
        await updateUser(childId, { walletBalance: newBalance });

        // 2. Add Transaction Log
        const tx: WalletTransaction = {
            id: '', // Firestore auto-id
            childId,
            amount,
            type,
            description,
            date: new Date().toISOString(),
            createdBy: currentUser?.id || 'system'
        };

        if (isTestMode()) {
            // @ts-ignore
            setTransactions(prev => [{ ...tx, id: 'test-tx-' + Date.now() }, ...prev]);
            return;
        }

        const newTxRef = doc(collection(db, "wallet_transactions"));
        await setDoc(newTxRef, { ...tx, id: newTxRef.id });
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
                schedules,
                addSchedule,
                deleteSchedule,
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
                t,
                transactions,
                addTransaction
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
