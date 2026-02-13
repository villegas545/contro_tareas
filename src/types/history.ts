/**
 * History Types
 * Task history and activity log type definitions
 */

export type HistoryStatus = 'verified' | 'missed' | 'completed';

export interface TaskHistory {
    id: string;
    taskId: string;
    taskTitle: string;
    assignedTo: string;
    points: number;
    status: HistoryStatus;
    isResponsibility?: boolean;
    date: string; // YYYY-MM-DD
    completedAt?: string; // ISO datetime
    shift?: string;
}
