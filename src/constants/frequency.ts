/**
 * Task Frequency Constants
 * Centralized frequency definitions for recurring tasks
 */

export const FREQUENCY = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    ONE_TIME: 'one-time',
} as const;

export type FrequencyType = typeof FREQUENCY[keyof typeof FREQUENCY];

// Frequency display configuration
export const FREQUENCY_CONFIG = {
    [FREQUENCY.DAILY]: {
        label: 'frequency.daily',
        emoji: '🔄',
        shortLabel: 'tags.daily',
    },
    [FREQUENCY.WEEKLY]: {
        label: 'frequency.weekly',
        emoji: '🔄',
        shortLabel: 'tags.weekly',
    },
    [FREQUENCY.ONE_TIME]: {
        label: 'frequency.one_time',
        emoji: '📌',
        shortLabel: 'tags.one_time',
    },
} as const;
