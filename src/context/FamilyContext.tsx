/**
 * Family Context
 * Handles users, categories, justifications, and messages management
 */

import React, { createContext, useContext, useCallback } from 'react';
import { User, Category, JustificationReason } from '../../types';

interface FamilyContextType {
    // Users
    users: User[];
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;

    // Helpers
    getChildren: () => User[];
    getParents: () => User[];
    getUserById: (id: string) => User | undefined;

    // Categories
    categories: Category[];
    addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
    updateCategory: (categoryId: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (categoryId: string) => Promise<void>;
    reorderCategories: (newOrder: Category[]) => Promise<void>;

    // Justifications
    justificationReasons: JustificationReason[];
    addJustificationReason: (text: string) => Promise<void>;
    deleteJustificationReason: (id: string) => Promise<void>;

    // Messages
    messages: string[];
    addMessage: (text: string) => Promise<void>;
    updateMessage: (index: number, newText: string) => Promise<void>;
    deleteMessage: (index: number) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

interface FamilyProviderProps {
    children: React.ReactNode;
    users: User[];
    categories: Category[];
    justificationReasons: JustificationReason[];
    messages: string[];

    // User callbacks
    onAddUser: (user: Omit<User, 'id'>) => Promise<void>;
    onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
    onDeleteUser: (userId: string) => Promise<void>;

    // Category callbacks
    onAddCategory: (category: Omit<Category, 'id'>) => Promise<void>;
    onUpdateCategory: (categoryId: string, updates: Partial<Category>) => Promise<void>;
    onDeleteCategory: (categoryId: string) => Promise<void>;
    onReorderCategories: (newOrder: Category[]) => Promise<void>;

    // Justification callbacks
    onAddJustificationReason: (text: string) => Promise<void>;
    onDeleteJustificationReason: (id: string) => Promise<void>;

    // Message callbacks
    onAddMessage: (text: string) => Promise<void>;
    onUpdateMessage: (index: number, newText: string) => Promise<void>;
    onDeleteMessage: (index: number) => Promise<void>;
}

export const FamilyProvider = ({
    children,
    users,
    categories,
    justificationReasons,
    messages,
    onAddUser,
    onUpdateUser,
    onDeleteUser,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    onReorderCategories,
    onAddJustificationReason,
    onDeleteJustificationReason,
    onAddMessage,
    onUpdateMessage,
    onDeleteMessage,
}: FamilyProviderProps) => {

    // User operations
    const addUser = useCallback(async (user: Omit<User, 'id'>) => {
        await onAddUser(user);
    }, [onAddUser]);

    const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
        await onUpdateUser(userId, updates);
    }, [onUpdateUser]);

    const deleteUser = useCallback(async (userId: string) => {
        await onDeleteUser(userId);
    }, [onDeleteUser]);

    // User helpers
    const getChildren = useCallback(() => {
        return users.filter(u => u.role === 'child');
    }, [users]);

    const getParents = useCallback(() => {
        return users.filter(u => u.role === 'parent');
    }, [users]);

    const getUserById = useCallback((id: string) => {
        return users.find(u => u.id === id);
    }, [users]);

    // Category operations
    const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
        await onAddCategory(category);
    }, [onAddCategory]);

    const updateCategory = useCallback(async (categoryId: string, updates: Partial<Category>) => {
        await onUpdateCategory(categoryId, updates);
    }, [onUpdateCategory]);

    const deleteCategory = useCallback(async (categoryId: string) => {
        await onDeleteCategory(categoryId);
    }, [onDeleteCategory]);

    const reorderCategories = useCallback(async (newOrder: Category[]) => {
        await onReorderCategories(newOrder);
    }, [onReorderCategories]);

    // Justification operations
    const addJustificationReason = useCallback(async (text: string) => {
        await onAddJustificationReason(text);
    }, [onAddJustificationReason]);

    const deleteJustificationReason = useCallback(async (id: string) => {
        await onDeleteJustificationReason(id);
    }, [onDeleteJustificationReason]);

    // Message operations
    const addMessage = useCallback(async (text: string) => {
        await onAddMessage(text);
    }, [onAddMessage]);

    const updateMessage = useCallback(async (index: number, newText: string) => {
        await onUpdateMessage(index, newText);
    }, [onUpdateMessage]);

    const deleteMessage = useCallback(async (index: number) => {
        await onDeleteMessage(index);
    }, [onDeleteMessage]);

    const value: FamilyContextType = {
        // Users
        users,
        addUser,
        updateUser,
        deleteUser,
        getChildren,
        getParents,
        getUserById,

        // Categories
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,

        // Justifications
        justificationReasons,
        addJustificationReason,
        deleteJustificationReason,

        // Messages
        messages,
        addMessage,
        updateMessage,
        deleteMessage,
    };

    return (
        <FamilyContext.Provider value={value}>
            {children}
        </FamilyContext.Provider>
    );
};

export const useFamily = (): FamilyContextType => {
    const context = useContext(FamilyContext);
    if (context === undefined) {
        throw new Error('useFamily must be used within a FamilyProvider');
    }
    return context;
};

export default FamilyContext;
