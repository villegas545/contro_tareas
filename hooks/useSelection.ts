import { useState, useCallback, useMemo } from 'react';

interface UseSelectionOptions<T> {
    items: T[];
    getId: (item: T) => string;
    canSelect?: (item: T) => boolean;
}

/**
 * Custom hook for managing multi-selection of items
 * Used for batch operations in MonitoringTab, AssignmentTab, etc.
 */
export function useSelection<T>({
    items,
    getId,
    canSelect = () => true
}: UseSelectionOptions<T>) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggle = useCallback((item: T) => {
        if (!canSelect(item)) return;

        const id = getId(item);
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            return [...prev, id];
        });
    }, [getId, canSelect]);

    const select = useCallback((item: T) => {
        if (!canSelect(item)) return;

        const id = getId(item);
        setSelectedIds(prev => {
            if (prev.includes(id)) return prev;
            return [...prev, id];
        });
    }, [getId, canSelect]);

    const deselect = useCallback((item: T) => {
        const id = getId(item);
        setSelectedIds(prev => prev.filter(i => i !== id));
    }, [getId]);

    const selectAll = useCallback(() => {
        const selectableIds = items
            .filter(canSelect)
            .map(getId);
        setSelectedIds(selectableIds);
    }, [items, canSelect, getId]);

    const deselectAll = useCallback(() => {
        setSelectedIds([]);
    }, []);

    const selectMultiple = useCallback((itemsToSelect: T[]) => {
        const ids = itemsToSelect
            .filter(canSelect)
            .map(getId);
        setSelectedIds(prev => {
            const combined = new Set([...prev, ...ids]);
            return Array.from(combined);
        });
    }, [canSelect, getId]);

    const isSelected = useCallback((item: T): boolean => {
        return selectedIds.includes(getId(item));
    }, [selectedIds, getId]);

    const selectedItems = useMemo(() => {
        return items.filter(item => selectedIds.includes(getId(item)));
    }, [items, selectedIds, getId]);

    const selectedCount = selectedIds.length;
    const hasSelection = selectedCount > 0;

    const allSelected = useMemo(() => {
        const selectableItems = items.filter(canSelect);
        return selectableItems.length > 0 &&
            selectableItems.every(item => selectedIds.includes(getId(item)));
    }, [items, selectedIds, canSelect, getId]);

    return {
        // State
        selectedIds,
        selectedItems,
        selectedCount,
        hasSelection,
        allSelected,

        // Actions
        toggle,
        select,
        deselect,
        selectAll,
        deselectAll,
        selectMultiple,

        // Helpers
        isSelected,
        setSelectedIds
    };
}

export default useSelection;
