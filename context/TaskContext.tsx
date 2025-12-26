import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, User, TaskHistory } from '../types';
import { TASKS, USERS } from '../data/mockData';
import { MOCK_HISTORY } from '../data/historyData';

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
    completeTask: (taskId: string) => void;
    verifyTask: (taskId: string) => void;
    failTask: (taskId: string) => void;
    rejectTask: (taskId: string) => void;
    messages: string[];
    addMessage: (text: string) => void;
    deleteMessage: (index: number) => void;
    addUser: (user: Omit<User, 'id'>) => void;
    deleteUser: (userId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>(TASKS);
    const [users, setUsers] = useState<User[]>(USERS);
    const [history, setHistory] = useState<TaskHistory[]>(MOCK_HISTORY);
    const [messages, setMessages] = useState<string[]>([
        "¡Tú puedes con todo! 🚀",
        "El esfuerzo de hoy es el éxito de mañana. 💪",
        "¡Eres increíble! No olvides sonreír. 😊",
        "Cada tarea completada es un paso hacia tu meta. 🏆"
    ]);

    // ... existing functions ...

    const addMessage = (text: string) => {
        setMessages(prev => [...prev, text]);
    };

    const deleteMessage = (index: number) => {
        setMessages(prev => prev.filter((_, i) => i !== index));
    };

    const addUser = (newUser: Omit<User, 'id'>) => {
        const user: User = {
            ...newUser,
            id: Math.random().toString(36).substr(2, 9),
        };
        setUsers(prev => [...prev, user]);
    };

    const deleteUser = (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    };

    const login = (username: string, password?: string) => {
        const user = users.find((u) => u.username === username);
        if (user && user.password === password) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const addTask = (newTask: Omit<Task, 'id'>) => {
        const task: Task = {
            ...newTask,
            id: Math.random().toString(36).substr(2, 9),
        };
        setTasks((prev) => [...prev, task]);
    };

    const updateTask = (taskId: string, updates: Partial<Task>) => {
        setTasks((prev) =>
            prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
        );
    };

    const deleteTask = (taskId: string) => {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
    };

    const completeTask = (taskId: string) => {
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

        updateTask(taskId, {
            status: 'completed',
            completedAt: new Date().toISOString(),
        });
    };

    const verifyTask = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            // Add to history
            const historyItem: TaskHistory = {
                id: Math.random().toString(36).substr(2, 9),
                taskId: task.id,
                taskTitle: task.title,
                assignedTo: task.assignedTo,
                points: task.points || 0,
                status: 'verified',
                date: new Date().toISOString().split('T')[0],
                completedAt: task.completedAt || new Date().toISOString(),
            };
            setHistory(prev => [...prev, historyItem]);
        }

        updateTask(taskId, {
            status: 'verified',
            verifiedAt: new Date().toISOString(),
        });
    };

    const failTask = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const historyItem: TaskHistory = {
                id: Math.random().toString(36).substr(2, 9),
                taskId: task.id,
                taskTitle: task.title,
                assignedTo: task.assignedTo,
                points: 0,
                status: 'missed',
                date: new Date().toISOString().split('T')[0],
            };
            setHistory(prev => [...prev, historyItem]);
        }

        updateTask(taskId, { status: 'expired' });
    };

    const rejectTask = (taskId: string) => {
        updateTask(taskId, {
            status: 'pending',
            completedAt: undefined // Clear completion timestamp so they can do it again
        });
    };

    const checkRecurringTasks = () => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculate start of the week (Monday)
        const day = now.getDay(); // 0 is Sunday, 1 is Monday
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);

        setTasks(prevTasks => prevTasks.map(task => {
            if (task.status === 'pending' || task.status === 'expired') return task;
            if (!task.completedAt) return task;

            const completedDate = new Date(task.completedAt);
            let shouldReset = false;

            if (task.frequency === 'daily') {
                // If completed before today, reset
                if (completedDate < startOfToday) {
                    shouldReset = true;
                }
            } else if (task.frequency === 'weekly') {
                // If completed before this Monday, reset
                if (completedDate < startOfWeek) {
                    shouldReset = true;
                }
            }

            if (shouldReset) {
                return {
                    ...task,
                    status: 'pending',
                    completedAt: undefined,
                    verifiedAt: undefined
                };
            }

            return task;
        }));
    };

    // Check for recurring tasks on mount and every minute (or whenever relevant)
    useEffect(() => {
        checkRecurringTasks();
        // Optional: Interval to check periodically if the app stays open across midnight
        const interval = setInterval(checkRecurringTasks, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

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
                deleteMessage,
                addUser,
                deleteUser
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
