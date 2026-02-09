/**
 * useTasks Hook - Task CRUD and status operations
 */
import React, { useRef } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, deleteField } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Task, User, TaskTemplate } from '../types';
import { sendPushNotification } from '../utils/notifications';
import { isTestMode } from './types';

interface UseTasksParams {
    tasks: Task[];
    rawTasks: Task[];
    setRawTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    templates: TaskTemplate[];
    setTemplates: React.Dispatch<React.SetStateAction<TaskTemplate[]>>;
    users: User[];
    currentUser: User | null;
    history: any[];
    setHistory: React.Dispatch<React.SetStateAction<any[]>>;
    withLoading: <T>(operation: () => Promise<T>, message?: string) => Promise<T>;
    getLocalDateString: (date?: Date) => string;
}

export const useTasks = ({
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
    getLocalDateString,
}: UseTasksParams) => {
    // Notification Queue Ref
    const notificationQueue = useRef<Record<string, { childName: string, tasks: string[], timeout: NodeJS.Timeout }>>({});

    const queueTaskCompletionNotification = (childId: string, childName: string, taskTitle: string) => {
        // Clear existing timeout
        if (notificationQueue.current[childId]) {
            clearTimeout(notificationQueue.current[childId].timeout);
            notificationQueue.current[childId].tasks.push(taskTitle);
        } else {
            notificationQueue.current[childId] = {
                childName,
                tasks: [taskTitle],
                timeout: setTimeout(() => { }, 0)
            };
        }

        // Set new timeout (60 seconds)
        notificationQueue.current[childId].timeout = setTimeout(() => {
            const entry = notificationQueue.current[childId];
            if (!entry) return;

            const count = entry.tasks.length;
            const title = "Tareas Realizadas";
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

    const addTask = async (newTask: Omit<Task, 'id'>) => {
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

        await withLoading(async () => {
            if (newTask.assignedTo === 'pool') {
                const templateData = newTask as any;
                await addDoc(collection(db, "templates"), templateData);
            } else {
                await addDoc(collection(db, "tasks"), newTask);

                // Notify Child
                const child = users.find(u => u.id === newTask.assignedTo);
                if (child && child.pushToken && child.id !== currentUser?.id) {
                    sendPushNotification(child.pushToken, "Nueva Tarea", `Tienes una nueva tarea: "${newTask.title}"`);
                }
            }
        }, 'Creando tarea...');
    };

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        const isTemplate = templates.some(t => t.id === taskId);

        if (isTestMode()) {
            if (isTemplate) {
                setTemplates(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
            } else {
                setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
            }
            return;
        }

        await withLoading(async () => {
            if (isTemplate) {
                await updateDoc(doc(db, "templates", taskId), updates);
            } else {
                await updateDoc(doc(db, "tasks", taskId), updates);
            }
        }, 'Actualizando...');
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

        await withLoading(async () => {
            const isTemplate = templates.some(t => t.id === taskId);

            if (isTemplate) {
                await deleteDoc(doc(db, "templates", taskId));
                const linked = rawTasks.filter(t => t.templateId === taskId || t.originalTaskId === taskId);
                await Promise.all(linked.map(t => deleteDoc(doc(db, "tasks", t.id))));
            } else {
                await deleteDoc(doc(db, "tasks", taskId));
            }
        }, 'Eliminando...');
    };

    const completeTask = async (taskId: string, evidenceUrl?: string) => {
        const task = tasks.find(t => t.id === taskId);
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

        await withLoading(async () => {
            const updates: any = {
                status: 'completed',
                completedAt: new Date().toISOString()
            };
            if (evidenceUrl) updates.evidenceUrl = evidenceUrl;

            await updateDoc(doc(db, "tasks", taskId), updates);

            const child = users.find(u => u.id === task.assignedTo);
            if (child) {
                queueTaskCompletionNotification(child.id, child.name, task.title);
            }
        }, 'Completando tarea...');
    };

    const verifyTask = async (taskId: string) => {
        if (isTestMode()) {
            setRawTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'verified', verifiedAt: new Date().toISOString() } : t));
            return;
        }

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        await withLoading(async () => {
            await addDoc(collection(db, "history"), {
                taskId: task.id,
                taskTitle: task.title,
                assignedTo: task.assignedTo,
                points: task.points || 0,
                status: 'verified',
                isResponsibility: task.isResponsibility || false,
                date: task.dueDate || getLocalDateString(),
                completedAt: task.completedAt || new Date().toISOString(),
            });

            await updateDoc(doc(db, "tasks", taskId), {
                status: 'verified',
                verifiedAt: new Date().toISOString(),
            });
        }, 'Verificando...');
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
                    date: task.dueDate || getLocalDateString()
                }]);
            }
            return;
        }

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        await withLoading(async () => {
            await addDoc(collection(db, "history"), {
                taskId: task.id,
                taskTitle: task.title,
                assignedTo: task.assignedTo,
                points: 0,
                status: 'missed',
                isResponsibility: task.isResponsibility || false,
                date: task.dueDate || getLocalDateString(),
            });

            await updateDoc(doc(db, "tasks", taskId), { status: 'expired' });
        }, 'Procesando...');
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

        await withLoading(async () => {
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
        }, 'Rechazando...');
    };

    return {
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        verifyTask,
        failTask,
        rejectTask,
    };
};
