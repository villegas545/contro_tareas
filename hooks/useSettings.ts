/**
 * useSettings Hook - Global settings, categories, justifications, messages, users, and language
 */
import { collection, addDoc, updateDoc, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { GlobalSettings, Category, JustificationReason, User, Language, WalletTransaction } from '../types';
import { translations } from '../utils/translations';
import { isTestMode } from './types';

interface UseSettingsParams {
    globalSettings: GlobalSettings | null;
    setGlobalSettings: React.Dispatch<React.SetStateAction<GlobalSettings | null>>;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    justificationReasons: JustificationReason[];
    setJustificationReasons: React.Dispatch<React.SetStateAction<JustificationReason[]>>;
    messages: string[];
    setMessages: React.Dispatch<React.SetStateAction<string[]>>;
    messageIds: string[];
    setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    language: Language;
    setLanguageState: React.Dispatch<React.SetStateAction<Language>>;
    transactions: WalletTransaction[];
    setTransactions: React.Dispatch<React.SetStateAction<WalletTransaction[]>>;
}

export const useSettings = ({
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
}: UseSettingsParams) => {

    // Global Settings
    const updateGlobalSettings = async (settings: Partial<GlobalSettings>) => {
        if (isTestMode()) {
            // @ts-ignore
            setGlobalSettings(prev => ({ ...prev, ...settings }));
            return;
        }
        await setDoc(doc(db, "settings", "general"), settings, { merge: true });
    };

    // Messages
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

    // Users
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

    // Categories
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

    // Justifications
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

    // Language
    const setLanguage = async (lang: Language) => {
        setLanguageState(lang);
        await updateGlobalSettings({ language: lang });
    };

    const t = (key: string) => {
        const lang = language || 'es';
        return translations[lang]?.[key] || translations['es'][key] || key;
    };

    // Transactions
    const addTransaction = async (childId: string, amount: number, type: 'deposit' | 'withdrawal', description: string) => {
        const user = users.find(u => u.id === childId);
        if (!user) return;

        const currentBalance = user.walletBalance || 0;
        const newBalance = type === 'deposit' ? currentBalance + amount : currentBalance - amount;

        if (isTestMode()) {
            setUsers(prev => prev.map(u => u.id === childId ? { ...u, walletBalance: newBalance } : u));
            return;
        }

        // Update user balance
        await updateDoc(doc(db, "users", childId), { walletBalance: newBalance });

        // Add transaction record
        const tx: Omit<WalletTransaction, 'id'> = {
            childId,
            type,
            amount,
            description,
            date: new Date().toISOString(),
            previousBalance: currentBalance,
            newBalance,
        };

        const newTxRef = doc(collection(db, "wallet_transactions"));
        await setDoc(newTxRef, { ...tx, id: newTxRef.id });
    };

    return {
        // Global Settings
        updateGlobalSettings,
        // Messages
        addMessage,
        updateMessage,
        deleteMessage,
        // Users
        addUser,
        updateUser,
        deleteUser,
        // Categories
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        // Justifications
        addJustificationReason,
        deleteJustificationReason,
        // Language
        setLanguage,
        t,
        // Transactions
        addTransaction,
    };
};
