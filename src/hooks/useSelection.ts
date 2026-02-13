/**
 * Selection Hook
 * Reusable multi-selection logic for batch operations
 */

import { useState, useCallback, useMemo } from 'react';

interface Identifiable {
    id: string;
}

interface UseSelectionOptions<T> {
    items: T[];
    /** Optional filter to determine if an item can be selected */
    canSelect?: (item: T) => boolean;
}

export const useSelection = <T extends Identifiable>(options: UseSelectionOptions<T>) => {
    const { items, canSelect } = options;
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    /**
     * Get selectable items based on canSelect filter
     */
    const selectableItems = useMemo(() => {
        if (!canSelect) return items;
        return items.filter(canSelect);
    }, [items, canSelect]);

    /**
     * Check if an item is selected
     */
    const isSelected = useCallback((id: string): boolean => {
        return selectedIds.has(id);
    }, [selectedIds]);

    /**
     * Toggle selection of a single item
     */
    const toggleSelection = useCallback((item: T) => {
        // Check if item can be selected
        if (canSelect && !canSelect(item)) return;

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(item.id)) {
                next.delete(item.id);
            } else {
                next.add(item.id);
            }
            return next;
        });
    }, [canSelect]);

    /**
     * Select a single item
     */
    const select = useCallback((id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        if (canSelect && !canSelect(item)) return;

        setSelectedIds(prev => new Set(prev).add(id));
    }, [items, canSelect]);

    /**
     * Deselect a single item
     */
    const deselect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    /**
     * Select all selectable items
     */
    const selectAll = useCallback(() => {
        const ids = selectableItems.map(item => item.id);
        setSelectedIds(new Set(ids));
    }, [selectableItems]);

    /**
     * Clear all selections
     */
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    /**
     * Get selected items
     */
    const selectedItems = useMemo(() => {
        return items.filter(item => selectedIds.has(item.id));
    }, [items, selectedIds]);

    /**
     * Check if all selectable items are selected
     */
    const allSelected = useMemo(() => {
        if (selectableItems.length === 0) return false;
        return selectableItems.every(item => selectedIds.has(item.id));
    }, [selectableItems, selectedIds]);

    /**
     * Check if some (but not all) items are selected
     */
    const someSelected = useMemo(() => {
        return selectedIds.size > 0 && !allSelected;
    }, [selectedIds, allSelected]);

    /**
     * Toggle select all / clear all
     */
    const toggleSelectAll = useCallback(() => {
        if (allSelected) {
            clearSelection();
        } else {
            selectAll();
        }
    }, [allSelected, clearSelection, selectAll]);

    return {
        selectedIds,
        selectedItems,
        selectedCount: selectedIds.size,
        selectableCount: selectableItems.length,
        isSelected,
        toggleSelection,
        select,
        deselect,
        selectAll,
        clearSelection,
        toggleSelectAll,
        allSelected,
        someSelected,
        hasSelection: selectedIds.size > 0,
    };
};

export default useSelection;
