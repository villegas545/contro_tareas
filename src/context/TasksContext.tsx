/**
 * Tasks Context
 * Handles task and template operations
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Task, TaskTemplate, TaskHistory, GlobalSettings, User } from '../../types';
import { SCHOOL_DAYS } from '../constants/weekDays';

interface TasksContextType {
    // Data
    tasks: Task[];
    templates: TaskTemplate[];
    history: TaskHistory[];

    // Task Operations
    addTask: (task: Omit<Task, 'id'>) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;

    // Task Actions
    completeTask: (taskId: string, evidenceUrl?: string) => Promise<void>;
    verifyTask: (taskId: string) => Promise<void>;
    failTask: (taskId: string) => Promise<void>;
    rejectTask: (taskId: string) => Promise<void>;

    // Helpers
    isTaskActiveToday: (task: Task) => boolean;
    getTasksByChild: (childId: string) => Task[];
    getTasksByStatus: (status: string) => Task[];
    getPendingTasks: () => Task[];
    getCompletedTasks: () => Task[];
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

interface TasksProviderProps {
    children: React.ReactNode;
    tasks: Task[];
    templates: TaskTemplate[];
    history: TaskHistory[];
    globalSettings: GlobalSettings | null;
    getLocalDateString: (date?: Date) => string;

    // Callbacks
    onAddTask: (task: Omit<Task, 'id'>) => Promise<void>;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    onDeleteTask: (taskId: string) => Promise<void>;
    onCompleteTask: (taskId: string, evidenceUrl?: string) => Promise<void>;
    onVerifyTask: (taskId: string) => Promise<void>;
    onFailTask: (taskId: string) => Promise<void>;
    onRejectTask: (taskId: string) => Promise<void>;
}

export const TasksProvider = ({
    children,
    tasks,
    templates,
    history,
    globalSettings,
    getLocalDateString,
    onAddTask,
    onUpdateTask,
    onDeleteTask,
    onCompleteTask,
    onVerifyTask,
    onFailTask,
    onRejectTask,
}: TasksProviderProps) => {

    // Task operations
    const addTask = useCallback(async (task: Omit<Task, 'id'>) => {
        await onAddTask(task);
    }, [onAddTask]);

    const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
        await onUpdateTask(taskId, updates);
    }, [onUpdateTask]);

    const deleteTask = useCallback(async (taskId: string) => {
        await onDeleteTask(taskId);
    }, [onDeleteTask]);

    const completeTask = useCallback(async (taskId: string, evidenceUrl?: string) => {
        await onCompleteTask(taskId, evidenceUrl);
    }, [onCompleteTask]);

    const verifyTask = useCallback(async (taskId: string) => {
        await onVerifyTask(taskId);
    }, [onVerifyTask]);

    const failTask = useCallback(async (taskId: string) => {
        await onFailTask(taskId);
    }, [onFailTask]);

    const rejectTask = useCallback(async (taskId: string) => {
        await onRejectTask(taskId);
    }, [onRejectTask]);

    /**
     * Determine if a task is active today based on scheduling rules
     */
    const isTaskActiveToday = useCallback((task: Task): boolean => {
        const today = new Date();
        const dateStr = getLocalDateString(today);

        // Calculate Day Of Week based on the Timezone-Adjusted Date
        const [y, m, d] = dateStr.split('-').map(Number);
        const zDate = new Date(y, m - 1, d);
        const dayOfWeek = zDate.getDay(); // 0 = Sunday, 1 = Monday, ...

        // Hide Completed/Verified tasks from previous days
        if (task.status === 'completed' || task.status === 'verified') {
            const completionDate = task.completedAt || task.verifiedAt;
            if (completionDate) {
                const cDate = new Date(completionDate);
                const cDateStr = getLocalDateString(cDate);
                if (cDateStr !== dateStr) return false;
            } else {
                return false;
            }
        }

        // ⚠️ FIX: Hide EXPIRED tasks - they should move to history, not show up again
        if (task.status === 'expired') {
            return false;
        }

        // School Day Logic: Mon-Fri by default, overridden by nonSchoolDays setting
        let isSchoolDay = SCHOOL_DAYS.includes(dayOfWeek as 1 | 2 | 3 | 4 | 5);

        if (globalSettings?.nonSchoolDays?.some(d => d.date === dateStr)) {
            isSchoolDay = false;
        }

        // One Time: Visible if due today or past (or no date), BUT NOT FUTURE
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

        // Check Vacation Mode (Global)
        const isVacationMode = globalSettings?.isVacationMode || false;

        // School Check
        if (task.isSchool && isVacationMode) return false;
        if (task.isSchool && !isSchoolDay) return false;

        // Specific Recurrence Check
        if (task.frequency === 'weekly') {
            if (task.recurrenceDays && task.recurrenceDays.length > 0) {
                if (!task.recurrenceDays.includes(dayOfWeek)) return false;
            } else {
                return false;
            }
        }

        // Daily tasks: always visible today if not expired/completed
        return true;
    }, [getLocalDateString, globalSettings]);

    // Helper functions
    const getTasksByChild = useCallback((childId: string): Task[] => {
        return tasks.filter(t => t.assignedTo === childId);
    }, [tasks]);

    const getTasksByStatus = useCallback((status: string): Task[] => {
        return tasks.filter(t => t.status === status);
    }, [tasks]);

    const getPendingTasks = useCallback((): Task[] => {
        return tasks.filter(t => t.status === 'pending');
    }, [tasks]);

    const getCompletedTasks = useCallback((): Task[] => {
        return tasks.filter(t => t.status === 'completed');
    }, [tasks]);

    const value: TasksContextType = {
        tasks,
        templates,
        history,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        verifyTask,
        failTask,
        rejectTask,
        isTaskActiveToday,
        getTasksByChild,
        getTasksByStatus,
        getPendingTasks,
        getCompletedTasks,
    };

    return (
        <TasksContext.Provider value={value}>
            {children}
        </TasksContext.Provider>
    );
};

export const useTasks = (): TasksContextType => {
    const context = useContext(TasksContext);
    if (context === undefined) {
        throw new Error('useTasks must be used within a TasksProvider');
    }
    return context;
};

export default TasksContext;
