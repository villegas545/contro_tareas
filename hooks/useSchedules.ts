/**
 * useSchedules Hook - Schedule management and weekly task generation
 */
import React, { useRef, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Task, TaskSchedule, User, GlobalSettings } from '../types';
import { firebaseLogger } from '../utils/firebaseLogger';
import { isTestMode } from './types';

interface UseSchedulesParams {
    schedules: TaskSchedule[];
    setSchedules: React.Dispatch<React.SetStateAction<TaskSchedule[]>>;
    currentUser: User | null;
    globalSettings: GlobalSettings | null;
    debugDate: string | null;
    withLoading: <T>(operation: () => Promise<T>, message?: string) => Promise<T>;
    setGlobalLoading: (loading: boolean, message?: string) => void;
    getCurrentDate: () => Date;
    getLocalDateString: (date?: Date) => string;
}

export const useSchedules = ({
    schedules,
    setSchedules,
    currentUser,
    globalSettings,
    debugDate,
    withLoading,
    setGlobalLoading,
    getCurrentDate,
    getLocalDateString,
}: UseSchedulesParams) => {
    // Lock to prevent simultaneous task generation
    const isGeneratingTasks = useRef(false);

    const checkAndGenerateWeeklyTasks = async () => {
        if (isGeneratingTasks.current) {
            console.log('[WeeklyGen] Already running, skipping...');
            return;
        }

        if (!currentUser) {
            firebaseLogger.logOperation('SKIP_GENERATION', 'tasks', undefined, { reason: 'No user' });
            return;
        }

        isGeneratingTasks.current = true;
        setGlobalLoading(true, 'Generando tareas...');
        try {
            const schedulesSnap = await getDocs(
                query(collection(db, "schedules"), where("active", "==", true))
            );
            const freshSchedules = schedulesSnap.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as TaskSchedule[];

            if (freshSchedules.length === 0) {
                firebaseLogger.logOperation('SKIP_GENERATION', 'tasks', undefined, { reason: 'No schedules in Firebase' });
                return;
            }

            firebaseLogger.logOperation('START_GENERATION', 'tasks', undefined, { schedulesCount: freshSchedules.length });
            console.log("[WeeklyGen] Checking for tasks to generate from Schedules...");

            const now = getCurrentDate();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const currentDate = now.getDate();
            const currentDay = now.getDay();

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

            const activeSchedules = freshSchedules.filter(s => s.active && s.assignedTo !== 'pool');

            console.log(`[WeeklyGen] Current date: ${now.toISOString().split('T')[0]}`);
            console.log(`[WeeklyGen] Week dates: ${weekDates.join(', ')}`);
            console.log(`[WeeklyGen] Found ${activeSchedules.length} active schedules.`);

            const existingTasksSnap = await getDocs(
                query(
                    collection(db, "tasks"),
                    where("dueDate", ">=", weekDates[0]),
                    where("dueDate", "<=", weekDates[6])
                )
            );
            const existingTasks = existingTasksSnap.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as Task[];
            console.log(`[WeeklyGen] Found ${existingTasks.length} existing tasks in week range.`);

            for (const sched of activeSchedules) {
                let targetDays: number[] = [];

                if (sched.frequency === 'weekly') {
                    targetDays = sched.recurrenceDays || [];
                } else {
                    if (sched.recurrenceDays && sched.recurrenceDays.length > 0) {
                        targetDays = sched.recurrenceDays;
                    } else {
                        targetDays = [1, 2, 3, 4, 5, 6, 0];
                    }
                }

                for (let i = 0; i < 7; i++) {
                    const dateStr = weekDates[i];
                    const dayIndex = i === 6 ? 0 : i + 1;

                    if (targetDays.includes(dayIndex)) {
                        const exists = existingTasks.some(t =>
                            t.scheduleId === sched.id &&
                            t.dueDate === dateStr
                        );

                        if (!exists) {
                            let shouldCreate = true;
                            if (sched.isSchool && globalSettings?.nonSchoolDays?.some(d => d.date === dateStr)) {
                                shouldCreate = false;
                            }

                            if (shouldCreate) {
                                const newRef = doc(collection(db, "tasks"));
                                const newTaskData: any = {
                                    title: sched.title || 'Sin título',
                                    description: sched.description || '',
                                    assignedTo: sched.assignedTo,
                                    createdBy: sched.createdBy || '',
                                    status: 'pending',
                                    type: sched.type || 'additional',
                                    frequency: sched.frequency || 'daily',
                                    points: sched.points ?? 0,
                                    scheduleId: sched.id,
                                    templateId: sched.templateId || null,
                                    dueDate: dateStr,
                                    categoryId: sched.categoryId || null,
                                    isResponsibility: sched.isResponsibility ?? false,
                                    isSchool: sched.isSchool ?? false,
                                    shift: sched.shift || 'no-time',
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
                firebaseLogger.logOperation('BATCH_CREATE', 'tasks', undefined, { count: batchCount }, 'success');
            } else {
                console.log(`[WeeklyGen] No new tasks needed.`);
                firebaseLogger.logOperation('NO_TASKS_NEEDED', 'tasks', undefined, { schedulesChecked: activeSchedules.length });
            }
        } finally {
            setGlobalLoading(false);
            isGeneratingTasks.current = false;
        }
    };

    const addSchedule = async (schedule: Omit<TaskSchedule, 'id'>) => {
        if (isTestMode()) {
            const { active, createdAt, ...rest } = schedule;
            setSchedules(prev => [...prev, {
                id: 'test-sched-' + Date.now(),
                ...rest,
                active: active !== undefined ? active : true,
                createdAt: createdAt || new Date().toISOString()
            }]);
            return;
        }
        await withLoading(async () => {
            const docRef = await addDoc(collection(db, "schedules"), {
                active: true,
                createdAt: new Date().toISOString(),
                ...schedule
            });

            firebaseLogger.logOperation('CREATE', 'schedules', docRef.id, { title: schedule.title, frequency: schedule.frequency, recurrenceDays: schedule.recurrenceDays });

            setTimeout(() => {
                checkAndGenerateWeeklyTasks().catch(console.error);
            }, 1000);
        }, 'Creando horario...');
    };

    const deleteSchedule = async (scheduleId: string) => {
        if (isTestMode()) {
            setSchedules(prev => prev.filter(s => s.id !== scheduleId));
            return;
        }
        await withLoading(async () => {
            await deleteDoc(doc(db, "schedules", scheduleId));
        }, 'Eliminando horario...');
    };

    // Auto-generate tasks when schedules change
    useEffect(() => {
        if (currentUser && schedules.length > 0) {
            console.log('[TaskGen] Trigger: checking tasks for week of', debugDate || 'today');
            checkAndGenerateWeeklyTasks().catch(console.error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.id, schedules.length, debugDate]);

    return {
        addSchedule,
        deleteSchedule,
        checkAndGenerateWeeklyTasks,
    };
};
