/**
 * Task Sorting Hook
 * Reusable sorting logic for tasks
 */

import { useMemo, useCallback } from 'react';
import { SHIFT_ORDER } from '../constants/shifts';

interface SortableTask {
    id: string;
    title: string;
    status?: string;
    shift?: string;
    categoryId?: string;
    dueDate?: string;
    dueTime?: string;
    completedAt?: string;
    verifiedAt?: string;
    points?: number;
}

interface Category {
    id: string;
    order?: number;
}

export type SortField = 'shift' | 'category' | 'title' | 'status' | 'date' | 'points';
export type SortDirection = 'asc' | 'desc';

interface SortConfig {
    field: SortField;
    direction: SortDirection;
}

interface UseTaskSortOptions {
    categories?: Category[];
    defaultSort?: SortConfig[];
}

// Status sort order
const STATUS_ORDER: Record<string, number> = {
    'pending': 1,
    'completed': 2, // awaiting review
    'verified': 3,
    'expired': 4,
};

export const useTaskSort = (options: UseTaskSortOptions = {}) => {
    const { categories = [], defaultSort = [] } = options;

    /**
     * Get sort value for shift
     */
    const getShiftOrder = useCallback((shift?: string): number => {
        if (!shift) return 999;
        return SHIFT_ORDER[shift] || 999;
    }, []);

    /**
     * Get sort value for category
     */
    const getCategoryOrder = useCallback((categoryId?: string): number => {
        if (!categoryId) return 999;
        const category = categories.find(c => c.id === categoryId);
        return category?.order ?? 999;
    }, [categories]);

    /**
     * Get sort value for status
     */
    const getStatusOrder = useCallback((status?: string): number => {
        if (!status) return 999;
        return STATUS_ORDER[status] || 999;
    }, []);

    /**
     * Compare two tasks by a single field
     */
    const compareByField = useCallback((a: SortableTask, b: SortableTask, field: SortField, direction: SortDirection): number => {
        let comparison = 0;

        switch (field) {
            case 'shift':
                comparison = getShiftOrder(a.shift) - getShiftOrder(b.shift);
                break;
            case 'category':
                comparison = getCategoryOrder(a.categoryId) - getCategoryOrder(b.categoryId);
                break;
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'status':
                comparison = getStatusOrder(a.status) - getStatusOrder(b.status);
                break;
            case 'date':
                const dateA = a.dueDate || a.completedAt || '';
                const dateB = b.dueDate || b.completedAt || '';
                comparison = dateA.localeCompare(dateB);
                break;
            case 'points':
                comparison = (a.points || 0) - (b.points || 0);
                break;
        }

        return direction === 'desc' ? -comparison : comparison;
    }, [getShiftOrder, getCategoryOrder, getStatusOrder]);

    /**
     * Sort tasks by multiple fields
     */
    const sortTasks = useCallback(<T extends SortableTask>(
        tasks: T[],
        sortConfig: SortConfig[] = defaultSort
    ): T[] => {
        if (sortConfig.length === 0) {
            // Default sort: shift -> category -> title
            sortConfig = [
                { field: 'shift', direction: 'asc' },
                { field: 'category', direction: 'asc' },
                { field: 'title', direction: 'asc' },
            ];
        }

        return [...tasks].sort((a, b) => {
            for (const config of sortConfig) {
                const result = compareByField(a, b, config.field, config.direction);
                if (result !== 0) return result;
            }
            return 0;
        });
    }, [compareByField, defaultSort]);

    /**
     * Sort tasks by default ordering (shift -> category -> title)
     */
    const sortByDefault = useCallback(<T extends SortableTask>(tasks: T[]): T[] => {
        return sortTasks(tasks, [
            { field: 'shift', direction: 'asc' },
            { field: 'category', direction: 'asc' },
            { field: 'title', direction: 'asc' },
        ]);
    }, [sortTasks]);

    /**
     * Sort tasks by status for monitoring view
     */
    const sortByStatus = useCallback(<T extends SortableTask>(tasks: T[]): T[] => {
        return sortTasks(tasks, [
            { field: 'status', direction: 'asc' },
            { field: 'shift', direction: 'asc' },
            { field: 'title', direction: 'asc' },
        ]);
    }, [sortTasks]);

    /**
     * Sort tasks by date (for history/statistics)
     */
    const sortByDate = useCallback(<T extends SortableTask>(tasks: T[], direction: SortDirection = 'desc'): T[] => {
        return sortTasks(tasks, [
            { field: 'date', direction },
            { field: 'status', direction: 'asc' },
        ]);
    }, [sortTasks]);

    return {
        sortTasks,
        sortByDefault,
        sortByStatus,
        sortByDate,
        getShiftOrder,
        getCategoryOrder,
        getStatusOrder,
    };
};

export default useTaskSort;
