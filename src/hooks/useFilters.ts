/**
 * Generic Filters Hook
 * Reusable filtering logic for tasks, history, and other data
 */

import { useState, useMemo, useCallback } from 'react';

export interface FilterState {
    searchText: string;
    childFilter: string;
    statusFilter: string;
    typeFilter: string;
    frequencyFilter: string;
    shiftFilter: string;
    dateRange?: {
        start: string;
        end: string;
    };
}

export const DEFAULT_FILTER_STATE: FilterState = {
    searchText: '',
    childFilter: 'all',
    statusFilter: 'all',
    typeFilter: 'all',
    frequencyFilter: 'all',
    shiftFilter: 'all',
    dateRange: undefined,
};

interface UseFiltersOptions<T> {
    items: T[];
    filterFn?: (item: T, filters: FilterState) => boolean;
    initialFilters?: Partial<FilterState>;
}

interface FilterableItem {
    title?: string;
    description?: string;
    status?: string;
    type?: string;
    frequency?: string;
    shift?: string;
    assignedTo?: string;
    date?: string;
    dueDate?: string;
    isResponsibility?: boolean;
    isSchool?: boolean;
}

/**
 * Default filter function for task-like items
 */
const defaultFilterFn = <T extends FilterableItem>(item: T, filters: FilterState): boolean => {
    // Search text filter
    if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(searchLower);
        const descMatch = item.description?.toLowerCase().includes(searchLower);
        if (!titleMatch && !descMatch) return false;
    }

    // Child filter
    if (filters.childFilter !== 'all') {
        if (item.assignedTo !== filters.childFilter) return false;
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
        if (item.status !== filters.statusFilter) return false;
    }

    // Type filter
    if (filters.typeFilter !== 'all') {
        switch (filters.typeFilter) {
            case 'responsibility':
                if (!item.isResponsibility) return false;
                break;
            case 'school':
                if (!item.isSchool) return false;
                break;
            case 'extra':
            case 'additional':
                if (item.isResponsibility || item.type !== 'additional') return false;
                break;
            default:
                if (item.type !== filters.typeFilter) return false;
        }
    }

    // Frequency filter
    if (filters.frequencyFilter !== 'all') {
        if (item.frequency !== filters.frequencyFilter) return false;
    }

    // Shift filter
    if (filters.shiftFilter !== 'all') {
        if (item.shift !== filters.shiftFilter) return false;
    }

    // Date range filter
    if (filters.dateRange) {
        const itemDate = item.date || item.dueDate;
        if (itemDate) {
            if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
                return false;
            }
        }
    }

    return true;
};

export const useFilters = <T extends FilterableItem>(options: UseFiltersOptions<T>) => {
    const { items, filterFn = defaultFilterFn, initialFilters = {} } = options;

    const [filters, setFiltersState] = useState<FilterState>({
        ...DEFAULT_FILTER_STATE,
        ...initialFilters,
    });

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.searchText) count++;
        if (filters.childFilter !== 'all') count++;
        if (filters.statusFilter !== 'all') count++;
        if (filters.typeFilter !== 'all') count++;
        if (filters.frequencyFilter !== 'all') count++;
        if (filters.shiftFilter !== 'all') count++;
        if (filters.dateRange) count++;
        return count;
    }, [filters]);

    // Filter items
    const filteredItems = useMemo(() => {
        return items.filter(item => filterFn(item, filters));
    }, [items, filters, filterFn]);

    // Update single filter
    const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        setFiltersState(prev => ({ ...prev, [key]: value }));
    }, []);

    // Update multiple filters
    const setFilters = useCallback((updates: Partial<FilterState>) => {
        setFiltersState(prev => ({ ...prev, ...updates }));
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFiltersState(DEFAULT_FILTER_STATE);
    }, []);

    // Clear single filter
    const clearFilter = useCallback(<K extends keyof FilterState>(key: K) => {
        setFiltersState(prev => ({ ...prev, [key]: DEFAULT_FILTER_STATE[key] }));
    }, []);

    // Check if any filters are active
    const hasActiveFilters = activeFilterCount > 0;

    return {
        filters,
        setFilter,
        setFilters,
        clearFilters,
        clearFilter,
        filteredItems,
        activeFilterCount,
        hasActiveFilters,
        totalItems: items.length,
        filteredCount: filteredItems.length,
    };
};

export default useFilters;
