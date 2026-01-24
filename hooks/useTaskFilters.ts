import { useState, useMemo, useCallback } from 'react';
import { Task } from '../types';

export type StatusFilter = 'all' | 'pending' | 'completed' | 'verified' | 'expired';
export type TypeFilter = 'all' | 'responsibility' | 'extra' | 'school';
export type FrequencyFilter = 'all' | 'daily' | 'weekly' | 'one-time';

interface UseTaskFiltersOptions {
    tasks: Task[];
    initialStatusFilter?: StatusFilter;
    initialTypeFilter?: TypeFilter;
    initialFrequencyFilter?: FrequencyFilter;
}

/**
 * Custom hook for task filtering logic
 * Centralizes filter state and logic used across MonitoringTab, AssignmentTab, etc.
 */
export const useTaskFilters = ({
    tasks,
    initialStatusFilter = 'all',
    initialTypeFilter = 'all',
    initialFrequencyFilter = 'all'
}: UseTaskFiltersOptions) => {
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatusFilter);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>(initialTypeFilter);
    const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>(initialFrequencyFilter);
    const [showFilters, setShowFilters] = useState(false);

    const matchesSearch = useCallback((task: Task): boolean => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            task.title.toLowerCase().includes(searchLower) ||
            (task.description?.toLowerCase() || '').includes(searchLower)
        );
    }, [searchText]);

    const matchesStatus = useCallback((task: Task): boolean => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'expired') {
            return task.status === 'expired' || task.status === 'missed';
        }
        return task.status === statusFilter;
    }, [statusFilter]);

    const matchesType = useCallback((task: Task): boolean => {
        if (typeFilter === 'all') return true;
        if (typeFilter === 'responsibility') return task.type === 'obligatory';
        if (typeFilter === 'extra') return task.type === 'additional';
        if (typeFilter === 'school') return task.isSchool || false;
        return true;
    }, [typeFilter]);

    const matchesFrequency = useCallback((task: Task): boolean => {
        if (frequencyFilter === 'all') return true;
        return task.frequency === frequencyFilter;
    }, [frequencyFilter]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task =>
            matchesSearch(task) &&
            matchesStatus(task) &&
            matchesType(task) &&
            matchesFrequency(task)
        );
    }, [tasks, matchesSearch, matchesStatus, matchesType, matchesFrequency]);

    const resetFilters = useCallback(() => {
        setSearchText('');
        setStatusFilter('all');
        setTypeFilter('all');
        setFrequencyFilter('all');
    }, []);

    const hasActiveFilters = useMemo(() => {
        return (
            searchText !== '' ||
            statusFilter !== 'all' ||
            typeFilter !== 'all' ||
            frequencyFilter !== 'all'
        );
    }, [searchText, statusFilter, typeFilter, frequencyFilter]);

    return {
        // State
        searchText,
        statusFilter,
        typeFilter,
        frequencyFilter,
        showFilters,

        // Setters
        setSearchText,
        setStatusFilter,
        setTypeFilter,
        setFrequencyFilter,
        setShowFilters,

        // Computed
        filteredTasks,
        hasActiveFilters,

        // Actions
        resetFilters,

        // Individual matchers (for custom filtering)
        matchesSearch,
        matchesStatus,
        matchesType,
        matchesFrequency
    };
};

export default useTaskFilters;
