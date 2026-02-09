/**
 * Task Types
 * Re-exports from the main types file for backwards compatibility
 */

// Re-export all task-related types from the main types file
export type {
    TaskType,
    TaskFrequency,
    TaskStatus,
    Task,
    TaskTemplate,
    Category,
    JustificationReason
} from '../../types';

// Additional types specific to this module
export type ShiftType = 'morning' | 'afternoon' | 'night' | 'no-time';

export interface TimeWindow {
    start: string; // HH:MM format
    end: string;   // HH:MM format
}
