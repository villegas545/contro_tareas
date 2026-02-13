/**
 * MonitoringTab - Migrated Version
 * 
 * This is an example of how to migrate a component to use the new architecture.
 * It demonstrates:
 * - Using new hooks (useDateUtils, useSelection)
 * - Using constants instead of magic strings
 * - Using separate contexts instead of monolithic TaskContext
 * 
 * To use this version, replace the import in ParentDashboard.tsx:
 * - import { MonitoringTab } from '../components/dashboard/MonitoringTab';
 * + import { MonitoringTab } from '../src/components/dashboard/MonitoringTabMigrated';
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Old imports - still work
import { useTaskContext } from '../../context/TaskContext';
import { ParentTaskCard } from '../../components/ParentTaskCard';
import { Task } from '../../types';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { AdvancedFilterControls } from '../../components/ui/AdvancedFilterControls';

// NEW imports - from refactored structure
import { useDateUtils } from '../hooks/useDateUtils';
import { useSelection } from '../hooks/useSelection';
import { TASK_STATUS } from '../constants/taskStatus';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export const MonitoringTabMigrated = () => {
    const navigation = useNavigation<any>();

    // Still using TaskContext for data (gradual migration)
    const { tasks, users, categories, verifyTask, rejectTask, deleteTask, isTaskActiveToday, t, getCurrentDate } = useTaskContext();

    // NEW: Using useDateUtils hook instead of duplicated functions
    const { toDateString, getLocalDateString: getLocalDate } = useDateUtils();

    // Date filter state
    const [filterDate, setFilterDate] = useState<Date>(() => getCurrentDate());
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'verified' | 'expired'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'responsibility' | 'extra' | 'school'>('all');
    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    // Confirmation Modal State
    const [confirmationAction, setConfirmationAction] = useState<{
        type: 'verify' | 'reject' | 'delete' | 'batch_verify',
        taskId?: string,
        count?: number
    } | null>(null);

    // Filter active tasks
    const activeTasks = useMemo(() => {
        return (selectedChildId
            ? tasks.filter(t => t.assignedTo === selectedChildId && t.assignedTo !== 'pool')
            : tasks.filter(t => t.assignedTo !== 'pool')
        ).filter(t => {
            const isToday = filterDate.toDateString() === getCurrentDate().toDateString();

            if (isToday) {
                return isTaskActiveToday ? isTaskActiveToday(t) : true;
            } else {
                if (t.dueDate) return new Date(t.dueDate).toDateString() === filterDate.toDateString();
                if (t.frequency === 'daily') return true;
                if (t.frequency === 'weekly' && t.recurrenceDays) {
                    return t.recurrenceDays.includes(filterDate.getDay());
                }
                return false;
            }
        })
            .filter(t => {
                if (statusFilter !== 'all' && t.status !== statusFilter) return false;
                if (typeFilter === 'responsibility') return t.type === 'obligatory';
                if (typeFilter === 'extra') return t.type === 'additional';
                if (typeFilter === 'school') return t.isSchool;

                if (searchText) {
                    const searchLower = searchText.toLowerCase();
                    return t.title.toLowerCase().includes(searchLower);
                }

                return true;
            })
            .sort((a, b) => {
                // Using TASK_STATUS constant for comparison
                const statusPriority: Record<string, number> = {
                    [TASK_STATUS.COMPLETED]: 1,
                    [TASK_STATUS.PENDING]: 2,
                    [TASK_STATUS.VERIFIED]: 3,
                    [TASK_STATUS.EXPIRED]: 4
                };
                const pA = statusPriority[a.status] || 99;
                const pB = statusPriority[b.status] || 99;

                if (pA !== pB) return pA - pB;
                return a.title.localeCompare(b.title);
            });
    }, [tasks, selectedChildId, filterDate, isTaskActiveToday, statusFilter, typeFilter, searchText]);

    // NEW: Using useSelection hook for task selection
    const {
        selectedIds: selectedTaskIds,
        toggleSelection,
        clearSelection,
        hasSelection,
        selectedCount
    } = useSelection({
        items: activeTasks,
        canSelect: (task) => task.status !== TASK_STATUS.VERIFIED, // Can't select already verified
    });

    // Verify all filtered tasks
    const handleVerifyFilter = () => {
        const verifyableTaskIds = activeTasks
            .filter(t => t.status !== TASK_STATUS.VERIFIED)
            .map(t => t.id);

        if (verifyableTaskIds.length === 0) {
            Alert.alert(t('common.info') || 'Info', t('monitoring.no_tasks_to_verify'));
            return;
        }

        // Select all verifiable and show confirmation
        verifyableTaskIds.forEach(id => {
            const task = activeTasks.find(t => t.id === id);
            if (task) toggleSelection(task);
        });
        setConfirmationAction({ type: 'batch_verify', count: verifyableTaskIds.length });
    };

    const handleBatchVerify = () => {
        if (selectedCount === 0) return;
        setConfirmationAction({ type: 'batch_verify', count: selectedCount });
    };

    const confirmVerify = (taskId: string) => {
        setConfirmationAction({ type: 'verify', taskId });
    };

    const confirmReject = (taskId: string) => {
        setConfirmationAction({ type: 'reject', taskId });
    };

    const confirmUnassign = (taskId: string) => {
        setConfirmationAction({ type: 'delete', taskId });
    };

    // Execute the confirmed action
    const executeAction = async () => {
        if (!confirmationAction) return;

        if (confirmationAction.type === 'verify' && confirmationAction.taskId) {
            verifyTask(confirmationAction.taskId);
        }
        if (confirmationAction.type === 'reject' && confirmationAction.taskId) {
            rejectTask(confirmationAction.taskId);
        }
        if (confirmationAction.type === 'delete' && confirmationAction.taskId) {
            deleteTask(confirmationAction.taskId);
        }
        if (confirmationAction.type === 'batch_verify') {
            for (const id of Array.from(selectedTaskIds)) {
                await verifyTask(id);
            }
            clearSelection();
        }

        setConfirmationAction(null);
    };

    // NEW: Using hook for date comparison
    const todayStr = getLocalDate();
    const filterDateStr = toDateString(filterDate);
    const isFutureDate = filterDateStr > todayStr;

    return (
        <View className="flex-1 relative">
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="px-6 py-2 border-b border-gray-100 dark:border-gray-800">
                    <AdvancedFilterControls
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        searchText={searchText}
                        setSearchText={setSearchText}
                        searchPlaceholder={`${t('common.search')}...`}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        statusOptions={[
                            { id: 'all', label: t('filter.all') },
                            { id: 'pending', label: t('status.pending_emoji') },
                            { id: 'completed', label: t('status.in_review_emoji') },
                            { id: 'verified', label: t('status.verified_emoji') },
                            { id: 'expired', label: t('status.failed_expired_emoji') },
                        ]}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                    >
                        <View className="flex-row items-center justify-between mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                            <Text className="text-gray-500 text-xs font-bold uppercase">{t('monitoring.view_date')}</Text>
                            <DatePicker
                                value={toDateString(filterDate)}
                                onChange={(d) => {
                                    if (d) {
                                        const [y, m, day] = d.split('-').map(Number);
                                        setFilterDate(new Date(y, m - 1, day));
                                    } else {
                                        setFilterDate(getCurrentDate());
                                    }
                                }}
                            />
                        </View>

                        <Text className="text-gray-500 text-xs font-bold uppercase mb-2">{t('monitoring.filter_child')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} className="mb-4">
                            <TouchableOpacity
                                onPress={() => setSelectedChildId(null)}
                                className={`px-4 py-2 rounded-full border ${selectedChildId === null
                                    ? 'bg-gray-800 border-gray-800'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <Text className={selectedChildId === null ? 'text-white font-medium' : 'text-gray-700'}>{t('monitoring.all_children')}</Text>
                            </TouchableOpacity>

                            {users.filter(u => u.role === 'child').map(child => {
                                const isSelected = selectedChildId === child.id;
                                const userColor = child.color || '#4338ca';

                                return (
                                    <TouchableOpacity
                                        key={child.id}
                                        onPress={() => setSelectedChildId(child.id)}
                                        style={isSelected ? { backgroundColor: userColor, borderColor: userColor } : { borderColor: '#d1d5db' }}
                                        className="px-4 py-2 rounded-full border bg-white flex-row items-center gap-2"
                                    >
                                        {!isSelected && (
                                            <View style={{ backgroundColor: userColor }} className="w-2 h-2 rounded-full" />
                                        )}
                                        <Text className={isSelected ? 'text-white font-medium' : 'text-gray-700'}>{child.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </AdvancedFilterControls>
                </View>

                <View className="p-5">
                    <Text className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">{t('monitoring.active_tasks')}</Text>
                    <Text className="text-xs text-gray-400 mb-4 italic">
                        {t('monitoring.tip_select')}
                    </Text>

                    {/* Verify All Button */}
                    {activeTasks.some(t => t.status !== TASK_STATUS.VERIFIED) && (
                        <View className="mb-4 items-end">
                            <TouchableOpacity
                                onPress={handleVerifyFilter}
                                className="bg-indigo-100 dark:bg-indigo-900 px-4 py-2 rounded-lg flex-row items-center"
                            >
                                <Text className="text-indigo-700 dark:text-indigo-300 font-bold text-xs">{t('monitoring.verify_all_filtered')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {activeTasks.length === 0 ? (
                        <Text className="text-gray-400 text-center py-8">{t('monitoring.no_active_tasks')}</Text>
                    ) : (
                        (() => {
                            const categorySections = [
                                ...categories.map(cat => ({
                                    id: cat.id,
                                    title: `${cat.icon} ${cat.name}`,
                                    isUncategorized: false
                                })),
                                {
                                    id: 'uncategorized',
                                    title: '📂 General',
                                    isUncategorized: true
                                }
                            ];

                            return categorySections.map(section => {
                                const sectionTasks = activeTasks.filter(t =>
                                    section.isUncategorized
                                        ? !t.categoryId || !categories.find(c => c.id === t.categoryId)
                                        : t.categoryId === section.id
                                );

                                if (sectionTasks.length === 0) return null;

                                const isExpanded = expandedCategories[section.id] ?? true;
                                const pending = sectionTasks.filter(t => t.status === TASK_STATUS.PENDING).length;
                                const completed = sectionTasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
                                const verified = sectionTasks.filter(t => t.status === TASK_STATUS.VERIFIED).length;

                                return (
                                    <View key={section.id} className="mb-4">
                                        <TouchableOpacity
                                            onPress={() => setExpandedCategories(prev => ({ ...prev, [section.id]: !isExpanded }))}
                                            className="flex-row justify-between items-center p-3 rounded-xl border bg-white border-gray-200 mb-2 shadow-sm"
                                        >
                                            <View className="flex-row items-center gap-2 flex-1 mr-2">
                                                <Text className="font-bold text-gray-800 text-lg mr-2">{section.title}</Text>
                                                <View className="flex-col gap-0 items-start ml-auto">
                                                    {pending === 0 && sectionTasks.length > 0 ? (
                                                        <Text className="text-green-600 font-bold">{t('status.completed_msg')}</Text>
                                                    ) : (
                                                        <>
                                                            <Text className="text-[10px] text-red-500 font-bold">{pending} {t('status.pending')}</Text>
                                                            <Text className="text-[10px] text-orange-500 font-bold">{completed} {t('status.in_review')}</Text>
                                                            <Text className="text-[10px] text-green-600 font-bold">{verified} {t('status.verified')}</Text>
                                                        </>
                                                    )}
                                                </View>
                                            </View>
                                            <Text className="text-gray-400">{isExpanded ? '▼' : '▶'}</Text>
                                        </TouchableOpacity>

                                        {isExpanded && (
                                            <View className="gap-0">
                                                {sectionTasks.map(item => {
                                                    const isSelected = selectedTaskIds.has(item.id);
                                                    return (
                                                        <View
                                                            key={item.id}
                                                            className={`mb-4 rounded-xl border-4 overflow-hidden relative ${isSelected ? 'border-green-500 bg-green-50 transform scale-[1.02]' : 'border-transparent'}`}
                                                        >
                                                            {isSelected && (
                                                                <View className="absolute top-2 right-2 z-10 bg-green-600 rounded-full w-6 h-6 items-center justify-center">
                                                                    <Text className="text-white font-bold">✓</Text>
                                                                </View>
                                                            )}
                                                            <ParentTaskCard
                                                                task={item}
                                                                users={users}
                                                                onVerify={confirmVerify}
                                                                onReject={confirmReject}
                                                                onAssign={() => { }}
                                                                onEdit={(item) => navigation.navigate('CreateTask', { taskToEdit: item })}
                                                                onDelete={confirmUnassign}
                                                                className=""
                                                                isReadOnly={isFutureDate}
                                                                onPress={() => item.status !== TASK_STATUS.VERIFIED && toggleSelection(item)}
                                                            />
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        )}
                                    </View>
                                );
                            });
                        })()
                    )}
                </View>
            </ScrollView>

            {/* Batch Verify Button */}
            {hasSelection && (
                <View className="absolute bottom-6 left-6 right-6 z-50">
                    <Button
                        title={t('monitoring.btn_verify_count').replace('{count}', String(selectedCount))}
                        onPress={handleBatchVerify}
                        className="shadow-xl bg-green-600 h-14"
                        textClassName="text-lg font-bold"
                    />
                </View>
            )}

            {/* NEW: Using ConfirmationModal component */}
            <ConfirmationModal
                visible={!!confirmationAction}
                title={confirmationAction?.type === 'batch_verify'
                    ? t('monitoring.batch_verify')
                    : confirmationAction ? t(`monitoring.confirm_${confirmationAction.type}`) : ''}
                message={confirmationAction?.type === 'batch_verify'
                    ? `${t('monitoring.batch_verify_confirm')} ${confirmationAction.count || selectedCount} ${t('monitoring.selected_tasks')}?`
                    : confirmationAction ? t(`monitoring.confirm_${confirmationAction.type}_msg`) : ''}
                confirmText={confirmationAction?.type === 'batch_verify'
                    ? t('monitoring.verify_all')
                    : confirmationAction ? t(`monitoring.yes_${confirmationAction.type}`) : ''}
                cancelText={t('common.cancel')}
                confirmVariant={confirmationAction?.type === 'verify' || confirmationAction?.type === 'batch_verify' ? 'primary' : 'danger'}
                onConfirm={executeAction}
                onCancel={() => setConfirmationAction(null)}
            />
        </View>
    );
};

export default MonitoringTabMigrated;
