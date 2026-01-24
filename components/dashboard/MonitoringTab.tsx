
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, Platform, Alert, Modal, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { ParentTaskCard } from '../ParentTaskCard';
import { Task } from '../../types';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';

import { AdvancedFilterControls } from '../ui/AdvancedFilterControls';

export const MonitoringTab = () => {
    const navigation = useNavigation<any>();
    const { tasks, users, categories, verifyTask, rejectTask, deleteTask, isTaskActiveToday, getLocalDateString, t } = useTaskContext();
    // const children = users.filter(u => u.role === 'child');

    // Add date filter state - defaults to Current Date (Today)
    const [filterDate, setFilterDate] = useState<Date>(new Date());

    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'verified' | 'expired'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'responsibility' | 'extra' | 'school'>('all');
    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});



    // Custom Confirmation Modal State
    const [confirmationAction, setConfirmationAction] = useState<{ type: 'verify' | 'reject' | 'delete' | 'batch_verify', taskId?: string, count?: number } | null>(null);

    // Loading state for batch operations
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

    // Helper to format date for DatePicker "YYYY-MM-DD"
    const toDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const activeTasks = useMemo(() => {
        return (selectedChildId
            ? tasks.filter(t => t.assignedTo === selectedChildId && t.assignedTo !== 'pool')
            : tasks.filter(t => t.assignedTo !== 'pool')
        ).filter(t => {
            // Custom Date Filtering Logic
            const isToday = filterDate.toDateString() === new Date().toDateString();

            if (isToday) {
                return isTaskActiveToday ? isTaskActiveToday(t) : true;
            } else {
                // Basic support for other days: 
                if (t.dueDate) return new Date(t.dueDate).toDateString() === filterDate.toDateString();
                if (t.frequency === 'daily') return true;
                // For simplicity, recurrence logic for past dates might need more complex calculation, 
                // but checking recurrenceDays matches the day of the week is a good proxy.
                if (t.frequency === 'weekly' && t.recurrenceDays) {
                    return t.recurrenceDays.includes(filterDate.getDay());
                }
                return false;
            }
        })
            .filter(t => {
                if (statusFilter !== 'all' && t.status !== statusFilter) return false;
                // Filter expired logic if needed specially, but handled by general status check above

                if (typeFilter === 'responsibility') return t.type === 'obligatory';
                if (typeFilter === 'extra') return t.type === 'additional';
                if (typeFilter === 'school') return t.isSchool;

                // Text Search Filter
                if (searchText) {
                    const searchLower = searchText.toLowerCase();
                    const matchesTitle = t.title.toLowerCase().includes(searchLower);
                    // Can extend to description or user name if needed
                    return matchesTitle;
                }

                return true;
            })
            .sort((a, b) => {
                // Priority: Completed (Waiting Verify) > Pending > Verified > Expired
                const statusPriority: any = { 'completed': 1, 'pending': 2, 'verified': 3, 'expired': 4, 'missed': 4 };
                const pA = statusPriority[a.status] || 99;
                const pB = statusPriority[b.status] || 99;

                if (pA !== pB) return pA - pB;

                return a.title.localeCompare(b.title);
            });
    }, [tasks, selectedChildId, filterDate, isTaskActiveToday, statusFilter, typeFilter, searchText]);

    // Optimized selection toggle with useCallback to prevent stale closures
    const handleToggleSelection = React.useCallback((task: Task) => {
        if (task.status === 'verified') return;

        setSelectedTaskIds(prev => {
            // Use functional update to always have the latest state
            const isCurrentlySelected = prev.includes(task.id);
            if (isCurrentlySelected) {
                return prev.filter(id => id !== task.id);
            } else {
                return [...prev, task.id];
            }
        });
    }, []); // Empty deps - we use functional update so we don't need selectedTaskIds

    // New function for verifying all active (filtered) tasks
    const handleVerifyFilter = () => {
        // We only want to verify visible filtered tasks that are pending or in review (completed)
        // We exclude verified, expired or missed tasks typically, though current sorting puts verified/expired at end.
        // Let's filter 'activeTasks' for valid statuses.
        const verifyableTaskIds = activeTasks
            .filter(t => t.status !== 'verified') // ensure we don't re-verify
            .map(t => t.id);

        if (verifyableTaskIds.length === 0) {
            Alert.alert(t('common.info'), t('monitoring.no_tasks_to_verify'));
            return;
        }

        setSelectedTaskIds(verifyableTaskIds);
        setConfirmationAction({ type: 'batch_verify', count: verifyableTaskIds.length });
    };

    const handleBatchVerify = () => {
        if (selectedTaskIds.length === 0) return;
        setConfirmationAction({ type: 'batch_verify' });
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

    // Timezone Aware Comparison
    const todayStr = getLocalDateString();
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
                                        setFilterDate(new Date());
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

                    {/* Action Button for Filter Results */}
                    {activeTasks.some(t => t.status !== 'verified') && (
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
                                    bg: 'bg-white',
                                    border: 'border-gray-200',
                                    text: 'text-gray-800',
                                    isUncategorized: false
                                })),
                                {
                                    id: 'uncategorized',
                                    title: '📂 General',
                                    bg: 'bg-gray-50',
                                    border: 'border-gray-200',
                                    text: 'text-gray-600',
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

                                return (
                                    <View key={section.id} className="mb-4">
                                        <TouchableOpacity
                                            onPress={() => setExpandedCategories(prev => ({ ...prev, [section.id]: !isExpanded }))}
                                            className={`flex-row justify-between items-center p-3 rounded-xl border ${section.bg} ${section.border} mb-2 shadow-sm bg-white`}
                                        >
                                            <View className="flex-row items-center gap-2 flex-1 mr-2">
                                                <Text className={`font-bold ${section.text} text-lg mr-2`}>{section.title}</Text>
                                                {(() => {
                                                    const pending = sectionTasks.filter(t => t.status === 'pending').length;
                                                    const completed = sectionTasks.filter(t => t.status === 'completed').length;
                                                    const verified = sectionTasks.filter(t => t.status === 'verified').length;
                                                    const total = sectionTasks.length;

                                                    return (
                                                        <View className="flex-col gap-0 items-start ml-auto">
                                                            {pending === 0 && total > 0 ? (
                                                                <Text className="text-green-600 font-bold">{t('status.completed_msg')}</Text>
                                                            ) : (
                                                                <>
                                                                    <Text className="text-[10px] text-red-500 font-bold">{String(pending)} {t('status.pending')}</Text>
                                                                    <Text className="text-[10px] text-orange-500 font-bold">{String(completed)} {t('status.in_review')}</Text>
                                                                    <Text className="text-[10px] text-green-600 font-bold">{String(verified)} {t('status.verified')}</Text>
                                                                </>
                                                            )}
                                                        </View>
                                                    );
                                                })()}
                                            </View>
                                            <Text className="text-gray-400">{isExpanded ? '▼' : '▶'}</Text>
                                        </TouchableOpacity>

                                        {isExpanded && (
                                            <View className="gap-0">
                                                {sectionTasks.map(item => {
                                                    const isSelected = selectedTaskIds.includes(item.id);
                                                    const canSelect = item.status !== 'verified';
                                                    return (
                                                        <Pressable
                                                            key={item.id}
                                                            onPress={() => canSelect && handleToggleSelection(item)}
                                                            disabled={!canSelect}
                                                            style={({ pressed }) => ({
                                                                opacity: pressed && canSelect ? 0.8 : 1,
                                                            })}
                                                        >
                                                            <View
                                                                className={`mb-4 rounded-xl border-4 overflow-hidden relative ${isSelected ? 'border-green-500 bg-green-50' : 'border-transparent'}`}
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
                                                                    onPress={canSelect ? () => handleToggleSelection(item) : undefined}
                                                                />
                                                            </View>
                                                        </Pressable>
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
            </ScrollView >

            {
                selectedTaskIds.length > 0 && (
                    <View className="absolute bottom-6 left-6 right-6 z-50">
                        <Button
                            title={t('monitoring.btn_verify_count').replace('{count}', String(selectedTaskIds.length))}
                            onPress={handleBatchVerify}
                            className="shadow-xl bg-green-600 h-14"
                            textClassName="text-lg font-bold"
                        />
                    </View>
                )
            }

            {/* Generic Confirmation Modal with Loading State */}
            <Modal
                visible={!!confirmationAction}
                transparent={true}
                animationType="fade"
                onRequestClose={() => !isProcessing && setConfirmationAction(null)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center p-6">
                    <View className="bg-white p-6 rounded-2xl w-full max-w-sm">
                        {/* Show Loading State */}
                        {isProcessing ? (
                            <View className="items-center py-4">
                                <ActivityIndicator size="large" color="#22c55e" />
                                <Text className="text-lg font-bold text-gray-700 mt-4 text-center">
                                    Verificando tareas...
                                </Text>
                                <Text className="text-2xl font-bold text-green-600 mt-2">
                                    {processingProgress.current} / {processingProgress.total}
                                </Text>
                                <Text className="text-gray-400 text-sm mt-2">
                                    Por favor espera...
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Text className="text-xl font-bold mb-4 text-center">
                                    {confirmationAction?.type === 'batch_verify'
                                        ? t('monitoring.batch_verify')
                                        : confirmationAction ? t(`monitoring.confirm_${confirmationAction.type}`) : ''}
                                </Text>
                                <Text className="text-gray-600 text-center mb-6">
                                    {confirmationAction?.type === 'batch_verify'
                                        ? `${t('monitoring.batch_verify_confirm')} ${confirmationAction.count || selectedTaskIds.length} ${t('monitoring.selected_tasks')}?`
                                        : confirmationAction ? t(`monitoring.confirm_${confirmationAction.type}_msg`) : ''}
                                </Text>
                                <View className="flex-col gap-3">
                                    <Button
                                        title={confirmationAction?.type === 'batch_verify'
                                            ? t('monitoring.verify_all')
                                            : confirmationAction ? t(`monitoring.yes_${confirmationAction.type}`) : ''}
                                        onPress={async () => {
                                            if (confirmationAction) {
                                                // Single task operations
                                                if (confirmationAction.type === 'verify' && confirmationAction.taskId) {
                                                    await verifyTask(confirmationAction.taskId);
                                                    setConfirmationAction(null);
                                                    return;
                                                }
                                                if (confirmationAction.type === 'reject' && confirmationAction.taskId) {
                                                    await rejectTask(confirmationAction.taskId);
                                                    setConfirmationAction(null);
                                                    return;
                                                }
                                                if (confirmationAction.type === 'delete' && confirmationAction.taskId) {
                                                    await deleteTask(confirmationAction.taskId);
                                                    setConfirmationAction(null);
                                                    return;
                                                }

                                                // Batch verify - with loading state
                                                if (confirmationAction.type === 'batch_verify') {
                                                    const taskIdsToVerify = [...selectedTaskIds];
                                                    const total = taskIdsToVerify.length;

                                                    if (total === 0) {
                                                        setConfirmationAction(null);
                                                        return;
                                                    }

                                                    // Start processing
                                                    setIsProcessing(true);
                                                    setProcessingProgress({ current: 0, total });

                                                    try {
                                                        // Process tasks one by one with progress updates
                                                        for (let i = 0; i < taskIdsToVerify.length; i++) {
                                                            const id = taskIdsToVerify[i];
                                                            await verifyTask(id);
                                                            // Update progress after each verification
                                                            setProcessingProgress({ current: i + 1, total });
                                                        }

                                                        // All done - clear selection
                                                        setSelectedTaskIds([]);

                                                        // Small delay to show completion
                                                        await new Promise(resolve => setTimeout(resolve, 500));

                                                    } catch (error) {
                                                        console.error('Error during batch verify:', error);
                                                        Alert.alert('Error', 'Hubo un error al verificar algunas tareas.');
                                                    } finally {
                                                        // End processing
                                                        setIsProcessing(false);
                                                        setProcessingProgress({ current: 0, total: 0 });
                                                        setConfirmationAction(null);
                                                    }
                                                }
                                            }
                                        }}
                                        className={confirmationAction?.type === 'verify' || confirmationAction?.type === 'batch_verify' ? "bg-green-600" : "bg-rose-600"}
                                    />
                                    <Button
                                        title={t('common.cancel')}
                                        variant="outline"
                                        onPress={() => setConfirmationAction(null)}
                                    />
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View >
    );
};
