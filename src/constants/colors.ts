/**
 * Brand Colors & Theme Constants
 * Centralized color definitions for consistent theming
 */

export const BRAND_COLORS = {
    // Primary palette
    primary: '#4338ca',       // Indigo 700
    primaryLight: '#6366f1',  // Indigo 500
    primaryDark: '#3730a3',   // Indigo 800

    // Secondary palette
    secondary: '#f97316',     // Orange 500
    secondaryLight: '#fdba74', // Orange 300
    secondaryDark: '#ea580c', // Orange 600

    // Neutral palette
    cream: '#fef7ed',
    dark: '#1e293b',          // Slate 800

    // Text colors
    textPrimary: '#1f2937',   // Gray 800
    textSecondary: '#6b7280', // Gray 500
    textLight: '#ffffff',
    textMuted: '#9ca3af',     // Gray 400
} as const;

// Child identification colors (for avatars/badges)
export const CHILD_COLORS = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
] as const;

// Task type colors
export const TASK_TYPE_COLORS = {
    obligatory: {
        color: '#6366f1',
        bgColor: '#e0e7ff',
    },
    additional: {
        color: '#22c55e',
        bgColor: '#dcfce7',
    },
} as const;

// Tag colors for various task properties
export const TAG_COLORS = {
    school: {
        color: '#0369a1',
        bgColor: '#e0f2fe',
        className: 'bg-sky-100 text-sky-800',
    },
    responsibility: {
        color: '#be185d',
        bgColor: '#fce7f3',
        className: 'bg-rose-100 text-rose-800',
    },
    extra: {
        color: '#15803d',
        bgColor: '#dcfce7',
        className: 'bg-green-100 text-green-800',
    },
    points: {
        color: '#7c3aed',
        bgColor: '#ede9fe',
        className: 'bg-violet-100 text-violet-800',
    },
} as const;
