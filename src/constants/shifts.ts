/**
 * Shift/Time Period Constants
 * Centralized shift definitions for task scheduling
 */

export const SHIFTS = {
    MORNING: 'morning',
    AFTERNOON: 'afternoon',
    NIGHT: 'night',
    NO_TIME: 'no-time',
} as const;

export type ShiftType = typeof SHIFTS[keyof typeof SHIFTS];

// Order for sorting tasks by shift
export const SHIFT_ORDER: Record<string, number> = {
    [SHIFTS.MORNING]: 1,
    [SHIFTS.AFTERNOON]: 2,
    [SHIFTS.NIGHT]: 3,
    [SHIFTS.NO_TIME]: 4,
};

// Shift display configuration
export const SHIFT_CONFIG = {
    [SHIFTS.MORNING]: {
        label: 'shift.morning',
        emoji: '🌅',
        color: '#92400e',
        bgColor: '#fef3c7',
        className: 'bg-amber-100 text-amber-800',
    },
    [SHIFTS.AFTERNOON]: {
        label: 'shift.afternoon',
        emoji: '☀️',
        color: '#9a3412',
        bgColor: '#ffedd5',
        className: 'bg-orange-100 text-orange-800',
    },
    [SHIFTS.NIGHT]: {
        label: 'shift.night',
        emoji: '🌙',
        color: '#3730a3',
        bgColor: '#e0e7ff',
        className: 'bg-indigo-100 text-indigo-800',
    },
    [SHIFTS.NO_TIME]: {
        label: 'shift.no_schedule',
        emoji: '⏰',
        color: '#6b7280',
        bgColor: '#f3f4f6',
        className: 'bg-gray-100 text-gray-600',
    },
} as const;
