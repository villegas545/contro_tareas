/**
 * useSystem Hook - System utilities: date helpers, daily reset, system reset
 */
import React, { useRef, useEffect } from 'react';
import { collection, getDocs, writeBatch, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Task, TaskHistory, GlobalSettings, User } from '../types';
import { scheduleRemindersForTasks } from '../utils/notifications';

interface UseSystemParams {
    tasks: Task[];
    history: TaskHistory[];
    users: User[];
    currentUser: User | null;
    globalSettings: GlobalSettings | null;
    setGlobalLoading: (loading: boolean, message?: string) => void;
    withLoading: <T>(operation: () => Promise<T>, message?: string) => Promise<T>;
    updateGlobalSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
}

export const useSystem = ({
    tasks,
    history,
    users,
    currentUser,
    globalSettings,
    setGlobalLoading,
    withLoading,
    updateGlobalSettings,
}: UseSystemParams) => {
    // Track tasks that failed to update (no longer exist) to avoid repeated attempts
    const failedTaskIds = useRef<Set<string>>(new Set());

    // Lock to prevent simultaneous daily resets
    const isProcessingReset = useRef(false);

    // Helper: Get current date (respects debug date override from globalSettings)
    const getCurrentDate = (): Date => {
        const activeDebugDate = globalSettings?.debugDate;
        if (activeDebugDate) {
            const [year, month, day] = activeDebugDate.split('-').map(Number);
            const now = new Date();
            return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
        }
        return new Date();
    };

    // Helper: Local Date String YYYY-MM-DD (Timezone Aware, respects debug date)
    const getLocalDateString = (date?: Date): string => {
        const targetDate = date || getCurrentDate();

        try {
            const timeZone = globalSettings?.timezone || 'America/Chicago';
            return new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone
            }).format(targetDate);
        } catch (_e) {
            const year = targetDate.getFullYear();
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const day = String(targetDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    };

    // Setter for debug date - persists to Firebase
    const setDebugDate = async (date: string | null) => {
        await withLoading(async () => {
            await updateGlobalSettings({ debugDate: date });
        }, 'Cambiando fecha...');
    };

    // Recurring tasks check logic - Process Expirations
    const processDailyReset = async () => {
        if (isProcessingReset.current) return;
        if (tasks.length === 0) return;
        if (globalSettings?.isVacationMode) return;

        const now = getCurrentDate();
        const todayStr = getLocalDateString(now);

        const tasksToExpire = tasks.filter(t =>
            !failedTaskIds.current.has(t.id) &&
            t.status === 'pending' &&
            t.dueDate && t.dueDate < todayStr
        );

        const tasksToVerify = tasks.filter(t =>
            !failedTaskIds.current.has(t.id) &&
            t.status === 'completed' &&
            t.dueDate && t.dueDate < todayStr
        );

        if (tasksToExpire.length === 0 && tasksToVerify.length === 0) return;

        isProcessingReset.current = true;
        setGlobalLoading(true, 'Actualizando tareas diarias...');

        console.log(`[processDailyReset] Starting update for ${tasksToExpire.length} expired and ${tasksToVerify.length} verified tasks.`);

        try {
            const batch = writeBatch(db);
            let operationCount = 0;

            // Process Expirations
            for (const task of tasksToExpire) {
                const alreadyLogged = history.some(h => h.taskId === task.id && h.status === 'missed');
                if (!alreadyLogged) {
                    const historyRef = doc(collection(db, "history"));
                    batch.set(historyRef, {
                        taskId: task.id,
                        taskTitle: task.title,
                        assignedTo: task.assignedTo,
                        points: 0,
                        status: 'missed',
                        isResponsibility: task.isResponsibility || false,
                        date: task.dueDate,
                    });
                }

                const taskRef = doc(db, "tasks", task.id);
                batch.update(taskRef, { status: 'expired' });
                operationCount++;
            }

            // Process Auto-Verifications
            for (const task of tasksToVerify) {
                const alreadyLogged = history.some(h => h.taskId === task.id && (h.status === 'verified' || h.status === 'completed'));
                if (!alreadyLogged) {
                    const historyRef = doc(collection(db, "history"));
                    batch.set(historyRef, {
                        taskId: task.id,
                        taskTitle: task.title,
                        assignedTo: task.assignedTo,
                        points: task.points || 0,
                        status: 'verified',
                        isResponsibility: task.isResponsibility || false,
                        date: task.dueDate,
                        completedAt: task.completedAt,
                        autoVerified: true,
                    });
                }

                const taskRef = doc(db, "tasks", task.id);
                batch.update(taskRef, {
                    status: 'verified',
                    verifiedAt: new Date().toISOString(),
                    autoVerified: true,
                });
                operationCount++;
            }

            if (operationCount > 0) {
                await batch.commit();
            }

            // Handle Wallet Updates separately
            for (const task of tasksToVerify) {
                if (task.points && task.points > 0) {
                    try {
                        const childRef = doc(db, "users", task.assignedTo);
                        const childSnap = await getDoc(childRef);
                        if (childSnap.exists()) {
                            const currentBalance = childSnap.data().walletBalance || 0;
                            await updateDoc(childRef, {
                                walletBalance: currentBalance + task.points,
                            });
                        }
                    } catch (err) {
                        console.error(`Error updating wallet for task ${task.id}`, err);
                    }
                }
            }

        } catch (error: any) {
            console.error('[processDailyReset] Error processing updates:', error);

            if (error.code === 'not-found' || (error.message && error.message.includes('No document to update'))) {
                const match = error.message?.match(/tasks\/([a-zA-Z0-9]+)/);
                if (match && match[1]) {
                    const missingTaskId = match[1];
                    console.warn(`[processDailyReset] Detected missing task ${missingTaskId}. Adding to ignore list.`);
                    failedTaskIds.current.add(missingTaskId);
                }
            }
        } finally {
            setGlobalLoading(false);
            setTimeout(() => {
                isProcessingReset.current = false;
            }, 2000);
        }
    };

    // Auto-run reset check
    useEffect(() => {
        if (tasks.length > 0) {
            processDailyReset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks.length]);

    // Schedule Reminders (Child only)
    useEffect(() => {
        if (currentUser?.role === 'child') {
            const pendingTasks = tasks.filter(t => t.assignedTo === currentUser.id && t.status === 'pending');
            scheduleRemindersForTasks(pendingTasks);
        }
    }, [tasks, currentUser]);

    // System Reset Function
    const resetSystemData = async () => {
        console.log('🔴 [RESET] Starting system data cleanup...');
        setGlobalLoading(true, 'Limpiando sistema...');

        try {
            // Delete all tasks
            console.log('🔴 [RESET] Fetching tasks...');
            const tasksSnap = await getDocs(collection(db, "tasks"));
            console.log(`🔴 [RESET] Found ${tasksSnap.size} tasks to delete`);

            if (tasksSnap.size > 0) {
                const taskBatch = writeBatch(db);
                tasksSnap.forEach(doc => taskBatch.delete(doc.ref));
                await taskBatch.commit();
                console.log('🔴 [RESET] Tasks deleted');
            }

            // Delete all history
            console.log('🔴 [RESET] Fetching history...');
            const histSnap = await getDocs(collection(db, "history"));
            console.log(`🔴 [RESET] Found ${histSnap.size} history entries to delete`);

            if (histSnap.size > 0) {
                const histBatch = writeBatch(db);
                histSnap.forEach(doc => histBatch.delete(doc.ref));
                await histBatch.commit();
                console.log('🔴 [RESET] History deleted');
            }

            // Delete all schedules
            console.log('🔴 [RESET] Fetching schedules...');
            const schedSnap = await getDocs(collection(db, "schedules"));
            console.log(`🔴 [RESET] Found ${schedSnap.size} schedules to delete`);

            if (schedSnap.size > 0) {
                const schedBatch = writeBatch(db);
                schedSnap.forEach(doc => schedBatch.delete(doc.ref));
                await schedBatch.commit();
                console.log('🔴 [RESET] Schedules deleted');
            }

            console.log('✅ [RESET] System cleanup complete! Templates and Users preserved.');
            return true;

        } catch (error) {
            console.error('🔴 [RESET] Error during cleanup:', error);
            throw error;
        } finally {
            setGlobalLoading(false);
        }
    };

    return {
        getCurrentDate,
        getLocalDateString,
        setDebugDate,
        debugDate: globalSettings?.debugDate || null,
        processDailyReset,
        resetSystemData,
    };
};
