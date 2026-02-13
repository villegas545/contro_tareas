/**
 * TaskContext - Refactored
 * Uses modular hooks for better maintainability
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, User, TaskHistory, Reward, Redemption, GlobalSettings, Category, TaskTemplate, JustificationReason, Language, TaskSchedule, WalletTransaction } from '../types';
import { translations } from '../utils/translations';
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, deleteField, writeBatch, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { sendPushNotification, scheduleRemindersForTasks } from '../utils/notifications';
import { USERS, TASKS } from '../data/mockData';
import { firebaseLogger } from '../utils/firebaseLogger';

// Import hooks
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useRewards } from '../hooks/useRewards';
import { useSchedules } from '../hooks/useSchedules';
import { useSettings } from '../hooks/useSettings';
import { useSystem } from '../hooks/useSystem';
import { isTestMode } from '../hooks/types';

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

    // Global Settings
    globalSettings: GlobalSettings | null;
    updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;

    // Language
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;

    // Transactions
    transactions: WalletTransaction[];
    addTransaction: (childId: string, amount: number, type: 'deposit' | 'withdrawal', description: string) => void;

    // Utilities
    isTaskActiveToday: (task: Task, includeGenerators?: boolean) => boolean;
    getLocalDateString: (date?: Date) => string;

    // Debug Date Override
    debugDate: string | null;
    setDebugDate: (date: string | null) => Promise<void>;
    getCurrentDate: () => Date;
    refreshTasks: () => Promise<void>;

    // Global Loading State
    isGlobalLoading: boolean;
    globalLoadingMessage: string;
    setGlobalLoading: (loading: boolean, message?: string) => void;

    // System Reset
    resetSystemData: () => Promise<boolean>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
    // ==================== STATE ====================
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
    const [messageIds, setMessageIds] = useState<string[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
    const [language, setLanguageState] = useState<Language>('es');

    // Global Loading State
    const [isGlobalLoading, setIsGlobalLoading] = useState(false);
    const [globalLoadingMessage, setGlobalLoadingMessage] = useState('');

    const setGlobalLoading = (loading: boolean, message?: string) => {
        setIsGlobalLoading(loading);
        setGlobalLoadingMessage(message || 'Procesando...');
    };

    const withLoading = async <T,>(operation: () => Promise<T>, message?: string): Promise<T> => {
        setGlobalLoading(true, message || 'Procesando...');
        try {
            return await operation();
        } finally {
            setGlobalLoading(false);
        }
    };

    // ==================== EXPOSE FOR TESTING ====================
    useEffect(() => {
        if (isTestMode() && typeof window !== 'undefined') {
            // @ts-ignore
            window.testContext = {
                reset: () => {
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

    // ==================== FIRESTORE SUBSCRIPTIONS ====================
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
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(list);
        });

        const tasksUnsub = onSnapshot(collection(db, "tasks"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            setRawTasks(list);
        });

        const historyUnsub = onSnapshot(collection(db, "history"), (snapshot) => {
            const historyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskHistory));
            setHistory(historyList);
        });

        const messagesUnsub = onSnapshot(collection(db, "messages"), (snapshot) => {
            const ids = snapshot.docs.map(doc => doc.id);
            const texts = snapshot.docs.map(doc => doc.data().text as string);
            setMessageIds(ids);
            setMessages(texts);
        });

        const rewardsUnsub = onSnapshot(collection(db, "rewards"), (snapshot) => {
            const rewardsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
            setRewards(rewardsList);
        });

        const redemptionsUnsub = onSnapshot(collection(db, "redemptions"), (snapshot) => {
            const redemptionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Redemption));
            setRedemptions(redemptionsList);
        });

        const categoriesUnsub = onSnapshot(collection(db, "categories"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            list.sort((a, b) => (a.order || 0) - (b.order || 0));
            setCategories(list);
        });

        const settingsUnsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as GlobalSettings;
                setGlobalSettings(data);
                if (data.language) setLanguageState(data.language);
            } else {
                setGlobalSettings({ id: 'general', isVacationMode: false, language: 'es' });
            }
        });

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

    // ==================== HYDRATION ====================
    useEffect(() => {
        const templateTasks = templates.map(t => ({
            ...t,
            assignedTo: 'pool',
            status: 'pending',
            dueDate: '', // Templates don't have specific due dates
        } as Task));

        const hydratedAssignments = rawTasks.map(assignment => {
            if (assignment.assignedTo === 'pool') return null;

            const tId = assignment.templateId || assignment.originalTaskId;
            if (tId) {
                const template = templates.find(t => t.id === tId);
                if (template) {
                    return {
                        ...assignment,
                        ...template,
                        id: assignment.id,
                        assignedTo: assignment.assignedTo,
                        status: assignment.status,
                        dueDate: assignment.dueDate,
                        dueTime: assignment.dueTime || assignment.dueTime,
                        completedAt: assignment.completedAt,
                        verifiedAt: assignment.verifiedAt,
                        evidenceUrl: assignment.evidenceUrl,
                        templateId: tId,
                        originalTaskId: tId,
                        shift: assignment.shift,
                    } as Task;
                }
            }
            return assignment;
        }).filter(Boolean) as Task[];

        setTasks([...templateTasks, ...hydratedAssignments]);
    }, [rawTasks, templates]);

    // Sync currentUser with real-time updates
    useEffect(() => {
        if (currentUser) {
            const updatedUser = users.find(u => u.id === currentUser.id);
            if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
                setCurrentUser(updatedUser);
            }
        }
    }, [users]);

    // ==================== SETTINGS HOOK ====================
    const settingsHook = useSettings({
        globalSettings,
        setGlobalSettings,
        categories,
        setCategories,
        justificationReasons,
        setJustificationReasons,
        messages,
        setMessages,
        messageIds,
        setMessageIds,
        users,
        setUsers,
        language,
        setLanguageState,
        transactions,
        setTransactions,
    });

    // ==================== SYSTEM HOOK ====================
    const systemHook = useSystem({
        tasks,
        history,
        users,
        currentUser,
        globalSettings,
        setGlobalLoading,
        withLoading,
        updateGlobalSettings: settingsHook.updateGlobalSettings,
    });

    // ==================== AUTH HOOK ====================
    const authHook = useAuth({
        users,
        currentUser,
        setCurrentUser,
    });

    // ==================== TASKS HOOK ====================
    const tasksHook = useTasks({
        tasks,
        rawTasks,
        setRawTasks,
        templates,
        setTemplates,
        users,
        currentUser,
        history,
        setHistory,
        withLoading,
        getLocalDateString: systemHook.getLocalDateString,
    });

    // ==================== REWARDS HOOK ====================
    const rewardsHook = useRewards({
        rewards,
        setRewards,
        redemptions,
        setRedemptions,
        history,
        setHistory,
        getLocalDateString: systemHook.getLocalDateString,
    });

    // ==================== SCHEDULES HOOK ====================
    const schedulesHook = useSchedules({
        schedules,
        setSchedules,
        currentUser,
        globalSettings,
        debugDate: systemHook.debugDate,
        withLoading,
        setGlobalLoading,
        getCurrentDate: systemHook.getCurrentDate,
        getLocalDateString: systemHook.getLocalDateString,
    });

    // ==================== UTILITY FUNCTIONS ====================
    const isTaskActiveToday = (task: Task, includeGenerators: boolean = false): boolean => {
        if (!task.dueDate && !task.frequency) return true;

        const todayStr = systemHook.getLocalDateString();

        if (task.frequency === 'one-time' || !task.frequency) {
            return task.dueDate === todayStr;
        }

        if (['daily', 'weekly'].includes(task.frequency)) {
            if (!includeGenerators && task.assignedTo === 'pool') {
                return true;
            }

            if (task.dueDate) {
                return task.dueDate === todayStr;
            }

            const now = systemHook.getCurrentDate();
            const dayOfWeek = now.getDay();
            // Check recurrenceDays from linked schedule if available
            const anyTask = task as any;
            if (anyTask.recurrenceDays && anyTask.recurrenceDays.length > 0) {
                return anyTask.recurrenceDays.includes(dayOfWeek);
            }
            return true;
        }

        return false;
    };

    // ==================== PROVIDER VALUE ====================
    const value: TaskContextType = {
        currentUser: authHook.currentUser,
        tasks,
        users,
        history,
        login: authHook.login,
        logout: authHook.logout,
        categories,
        templates,
        schedules,
        addSchedule: schedulesHook.addSchedule,
        deleteSchedule: schedulesHook.deleteSchedule,
        addCategory: settingsHook.addCategory,
        updateCategory: settingsHook.updateCategory,
        deleteCategory: settingsHook.deleteCategory,
        reorderCategories: settingsHook.reorderCategories,
        justificationReasons,
        addJustificationReason: settingsHook.addJustificationReason,
        deleteJustificationReason: settingsHook.deleteJustificationReason,
        addTask: tasksHook.addTask,
        updateTask: tasksHook.updateTask,
        deleteTask: tasksHook.deleteTask,
        completeTask: tasksHook.completeTask,
        verifyTask: tasksHook.verifyTask,
        failTask: tasksHook.failTask,
        rejectTask: tasksHook.rejectTask,
        rewards,
        redemptions,
        addReward: rewardsHook.addReward,
        deleteReward: rewardsHook.deleteReward,
        redeemReward: rewardsHook.redeemReward,
        approveRedemption: rewardsHook.approveRedemption,
        rejectRedemption: rewardsHook.rejectRedemption,
        messages,
        addMessage: settingsHook.addMessage,
        updateMessage: settingsHook.updateMessage,
        deleteMessage: settingsHook.deleteMessage,
        addUser: settingsHook.addUser,
        updateUser: settingsHook.updateUser,
        deleteUser: settingsHook.deleteUser,
        globalSettings,
        updateGlobalSettings: settingsHook.updateGlobalSettings,
        isTaskActiveToday,
        getLocalDateString: systemHook.getLocalDateString,
        refreshTasks: schedulesHook.checkAndGenerateWeeklyTasks,
        language,
        setLanguage: settingsHook.setLanguage,
        t: settingsHook.t,
        transactions,
        addTransaction: settingsHook.addTransaction,
        debugDate: systemHook.debugDate,
        setDebugDate: systemHook.setDebugDate,
        getCurrentDate: systemHook.getCurrentDate,
        isGlobalLoading,
        globalLoadingMessage,
        setGlobalLoading,
        resetSystemData: systemHook.resetSystemData,
    };

    return (
        <TaskContext.Provider value={value}>
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
