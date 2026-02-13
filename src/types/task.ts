/**
 * Task Types
 * Task, template, and related type definitions
 */

export type TaskType = 'obligatory' | 'additional';
export type TaskFrequency = 'daily' | 'weekly' | 'one-time';
export type TaskStatus = 'pending' | 'completed' | 'verified' | 'expired';
export type ShiftType = 'morning' | 'afternoon' | 'night' | 'no-time';

export interface TimeWindow {
    start: string; // HH:MM format
    end: string;   // HH:MM format
}

export interface TaskTemplate {
    id: string;
    title: string;
    description?: string;
    createdBy: string;
    type: TaskType;
    frequency: TaskFrequency;
    points: number;
    timeWindow?: TimeWindow;
    timeLimit?: number; // minutes
    isResponsibility: boolean;
    isSchool: boolean;
    recurrenceDays?: number[]; // 0=Sun, 1=Mon, etc.
    shift?: ShiftType;
    categoryId?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    assignedTo: string;
    createdBy: string;
    dueDate?: string;  // YYYY-MM-DD
    dueTime?: string;  // HH:MM
    status: TaskStatus;
    type: TaskType;
    frequency: TaskFrequency;
    points?: number;
    completedAt?: string;  // ISO datetime
    verifiedAt?: string;   // ISO datetime
    reminder?: boolean;
    timeWindow?: TimeWindow;
    timeLimit?: number;
    evidenceUrl?: string;
    isResponsibility?: boolean;
    isSchool?: boolean;
    recurrenceDays?: number[];
    shift?: ShiftType;
    templateId?: string;
    originalTaskId?: string; // DEPRECATED: Use templateId
    categoryId?: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color?: string;
    order: number;
}

export interface JustificationReason {
    id: string;
    text: string;
}
