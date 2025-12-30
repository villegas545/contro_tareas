import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, User, TaskHistory, Reward, Redemption } from '../types';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, Timestamp, deleteField } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface TaskContextType {
    currentUser: User | null;
    tasks: Task[];
    users: User[];
    history: TaskHistory[];
    login: (username: string, password?: string) => boolean;
    logout: () => void;
    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    completeTask: (taskId: string, evidenceUrl?: string) => void;
    verifyTask: (taskId: string) => void;
    failTask: (taskId: string) => void;
    rejectTask: (taskId: string) => void;
    messages: string[];
    addMessage: (text: string) => void;
    updateMessage: (index: number, newText: string) => void;
    deleteMessage: (index: number) => void;
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (userId: string, updates: Partial<User>) => void;
    deleteUser: (userId: string) => void;

    // Rewards System
    rewards: Reward[];
    redemptions: Redemption[];
    addReward: (reward: Omit<Reward, 'id'>) => void;
    deleteReward: (rewardId: string) => void;
    redeemReward: (redemption: Omit<Redemption, 'id' | 'requestDate' | 'status'>) => void;
    approveRedemption: (redemptionId: string) => void;
    rejectRedemption: (redemptionId: string) => void;
    isTaskActiveToday: (task: Task) => boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [history, setHistory] = useState<TaskHistory[]>([]);
    const [messages, setMessages] = useState<string[]>([]);
    const [messageIds, setMessageIds] = useState<string[]>([]); // To track IDs for deletion

    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const sessionChecked = React.useRef(false);

    // Subscribe to Firestore collections
    useEffect(() => {
        // Users
        const usersUnsub = onSnapshot(collection(db, "users"), (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersList);

            // Auto-update current user if properties change

        });

        // Tasks
        const tasksUnsub = onSnapshot(collection(db, "tasks"), (snapshot) => {
            const tasksList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
            setTasks(tasksList);
        });

        // History
        const historyUnsub = onSnapshot(collection(db, "history"), (snapshot) => {
            const historyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskHistory));
            setHistory(historyList);
        });

        // Messages
        const messagesUnsub = onSnapshot(collection(db, "messages"), (snapshot) => {
            const ids = snapshot.docs.map(doc => doc.id);
            const texts = snapshot.docs.map(doc => doc.data().text as string);
            setMessageIds(ids);
            setMessages(texts);
        });

        // Rewards
        const rewardsUnsub = onSnapshot(collection(db, "rewards"), (snapshot) => {
            const rewardsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
            setRewards(rewardsList);
        });

        // Redemptions
        const redemptionsUnsub = onSnapshot(collection(db, "redemptions"), (snapshot) => {
            const redemptionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Redemption));
            setRedemptions(redemptionsList);
        });

        return () => {
            usersUnsub();
            tasksUnsub();
            historyUnsub();
            messagesUnsub();
            rewardsUnsub();
            redemptionsUnsub();
        };
    }, []); // Run once on mount

    const addMessage = async (text: string) => {
        await addDoc(collection(db, "messages"), { text });
    };

    const updateMessage = async (index: number, newText: string) => {
        const idToUpdate = messageIds[index];
        if (idToUpdate) await updateDoc(doc(db, "messages", idToUpdate), { text: newText });
    };

    const deleteMessage = async (index: number) => {
        const idToDelete = messageIds[index];
        if (idToDelete) await deleteDoc(doc(db, "messages", idToDelete));
    };

    const addUser = async (newUser: Omit<User, 'id'>) => {
        await addDoc(collection(db, "users"), newUser);
    };

    const updateUser = async (userId: string, updates: Partial<User>) => {
        await updateDoc(doc(db, "users", userId), updates);
    };

    const deleteUser = async (userId: string) => {
        await deleteDoc(doc(db, "users", userId));
    };

    // Sync currentUser with real-time updates from users collection
    useEffect(() => {
        if (currentUser) {
            const updatedUser = users.find(u => u.id === currentUser.id);
            // Update only if data changed to avoid infinite loops
            if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
                setCurrentUser(updatedUser);
            }
        }
    }, [users]);

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
    }, [users]);

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

    const addTask = async (newTask: Omit<Task, 'id'>) => {
        await addDoc(collection(db, "tasks"), newTask);
    };

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        await updateDoc(doc(db, "tasks", taskId), updates);
    };

    const deleteTask = async (taskId: string) => {
        await deleteDoc(doc(db, "tasks", taskId));
    };

    const completeTask = async (taskId: string, evidenceUrl?: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Validation for Time Window
        if (task.timeWindow) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            if (currentTime < task.timeWindow.start || currentTime > task.timeWindow.end) {
                throw new Error(`Esta tarea solo se puede completar entre ${task.timeWindow.start} y ${task.timeWindow.end}`);
            }
        }

        await updateDoc(doc(db, "tasks", taskId), {
            status: 'completed',
            completedAt: new Date().toISOString(),
            ...(evidenceUrl ? { evidenceUrl } : {})
        });
    };

    const verifyTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            await addDoc(collection(db, "history"), {
                taskId: task.id,
                taskTitle: task.title,
                assignedTo: task.assignedTo,
                points: task.points || 0,
                status: 'verified',
                isResponsibility: task.isResponsibility || false,
                date: new Date().toISOString().split('T')[0],
                completedAt: task.completedAt || new Date().toISOString(),
            });
        }

        await updateDoc(doc(db, "tasks", taskId), {
            status: 'verified',
            verifiedAt: new Date().toISOString(),
        });
    };

    const failTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            await addDoc(collection(db, "history"), {
                taskId: task.id,
                taskTitle: task.title,
                assignedTo: task.assignedTo,
                points: 0,
                status: 'missed',
                isResponsibility: task.isResponsibility || false,
                date: new Date().toISOString().split('T')[0],
            });
        }
        await updateDoc(doc(db, "tasks", taskId), { status: 'expired' });
    };

    const rejectTask = async (taskId: string) => {
        await updateDoc(doc(db, "tasks", taskId), {
            status: 'pending',
            completedAt: deleteField()
        });
    };

    // Rewards & Redemptions Logic
    const addReward = async (reward: Omit<Reward, 'id'>) => {
        await addDoc(collection(db, "rewards"), reward);
    };

    const deleteReward = async (rewardId: string) => {
        await deleteDoc(doc(db, "rewards", rewardId));
    };

    const redeemReward = async (redemption: Omit<Redemption, 'id' | 'requestDate' | 'status'>) => {
        // We do NOT deduct points yet. Only when approved.
        await addDoc(collection(db, "redemptions"), {
            ...redemption,
            status: 'pending',
            requestDate: new Date().toISOString()
        });
    };

    const approveRedemption = async (redemptionId: string) => {
        const redemption = redemptions.find(r => r.id === redemptionId);
        if (!redemption || redemption.status !== 'pending') return;

        // Deduct points from history?
        // Actually, we calculate points dynamically from history. 
        // So we need to add a NEGATIVE entry to history to represent "Usage" or "Redemption".
        // Let's create a special history type entry for this.

        await addDoc(collection(db, "history"), {
            taskId: 'redemption-' + redemptionId, // Fake ID
            taskTitle: `Canje: ${redemption.rewardTitle}`,
            assignedTo: redemption.childId,
            points: -Math.abs(redemption.cost), // Negative points
            status: 'verified', // Automatically verified
            date: new Date().toISOString().split('T')[0],
            completedAt: new Date().toISOString()
        });

        await updateDoc(doc(db, "redemptions", redemptionId), {
            status: 'approved',
            redeemedDate: new Date().toISOString()
        });
    };

    const rejectRedemption = async (redemptionId: string) => {
        await updateDoc(doc(db, "redemptions", redemptionId), { status: 'rejected' });
    };

    // Recurring tasks check logic - Adapted for centralized execution?
    // In a real app, this should be a backend function. 
    // Here, we can let ONLY the logged-in parent run this check to avoid conflicts, or just run it locally.
    const checkRecurringTasks = async () => {
        // Only run if we have tasks and mostly safe to do so
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        tasks.forEach(async (task) => {
            if (task.status === 'verified' && task.frequency !== 'one-time') {
                // Check if it should be reset
                if (!task.verifiedAt) return;

                const verifiedDate = task.verifiedAt.split('T')[0];
                let shouldReset = false;

                if (task.frequency === 'daily') {
                    // Reset if verified before today
                    if (verifiedDate < today) {
                        shouldReset = true;
                    }
                } else if (task.frequency === 'weekly') {
                    // Reset if verified more than 7 days ago (simple logic) or different week
                    // For simplicity: if verifiedDate is < 7 days ago
                    const diffTime = Math.abs(now.getTime() - new Date(task.verifiedAt).getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays >= 7) {
                        shouldReset = true;
                    }
                }

                if (shouldReset) {
                    await updateDoc(doc(db, "tasks", task.id), {
                        status: 'pending',
                        completedAt: deleteField(),
                        verifiedAt: deleteField(),
                        evidenceUrl: deleteField(),
                    });
                }
            }
        });
    };

    // Checking logic
    useEffect(() => {
        if (tasks.length > 0) {
            checkRecurringTasks();
        }
    }, [tasks.length]); // Simple trigger, or interval

    const isTaskActiveToday = (task: Task) => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...

        // Simple School Day Logic (Mon-Fri) - Holidays to be added later
        const isSchoolDay = dayOfWeek >= 1 && dayOfWeek <= 5;

        // 1. One Time: Always visible (filtering happens by status)
        if (task.frequency === 'one-time') return true;

        // Check Vacation Mode (Parent Setting)
        // Check Vacation Mode (Any Parent)
        const isVacationMode = users.some(u => u.role === 'parent' && u.isVacationMode);

        // 2. School Check
        // If Vacation Mode is ON, school tasks are hidden regardless of day
        if (task.isSchool && isVacationMode) return false;
        // Regular School Day Check (only if not already hidden by vacation)
        if (task.isSchool && !isSchoolDay) return false;

        // 3. Responsibility Check - Does not restrict visibility, only counts for stats
        // if (task.isResponsibility && !isSchoolDay) return false; // REMOVED per user request

        // 4. Specific Recurrence Check
        if (task.recurrenceDays && task.recurrenceDays.length > 0) {
            if (!task.recurrenceDays.includes(dayOfWeek)) return false;
        }

        return true;
    };

    return (
        <TaskContext.Provider
            value={{
                currentUser,
                tasks,
                users,
                history,
                login,
                logout,
                addTask,
                updateTask,
                deleteTask,
                completeTask,
                verifyTask,
                failTask,
                rejectTask,
                messages,
                addMessage,
                updateMessage,
                deleteMessage,
                addUser,
                updateUser,
                deleteUser,
                rewards,
                redemptions,
                addReward,
                deleteReward,
                redeemReward,
                approveRedemption,
                rejectRedemption,
                // @ts-ignore
                isTaskActiveToday
            }}
        >
            {children}
        </TaskContext.Provider>
    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
};
