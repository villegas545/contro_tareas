/**
 * Week Days Constants
 * Centralized day definitions for scheduling
 */

// JavaScript Date.getDay() order: 0 = Sunday, 1 = Monday, ...
export const WEEKDAY_INDEX = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
} as const;

// Week days in display order (Monday first)
export const WEEK_DAYS_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

// Week days starting from Sunday
export const WEEK_DAYS_CALENDAR_ORDER = [0, 1, 2, 3, 4, 5, 6] as const;

// Translation keys for day names
export const WEEKDAY_LABELS = {
    [WEEKDAY_INDEX.SUNDAY]: 'filter.date.sunday',
    [WEEKDAY_INDEX.MONDAY]: 'filter.date.monday',
    [WEEKDAY_INDEX.TUESDAY]: 'filter.date.tuesday',
    [WEEKDAY_INDEX.WEDNESDAY]: 'filter.date.wednesday',
    [WEEKDAY_INDEX.THURSDAY]: 'filter.date.thursday',
    [WEEKDAY_INDEX.FRIDAY]: 'filter.date.friday',
    [WEEKDAY_INDEX.SATURDAY]: 'filter.date.saturday',
} as const;

// Short labels (fallback)
export const WEEKDAY_SHORT_LABELS = {
    [WEEKDAY_INDEX.SUNDAY]: 'Dom',
    [WEEKDAY_INDEX.MONDAY]: 'Lun',
    [WEEKDAY_INDEX.TUESDAY]: 'Mar',
    [WEEKDAY_INDEX.WEDNESDAY]: 'Mié',
    [WEEKDAY_INDEX.THURSDAY]: 'Jue',
    [WEEKDAY_INDEX.FRIDAY]: 'Vie',
    [WEEKDAY_INDEX.SATURDAY]: 'Sáb',
} as const;

// School days (Monday to Friday)
export const SCHOOL_DAYS = [
    WEEKDAY_INDEX.MONDAY,
    WEEKDAY_INDEX.TUESDAY,
    WEEKDAY_INDEX.WEDNESDAY,
    WEEKDAY_INDEX.THURSDAY,
    WEEKDAY_INDEX.FRIDAY,
] as const;
