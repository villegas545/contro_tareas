/**
 * useAuth Hook - Authentication logic
 */
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface UseAuthParams {
    users: User[];
    currentUser: User | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const useAuth = ({ users, currentUser, setCurrentUser }: UseAuthParams) => {
    const sessionChecked = useRef(false);

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
                }
            };
            restore();
        }
    }, [users, setCurrentUser]);

    const login = (username: string, password?: string) => {
        const user = users.find((u) => u.username === username);
        if (user && user.password === password) {
            setCurrentUser(user);
            AsyncStorage.setItem('loggedInUserId', user.id);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        AsyncStorage.removeItem('loggedInUserId');
    };

    return {
        currentUser,
        login,
        logout,
    };
};
