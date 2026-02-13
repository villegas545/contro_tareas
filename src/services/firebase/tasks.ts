/**
 * Firebase Tasks Service
 * Encapsulates all Firebase operations for tasks and templates
 */

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    deleteField,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { Task, TaskTemplate, TaskHistory } from '../../types';

export const tasksService = {
    /**
     * Subscribe to tasks collection
     */
    subscribeTasks(callback: (tasks: Task[]) => void): Unsubscribe {
        return onSnapshot(collection(db, "tasks"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            callback(list);
        });
    },

    /**
     * Subscribe to templates collection
     */
    subscribeTemplates(callback: (templates: TaskTemplate[]) => void): Unsubscribe {
        return onSnapshot(collection(db, "templates"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskTemplate));
            callback(list);
        });
    },

    /**
     * Subscribe to history collection
     */
    subscribeHistory(callback: (history: TaskHistory[]) => void): Unsubscribe {
        return onSnapshot(collection(db, "history"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskHistory));
            callback(list);
        });
    },

    /**
     * Add a new task
     */
    async addTask(task: Omit<Task, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, "tasks"), task);
        return docRef.id;
    },

    /**
     * Add a new template
     */
    async addTemplate(template: Omit<TaskTemplate, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, "templates"), template);
        return docRef.id;
    },

    /**
     * Update a task
     */
    async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
        await updateDoc(doc(db, "tasks", taskId), updates);
    },

    /**
     * Update a template
     */
    async updateTemplate(templateId: string, updates: Partial<TaskTemplate>): Promise<void> {
        await updateDoc(doc(db, "templates", templateId), updates);
    },

    /**
     * Delete a task
     */
    async deleteTask(taskId: string): Promise<void> {
        await deleteDoc(doc(db, "tasks", taskId));
    },

    /**
     * Delete a template and cascade delete linked tasks
     */
    async deleteTemplate(templateId: string, linkedTaskIds: string[]): Promise<void> {
        // Delete template
        await deleteDoc(doc(db, "templates", templateId));

        // Cascade delete linked tasks
        const promises = linkedTaskIds.map(id => deleteDoc(doc(db, "tasks", id)));
        await Promise.all(promises);
    },

    /**
     * Mark task as completed
     */
    async completeTask(taskId: string, evidenceUrl?: string): Promise<void> {
        const updates: Record<string, unknown> = {
            status: 'completed',
            completedAt: new Date().toISOString(),
        };
        if (evidenceUrl) updates.evidenceUrl = evidenceUrl;
        await updateDoc(doc(db, "tasks", taskId), updates);
    },

    /**
     * Verify a task and add to history
     */
    async verifyTask(taskId: string, historyEntry: Omit<TaskHistory, 'id'>): Promise<void> {
        // Add history entry
        await addDoc(collection(db, "history"), historyEntry);

        // Update task status
        await updateDoc(doc(db, "tasks", taskId), {
            status: 'verified',
            verifiedAt: new Date().toISOString(),
        });
    },

    /**
     * Reject a task (reset to pending)
     */
    async rejectTask(taskId: string): Promise<void> {
        await updateDoc(doc(db, "tasks", taskId), {
            status: 'pending',
            completedAt: deleteField(),
        });
    },

    /**
     * Fail/expire a task
     */
    async failTask(taskId: string, historyEntry: Omit<TaskHistory, 'id'>): Promise<void> {
        // Add history entry
        await addDoc(collection(db, "history"), historyEntry);

        // Update task status
        await updateDoc(doc(db, "tasks", taskId), { status: 'expired' });
    },

    /**
     * Reset a daily task
     */
    async resetDailyTask(taskId: string): Promise<void> {
        await updateDoc(doc(db, "tasks", taskId), {
            status: 'pending',
            completedAt: deleteField(),
            verifiedAt: deleteField(),
            evidenceUrl: deleteField(),
        });
    },

    /**
     * Add a history entry
     */
    async addHistory(entry: Omit<TaskHistory, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, "history"), entry);
        return docRef.id;
    },
};

export default tasksService;
