/**
 * App Providers
 * Combined provider that wraps all context providers
 * This allows gradual migration from the old TaskContext
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Internal providers
import { AuthProvider } from './AuthContext';
import { SettingsProvider } from './SettingsContext';
import { FamilyProvider } from './FamilyContext';
import { RewardsProvider } from './RewardsContext';
import { TasksProvider } from './TasksContext';

// Services
import { tasksService } from '../services/firebase/tasks';
import { usersService } from '../services/firebase/users';
import { rewardsService } from '../services/firebase/rewards';
import { settingsService } from '../services/firebase/settings';

// Types
import {
    User,
    Task,
    TaskTemplate,
    TaskHistory,
    Reward,
    Redemption,
    Category,
    JustificationReason,
    GlobalSettings
} from '../types';

// Mock data for test mode
import { USERS, TASKS } from '../../data/mockData';

// Helper to check for Test Mode
const isTestMode = () => {
    if (typeof window !== 'undefined') {
        // @ts-ignore
        return !!window.Cypress;
    }
    return false;
};

interface AppProvidersProps {
    children: React.ReactNode;
}

/**
 * AppProviders - Combines all context providers
 * 
 * Usage:
 * ```tsx
 * <AppProviders>
 *   <App />
 * </AppProviders>
 * ```
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    // ----- STATE -----
    const [users, setUsers] = useState<User[]>([]);
    const [rawTasks, setRawTasks] = useState<Task[]>([]);
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [history, setHistory] = useState<TaskHistory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [justificationReasons, setJustificationReasons] = useState<JustificationReason[]>([]);
    const [messages, setMessages] = useState<string[]>([]);
    const [messageIds, setMessageIds] = useState<string[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);

    // ----- HYDRATED TASKS -----
    const tasks = useMemo(() => {
        // Convert Templates to "Pool Tasks" for UI compatibility
        const templateTasks = templates.map(t => ({
            ...t,
            assignedTo: 'pool',
            status: 'pending',
        } as Task));

        // Hydrate Assignments
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
                        dueTime: assignment.dueTime,
                        completedAt: assignment.completedAt,
                        verifiedAt: assignment.verifiedAt,
                        evidenceUrl: assignment.evidenceUrl,
                        templateId: tId,
                        originalTaskId: tId,
                        recurrenceDays: assignment.recurrenceDays,
                        shift: assignment.shift,
                    } as Task;
                }
            }
            return assignment;
        }).filter(Boolean) as Task[];

        return [...templateTasks, ...hydratedAssignments];
    }, [rawTasks, templates]);

    // ----- FIREBASE SUBSCRIPTIONS -----
    useEffect(() => {
        if (isTestMode()) {
            console.log("⚠️ Running in TEST MODE - Using Mock Data");
            if (rawTasks.length === 0 && users.length === 0) {
                setUsers(USERS);
                setRawTasks(TASKS);
            }
            return () => { };
        }

        // Subscribe to all collections
        const unsubscribers = [
            usersService.subscribeUsers(setUsers),
            tasksService.subscribeTasks(setRawTasks),
            tasksService.subscribeTemplates(setTemplates),
            tasksService.subscribeHistory(setHistory),
            usersService.subscribeCategories(setCategories),
            usersService.subscribeJustifications(setJustificationReasons),
            usersService.subscribeMessages((msgs) => {
                setMessageIds(msgs.map(m => m.id));
                setMessages(msgs.map(m => m.text));
            }),
            rewardsService.subscribeRewards(setRewards),
            rewardsService.subscribeRedemptions(setRedemptions),
            settingsService.subscribeSettings(setGlobalSettings),
        ];

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, []);

    // ----- HELPER: Local Date String -----
    const getLocalDateString = useCallback((date: Date = new Date()): string => {
        try {
            const timeZone = globalSettings?.timezone || 'America/Chicago';
            return new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone,
            }).format(date);
        } catch {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }, [globalSettings?.timezone]);

    // ----- CALLBACKS: Users -----
    const onAddUser = useCallback(async (user: Omit<User, 'id'>) => {
        if (isTestMode()) {
            // @ts-ignore
            setUsers(prev => [...prev, { id: Date.now().toString(), ...user }]);
            return;
        }
        await usersService.addUser(user);
    }, []);

    const onUpdateUser = useCallback(async (userId: string, updates: Partial<User>) => {
        if (isTestMode()) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
            return;
        }
        await usersService.updateUser(userId, updates);
    }, []);

    const onDeleteUser = useCallback(async (userId: string) => {
        if (isTestMode()) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            return;
        }
        await usersService.deleteUser(userId);
    }, []);

    // ----- CALLBACKS: Categories -----
    const onAddCategory = useCallback(async (category: Omit<Category, 'id'>) => {
        if (isTestMode()) {
            const maxOrder = Math.max(...categories.map(c => c.order || 0), -1);
            // @ts-ignore
            setCategories(prev => [...prev, { id: Date.now().toString(), ...category, order: maxOrder + 1 }]);
            return;
        }
        const maxOrder = Math.max(...categories.map(c => c.order || 0), -1);
        await usersService.addCategory(category, maxOrder);
    }, [categories]);

    const onUpdateCategory = useCallback(async (categoryId: string, updates: Partial<Category>) => {
        if (isTestMode()) {
            setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updates } : c));
            return;
        }
        await usersService.updateCategory(categoryId, updates);
    }, []);

    const onDeleteCategory = useCallback(async (categoryId: string) => {
        if (isTestMode()) {
            setCategories(prev => prev.filter(c => c.id !== categoryId));
            return;
        }
        await usersService.deleteCategory(categoryId);
    }, []);

    const onReorderCategories = useCallback(async (newOrder: Category[]) => {
        if (isTestMode()) {
            setCategories(newOrder.map((cat, i) => ({ ...cat, order: i })));
            return;
        }
        await usersService.reorderCategories(newOrder);
    }, []);

    // ----- CALLBACKS: Justifications -----
    const onAddJustificationReason = useCallback(async (text: string) => {
        if (isTestMode()) {
            // @ts-ignore
            setJustificationReasons(prev => [...prev, { id: Date.now().toString(), text }]);
            return;
        }
        await usersService.addJustificationReason(text);
    }, []);

    const onDeleteJustificationReason = useCallback(async (id: string) => {
        if (isTestMode()) {
            setJustificationReasons(prev => prev.filter(j => j.id !== id));
            return;
        }
        await usersService.deleteJustificationReason(id);
    }, []);

    // ----- CALLBACKS: Messages -----
    const onAddMessage = useCallback(async (text: string) => {
        if (isTestMode()) {
            setMessages(prev => [...prev, text]);
            setMessageIds(prev => [...prev, Date.now().toString()]);
            return;
        }
        await usersService.addMessage(text);
    }, []);

    const onUpdateMessage = useCallback(async (index: number, newText: string) => {
        if (isTestMode()) {
            setMessages(prev => prev.map((msg, i) => i === index ? newText : msg));
            return;
        }
        const idToUpdate = messageIds[index];
        if (idToUpdate) await usersService.updateMessage(idToUpdate, newText);
    }, [messageIds]);

    const onDeleteMessage = useCallback(async (index: number) => {
        if (isTestMode()) {
            setMessages(prev => prev.filter((_, i) => i !== index));
            setMessageIds(prev => prev.filter((_, i) => i !== index));
            return;
        }
        const idToDelete = messageIds[index];
        if (idToDelete) await usersService.deleteMessage(idToDelete);
    }, [messageIds]);

    // ----- CALLBACKS: Tasks -----
    const onAddTask = useCallback(async (newTask: Omit<Task, 'id'>) => {
        if (isTestMode()) {
            if (newTask.assignedTo === 'pool') {
                // @ts-ignore
                setTemplates(prev => [...prev, { id: Date.now().toString(), ...newTask }]);
            } else {
                // @ts-ignore
                setRawTasks(prev => [...prev, { id: Date.now().toString(), ...newTask }]);
            }
            return;
        }

        if (newTask.assignedTo === 'pool') {
            const { ...templateData } = newTask as unknown as Omit<TaskTemplate, 'id'>;
            await tasksService.addTemplate(templateData);
        } else {
            await tasksService.addTask(newTask);
        }
    }, []);

    const onUpdateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
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
            await tasksService.updateTemplate(taskId, updates as Partial<TaskTemplate>);
        } else {
            await tasksService.updateTask(taskId, updates);
        }
    }, [templates]);

    const onDeleteTask = useCallback(async (taskId: string) => {
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
            const linkedIds = rawTasks
                .filter(t => t.templateId === taskId || t.originalTaskId === taskId)
                .map(t => t.id);
            await tasksService.deleteTemplate(taskId, linkedIds);
        } else {
            await tasksService.deleteTask(taskId);
        }
    }, [templates, rawTasks]);

    const onCompleteTask = useCallback(async (taskId: string, evidenceUrl?: string) => {
        if (isTestMode()) {
            setRawTasks(prev => prev.map(t => {
                if (t.id === taskId) {
                    return {
                        ...t,
                        status: 'completed',
                        completedAt: new Date().toISOString(),
                        evidenceUrl: evidenceUrl || t.evidenceUrl,
                    };
                }
                return t;
            }));
            return;
        }
        await tasksService.completeTask(taskId, evidenceUrl);
    }, []);

    const onVerifyTask = useCallback(async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);

        if (isTestMode()) {
            setRawTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, status: 'verified', verifiedAt: new Date().toISOString() } : t
            ));
            if (task) {
                // @ts-ignore
                setHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    taskId: task.id,
                    taskTitle: task.title,
                    assignedTo: task.assignedTo,
                    points: task.points || 0,
                    status: 'verified',
                    isResponsibility: task.isResponsibility || false,
                    date: new Date().toISOString().split('T')[0],
                    completedAt: task.completedAt || new Date().toISOString(),
                }]);
            }
            return;
        }

        if (task) {
            await tasksService.verifyTask(taskId, {
                taskId: task.id,
                taskTitle: task.title,
                assignedTo: task.assignedTo,
                points: task.points || 0,
                status: 'verified',
                isResponsibility: task.isResponsibility || false,
                date: new Date().toISOString().split('T')[0],
                completedAt: task.completedAt || new Date().toISOString(),
            });
        }
    }, [tasks]);

    const onFailTask = useCallback(async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);

        if (isTestMode()) {
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
                    date: new Date().toISOString().split('T')[0],
                }]);
            }
            return;
        }

        if (task) {
            await tasksService.failTask(taskId, {
                taskId: task.id,
                taskTitle: task.title,
                assignedTo: task.assignedTo,
                points: 0,
                status: 'missed',
                isResponsibility: task.isResponsibility || false,
                date: new Date().toISOString().split('T')[0],
            });
        }
    }, [tasks]);

    const onRejectTask = useCallback(async (taskId: string) => {
        if (isTestMode()) {
            setRawTasks(prev => prev.map(t => t.id === taskId ? {
                ...t,
                status: 'pending',
                completedAt: undefined,
            } : t));
            return;
        }
        await tasksService.rejectTask(taskId);
    }, []);

    // ----- CALLBACKS: Rewards -----
    const onAddReward = useCallback(async (reward: Omit<Reward, 'id'>) => {
        if (isTestMode()) {
            // @ts-ignore
            setRewards(prev => [...prev, { id: Date.now().toString(), ...reward }]);
            return;
        }
        await rewardsService.addReward(reward);
    }, []);

    const onUpdateReward = useCallback(async (rewardId: string, updates: Partial<Reward>) => {
        if (isTestMode()) {
            setRewards(prev => prev.map(r => r.id === rewardId ? { ...r, ...updates } : r));
            return;
        }
        await rewardsService.updateReward(rewardId, updates);
    }, []);

    const onDeleteReward = useCallback(async (rewardId: string) => {
        if (isTestMode()) {
            setRewards(prev => prev.filter(r => r.id !== rewardId));
            return;
        }
        await rewardsService.deleteReward(rewardId);
    }, []);

    const onRedeemReward = useCallback(async (redemption: Omit<Redemption, 'id' | 'requestDate' | 'status'>) => {
        if (isTestMode()) {
            // @ts-ignore
            setRedemptions(prev => [...prev, {
                id: Date.now().toString(),
                ...redemption,
                status: 'pending',
                requestDate: new Date().toISOString(),
            }]);
            return;
        }
        await rewardsService.redeemReward(redemption);
    }, []);

    const onApproveRedemption = useCallback(async (redemptionId: string) => {
        const redemption = redemptions.find(r => r.id === redemptionId);

        if (isTestMode()) {
            setRedemptions(prev => prev.map(r =>
                r.id === redemptionId ? { ...r, status: 'approved', redeemedDate: new Date().toISOString() } : r
            ));
            if (redemption) {
                // @ts-ignore
                setHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    taskId: 'redemption-' + redemption.id,
                    taskTitle: `Canje: ${redemption.rewardTitle}`,
                    assignedTo: redemption.childId,
                    points: -Math.abs(redemption.cost),
                    status: 'verified',
                    date: new Date().toISOString().split('T')[0],
                    completedAt: new Date().toISOString(),
                }]);
            }
            return;
        }

        if (redemption) {
            await rewardsService.approveRedemption(redemptionId, redemption);
        }
    }, [redemptions]);

    const onRejectRedemption = useCallback(async (redemptionId: string) => {
        if (isTestMode()) {
            setRedemptions(prev => prev.map(r =>
                r.id === redemptionId ? { ...r, status: 'rejected' } : r
            ));
            return;
        }
        await rewardsService.rejectRedemption(redemptionId);
    }, []);

    // ----- CALLBACKS: Settings -----
    const onUpdateSettings = useCallback(async (settings: Partial<GlobalSettings>) => {
        if (isTestMode()) {
            // @ts-ignore
            setGlobalSettings(prev => ({ ...prev, ...settings }));
            return;
        }
        await settingsService.updateSettings(settings);
    }, []);

    // ----- CALLBACKS: History -----
    const onAddHistory = useCallback(async (entry: Omit<TaskHistory, 'id'>) => {
        if (isTestMode()) {
            // @ts-ignore
            setHistory(prev => [...prev, { id: Date.now().toString(), ...entry }]);
            return;
        }
        await tasksService.addHistory(entry);
    }, []);

    // ----- RENDER -----
    return (
        <SettingsProvider
            globalSettings={globalSettings}
            onUpdateSettings={onUpdateSettings}
        >
            <AuthProvider users={users}>
                <FamilyProvider
                    users={users}
                    categories={categories}
                    justificationReasons={justificationReasons}
                    messages={messages}
                    onAddUser={onAddUser}
                    onUpdateUser={onUpdateUser}
                    onDeleteUser={onDeleteUser}
                    onAddCategory={onAddCategory}
                    onUpdateCategory={onUpdateCategory}
                    onDeleteCategory={onDeleteCategory}
                    onReorderCategories={onReorderCategories}
                    onAddJustificationReason={onAddJustificationReason}
                    onDeleteJustificationReason={onDeleteJustificationReason}
                    onAddMessage={onAddMessage}
                    onUpdateMessage={onUpdateMessage}
                    onDeleteMessage={onDeleteMessage}
                >
                    <RewardsProvider
                        rewards={rewards}
                        redemptions={redemptions}
                        onAddReward={onAddReward}
                        onUpdateReward={onUpdateReward}
                        onDeleteReward={onDeleteReward}
                        onRedeemReward={onRedeemReward}
                        onApproveRedemption={onApproveRedemption}
                        onRejectRedemption={onRejectRedemption}
                        onAddHistory={onAddHistory}
                    >
                        <TasksProvider
                            tasks={tasks}
                            templates={templates}
                            history={history}
                            globalSettings={globalSettings}
                            getLocalDateString={getLocalDateString}
                            onAddTask={onAddTask}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            onCompleteTask={onCompleteTask}
                            onVerifyTask={onVerifyTask}
                            onFailTask={onFailTask}
                            onRejectTask={onRejectTask}
                        >
                            {children}
                        </TasksProvider>
                    </RewardsProvider>
                </FamilyProvider>
            </AuthProvider>
        </SettingsProvider>
    );
};

export default AppProviders;
