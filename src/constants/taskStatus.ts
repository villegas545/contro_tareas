/**
 * Task Status Constants
 * Centralized status values to avoid magic strings
 */

export const TASK_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    VERIFIED: 'verified',
    EXPIRED: 'expired',
} as const;

export type TaskStatusType = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// Status display configuration
export const STATUS_CONFIG = {
    [TASK_STATUS.PENDING]: {
        label: 'status.pending',
        emoji: '⏳',
        color: '#f59e0b', // amber
        bgColor: '#fef3c7',
    },
    [TASK_STATUS.COMPLETED]: {
        label: 'status.completed',
        emoji: '✅',
        color: '#3b82f6', // blue
        bgColor: '#dbeafe',
    },
    [TASK_STATUS.VERIFIED]: {
        label: 'status.verified',
        emoji: '⭐️',
        color: '#22c55e', // green
        bgColor: '#dcfce7',
    },
    [TASK_STATUS.EXPIRED]: {
        label: 'status.expired',
        emoji: '❌',
        color: '#ef4444', // red
        bgColor: '#fee2e2',
    },
} as const;

// Redemption status
export const REDEMPTION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export type RedemptionStatusType = typeof REDEMPTION_STATUS[keyof typeof REDEMPTION_STATUS];
