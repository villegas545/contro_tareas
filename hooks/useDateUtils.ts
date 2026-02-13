import { useMemo } from 'react';
import { useTaskContext } from '../context/TaskContext';

/**
 * Custom hook for date utility functions with timezone awareness
 * Centralizes date formatting logic used across the app
 */
export const useDateUtils = () => {
    const { globalSettings } = useTaskContext();

    /**
     * Get the current date as YYYY-MM-DD string, timezone aware
     */
    const getLocalDateString = useMemo(() => {
        return (date: Date = new Date()): string => {
            try {
                const timeZone = globalSettings?.timezone || 'America/Chicago';
                return new Intl.DateTimeFormat('en-CA', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    timeZone
                }).format(date);
            } catch {
                // Fallback if timezone invalid
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        };
    }, [globalSettings?.timezone]);

    /**
     * Format date for DatePicker component (YYYY-MM-DD)
     */
    const toDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    /**
     * Parse YYYY-MM-DD string to Date object
     */
    const parseDate = (dateStr: string): Date => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    /**
     * Format date for display (e.g., "23 ene")
     */
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    /**
     * Format date with full day name (e.g., "Lunes, 23 de enero")
     */
    const formatDateFull = (date: Date): string => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    /**
     * Get day of week names in Spanish
     */
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    /**
     * Check if two dates are the same day
     */
    const isSameDay = (date1: Date, date2: Date): boolean => {
        return date1.toDateString() === date2.toDateString();
    };

    /**
     * Check if date is today
     */
    const isToday = (date: Date): boolean => {
        return isSameDay(date, new Date());
    };

    /**
     * Get yesterday's date
     */
    const getYesterday = (): Date => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
    };

    return {
        getLocalDateString,
        toDateString,
        parseDate,
        formatDate,
        formatDateFull,
        dayNames,
        isSameDay,
        isToday,
        getYesterday
    };
};

export default useDateUtils;
