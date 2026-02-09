/**
 * Shared types for context hooks
 */
import { Task, User, TaskHistory, Reward, Redemption, GlobalSettings, Category, TaskTemplate, JustificationReason, Language, TaskSchedule, WalletTransaction } from '../types';

// Shared state interface passed to hooks
export interface SharedState {
    // State
    currentUser: User | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    rawTasks: Task[];
    setRawTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    schedules: TaskSchedule[];
    setSchedules: React.Dispatch<React.SetStateAction<TaskSchedule[]>>;
    templates: TaskTemplate[];
    setTemplates: React.Dispatch<React.SetStateAction<TaskTemplate[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    justificationReasons: JustificationReason[];
    setJustificationReasons: React.Dispatch<React.SetStateAction<JustificationReason[]>>;
    history: TaskHistory[];
    setHistory: React.Dispatch<React.SetStateAction<TaskHistory[]>>;
    messages: string[];
    setMessages: React.Dispatch<React.SetStateAction<string[]>>;
    messageIds: string[];
    setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
    rewards: Reward[];
    setRewards: React.Dispatch<React.SetStateAction<Reward[]>>;
    redemptions: Redemption[];
    setRedemptions: React.Dispatch<React.SetStateAction<Redemption[]>>;
    transactions: WalletTransaction[];
    setTransactions: React.Dispatch<React.SetStateAction<WalletTransaction[]>>;
    globalSettings: GlobalSettings | null;
    setGlobalSettings: React.Dispatch<React.SetStateAction<GlobalSettings | null>>;
    language: Language;
    setLanguageState: React.Dispatch<React.SetStateAction<Language>>;

    // Loading State
    setGlobalLoading: (loading: boolean, message?: string) => void;
    withLoading: <T>(operation: () => Promise<T>, message?: string) => Promise<T>;

    // Date helpers
    debugDate: string | null;
    getCurrentDate: () => Date;
    getLocalDateString: (date?: Date) => string;
}

// Helper to check for Test Mode
export const isTestMode = () => {
    if (typeof window !== 'undefined') {
        // @ts-ignore
        return !!window.Cypress;
    }
    return false;
};
