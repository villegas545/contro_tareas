/**
 * Firebase Users Service
 * Encapsulates all Firebase operations for users, categories, justifications, and messages
 */

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    writeBatch,
    Unsubscribe
} from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { User, Category, JustificationReason } from '../../types';

interface MessageDoc {
    id: string;
    text: string;
}

export const usersService = {
    /**
     * Subscribe to users collection
     */
    subscribeUsers(callback: (users: User[]) => void): Unsubscribe {
        return onSnapshot(collection(db, "users"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            callback(list);
        });
    },

    /**
     * Add a new user
     */
    async addUser(user: Omit<User, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, "users"), user);
        return docRef.id;
    },

    /**
     * Update a user
     */
    async updateUser(userId: string, updates: Partial<User>): Promise<void> {
        await updateDoc(doc(db, "users", userId), updates);
    },

    /**
     * Delete a user
     */
    async deleteUser(userId: string): Promise<void> {
        await deleteDoc(doc(db, "users", userId));
    },

    // Categories

    /**
     * Subscribe to categories collection
     */
    subscribeCategories(callback: (categories: Category[]) => void): Unsubscribe {
        return onSnapshot(collection(db, "categories"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            list.sort((a, b) => (a.order || 0) - (b.order || 0));
            callback(list);
        });
    },

    /**
     * Add a new category
     */
    async addCategory(category: Omit<Category, 'id'>, maxOrder: number): Promise<string> {
        const docRef = await addDoc(collection(db, "categories"), {
            ...category,
            order: maxOrder + 1
        });
        return docRef.id;
    },

    /**
     * Update a category
     */
    async updateCategory(categoryId: string, updates: Partial<Category>): Promise<void> {
        await updateDoc(doc(db, "categories", categoryId), updates);
    },

    /**
     * Delete a category
     */
    async deleteCategory(categoryId: string): Promise<void> {
        await deleteDoc(doc(db, "categories", categoryId));
    },

    /**
     * Reorder categories (batch update)
     */
    async reorderCategories(newOrder: Category[]): Promise<void> {
        const batch = writeBatch(db);
        newOrder.forEach((cat, index) => {
            if (cat.order !== index) {
                const ref = doc(db, "categories", cat.id);
                batch.update(ref, { order: index });
            }
        });
        await batch.commit();
    },

    // Justifications

    /**
     * Subscribe to justification reasons
     */
    subscribeJustifications(callback: (reasons: JustificationReason[]) => void): Unsubscribe {
        return onSnapshot(collection(db, "justification_reasons"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JustificationReason));
            callback(list);
        });
    },

    /**
     * Add a justification reason
     */
    async addJustificationReason(text: string): Promise<string> {
        const docRef = await addDoc(collection(db, "justification_reasons"), { text });
        return docRef.id;
    },

    /**
     * Delete a justification reason
     */
    async deleteJustificationReason(id: string): Promise<void> {
        await deleteDoc(doc(db, "justification_reasons", id));
    },

    // Messages

    /**
     * Subscribe to messages
     */
    subscribeMessages(callback: (messages: MessageDoc[]) => void): Unsubscribe {
        return onSnapshot(collection(db, "messages"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                text: doc.data().text as string
            }));
            callback(list);
        });
    },

    /**
     * Add a message
     */
    async addMessage(text: string): Promise<string> {
        const docRef = await addDoc(collection(db, "messages"), { text });
        return docRef.id;
    },

    /**
     * Update a message
     */
    async updateMessage(messageId: string, text: string): Promise<void> {
        await updateDoc(doc(db, "messages", messageId), { text });
    },

    /**
     * Delete a message
     */
    async deleteMessage(messageId: string): Promise<void> {
        await deleteDoc(doc(db, "messages", messageId));
    },
};

export default usersService;
