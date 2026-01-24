/**
 * Authentication Context
 * Handles user authentication, login, logout, and session management
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types';

interface AuthContextType {
    currentUser: User | null;
    isLoading: boolean;
    login: (username: string, password?: string) => boolean;
    logout: () => void;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: React.ReactNode;
    users: User[]; // Users come from parent context (data layer)
}

export const AuthProvider = ({ children, users }: AuthProviderProps) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const sessionChecked = useRef(false);

    // Sync currentUser with real-time updates from users collection
    useEffect(() => {
        if (currentUser) {
            const updatedUser = users.find(u => u.id === currentUser.id);
            // Update only if data changed to avoid infinite loops
            if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
                setCurrentUser(updatedUser);
            }
        }
    }, [users, currentUser]);

    // Restore Session on Mount
    useEffect(() => {
        if (!sessionChecked.current && users.length > 0) {
            const restore = async () => {
                try {
                    const savedId = await AsyncStorage.getItem('loggedInUserId');
                    if (savedId) {
                        const user = users.find(u => u.id === savedId);
                        if (user) setCurrentUser(user);
                    }
                } catch (e) {
                    console.error("Failed to restore session", e);
                } finally {
                    sessionChecked.current = true;
                    setIsLoading(false);
                }
            };
            restore();
        } else if (users.length > 0) {
            setIsLoading(false);
        }
    }, [users]);

    const login = useCallback((username: string, password?: string): boolean => {
        const user = users.find((u) => u.username === username);
        if (user && user.password === password) {
            setCurrentUser(user);
            AsyncStorage.setItem('loggedInUserId', user.id);
            return true;
        }
        return false;
    }, [users]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        AsyncStorage.removeItem('loggedInUserId');
    }, []);

    const value: AuthContextType = {
        currentUser,
        isLoading,
        login,
        logout,
        setCurrentUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
