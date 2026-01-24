/**
 * Date Utilities Hook
 * Centralized date formatting and manipulation functions
 */

import { useMemo, useCallback } from 'react';

interface DateUtilsOptions {
    timezone?: string;
}

export const useDateUtils = (options: DateUtilsOptions = {}) => {
    const timezone = options.timezone || 'America/Chicago';

    /**
     * Get local date string in YYYY-MM-DD format (timezone-aware)
     */
    const getLocalDateString = useCallback((date: Date = new Date()): string => {
        try {
            return new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: timezone,
            }).format(date);
        } catch {
            // Fallback if timezone invalid
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }, [timezone]);

    /**
     * Format Date object to YYYY-MM-DD string
     */
    const toDateString = useCallback((date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    /**
     * Convert 24h time string to 12h format
     * @param time24 - Time in "HH:MM" format
     * @returns Time in "h:MM AM/PM" format
     */
    const to12h = useCallback((time24?: string): string => {
        if (!time24 || !time24.includes(':')) return '';

        const [hoursStr, minutes] = time24.split(':');
        let hours = parseInt(hoursStr, 10);

        if (isNaN(hours)) return time24;

        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;

        return `${hours}:${minutes} ${ampm}`;
    }, []);

    /**
     * Convert 12h time string to 24h format
     * @param time12 - Time in "h:MM AM/PM" format
     * @returns Time in "HH:MM" format
     */
    const to24h = useCallback((time12: string): string => {
        const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return time12;

        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${String(hours).padStart(2, '0')}:${minutes}`;
    }, []);

    /**
     * Check if a date string is today
     */
    const isToday = useCallback((dateStr: string): boolean => {
        return dateStr === getLocalDateString();
    }, [getLocalDateString]);

    /**
     * Check if a date string is yesterday
     */
    const isYesterday = useCallback((dateStr: string): boolean => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return dateStr === getLocalDateString(yesterday);
    }, [getLocalDateString]);

    /**
     * Check if a date string is tomorrow
     */
    const isTomorrow = useCallback((dateStr: string): boolean => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return dateStr === getLocalDateString(tomorrow);
    }, [getLocalDateString]);

    /**
     * Get relative date label (Today, Yesterday, Tomorrow, or date)
     */
    const getRelativeDateLabel = useCallback((dateStr: string, t: (key: string) => string): string => {
        if (isToday(dateStr)) return t('filter.date.today');
        if (isYesterday(dateStr)) return t('filter.date.yesterday');
        if (isTomorrow(dateStr)) return t('filter.date.tomorrow');

        // Format as readable date
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString();
    }, [isToday, isYesterday, isTomorrow]);

    /**
     * Get day of week from date string (timezone-aware)
     */
    const getDayOfWeek = useCallback((dateStr: string): number => {
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.getDay(); // 0 = Sunday, 1 = Monday, ...
    }, []);

    /**
     * Compare two date strings
     * @returns negative if a < b, 0 if equal, positive if a > b
     */
    const compareDates = useCallback((a: string, b: string): number => {
        return a.localeCompare(b);
    }, []);

    /**
     * Get start and end of week for a given date
     */
    const getWeekRange = useCallback((date: Date = new Date()): { start: string; end: string } => {
        const current = new Date(date);
        const dayOfWeek = current.getDay();

        // Get Monday of current week
        const monday = new Date(current);
        monday.setDate(current.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        // Get Sunday of current week
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            start: toDateString(monday),
            end: toDateString(sunday),
        };
    }, [toDateString]);

    /**
     * Parse ISO date string and return local date string
     */
    const parseISOToLocal = useCallback((isoString: string): string => {
        const date = new Date(isoString);
        return getLocalDateString(date);
    }, [getLocalDateString]);

    // Memoized today string
    const todayString = useMemo(() => getLocalDateString(), [getLocalDateString]);

    return {
        getLocalDateString,
        toDateString,
        to12h,
        to24h,
        isToday,
        isYesterday,
        isTomorrow,
        getRelativeDateLabel,
        getDayOfWeek,
        compareDates,
        getWeekRange,
        parseISOToLocal,
        todayString,
    };
};

// Standalone utility functions (for use outside React components)
export const dateUtils = {
    toDateString: (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    to12h: (time24?: string): string => {
        if (!time24 || !time24.includes(':')) return '';
        const [hoursStr, minutes] = time24.split(':');
        let hours = parseInt(hoursStr, 10);
        if (isNaN(hours)) return time24;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    },

    getLocalDateString: (date: Date = new Date(), timezone = 'America/Chicago'): string => {
        try {
            return new Intl.DateTimeFormat('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: timezone,
            }).format(date);
        } catch {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    },
};

export default useDateUtils;
