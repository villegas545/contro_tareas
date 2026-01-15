
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert, Modal } from 'react-native';
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
    const [confirmationAction, setConfirmationAction] = useState<{ type: 'verify' | 'reject' | 'delete' | 'batch_verify', taskId?: string } | null>(null);

    // Helper to format date for DatePicker "YYYY-MM-DD"
    const toDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const activeTasks = (selectedChildId
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

    const handleToggleSelection = (task: Task) => {
        if (task.status === 'verified') return;

        if (selectedTaskIds.includes(task.id)) {
            setSelectedTaskIds(prev => prev.filter(id => id !== task.id));
        } else {
            setSelectedTaskIds(prev => [...prev, task.id]);
        }
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

    const renderTask = ({ item }: { item: Task }) => (
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
        />
    );

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

                    {activeTasks.length === 0 ? (
                        <Text className="text-gray-400 text-center py-8">{t('monitoring.no_active_tasks')}</Text>
                    ) : (
                        (() => {
                            const categorySections = categories.map(cat => ({
                                id: cat.id,
                                title: `${cat.icon} ${cat.name}`,
                                bg: 'bg-white',
                                border: 'border-gray-200',
                                text: 'text-gray-800'
                            }));

                            categorySections.push({
                                id: 'uncategorized',
                                title: '📂 General',
                                bg: 'bg-gray-50',
                                border: 'border-gray-200',
                                text: 'text-gray-600'
                            });

                            return categorySections.map(section => {
                                const sectionTasks = activeTasks.filter(t =>
                                    section.id === 'uncategorized'
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
                                                    const Wrapper = ({ children }: { children: React.ReactNode }) => (
                                                        <View className={`mb-4 rounded-xl border-4 overflow-hidden relative ${isSelected ? 'border-green-500 bg-green-50 transform scale-[1.02]' : 'border-transparent'}`}>
                                                            {isSelected && (
                                                                <View className="absolute top-2 right-2 z-10 bg-green-600 rounded-full w-6 h-6 items-center justify-center">
                                                                    <Text className="text-white font-bold">✓</Text>
                                                                </View>
                                                            )}
                                                            {children}
                                                        </View>
                                                    );

                                                    return (
                                                        <Wrapper key={item.id}>
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
                                                                onPress={() => item.status !== 'verified' && handleToggleSelection(item)}
                                                            />
                                                        </Wrapper>
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

            {/* Generic Confirmation Modal */}
            <Modal
                visible={!!confirmationAction}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setConfirmationAction(null)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center p-6">
                    <View className="bg-white p-6 rounded-2xl w-full max-w-sm">
                        <Text className="text-xl font-bold mb-4 text-center">
                            {confirmationAction?.type === 'batch_verify'
                                ? t('monitoring.batch_verify')
                                : confirmationAction ? t(`monitoring.confirm_${confirmationAction.type}`) : ''}
                        </Text>
                        <Text className="text-gray-600 text-center mb-6">
                            {confirmationAction?.type === 'batch_verify'
                                ? `${t('monitoring.batch_verify_confirm')} ${selectedTaskIds.length} ${t('monitoring.selected_tasks')}?`
                                : confirmationAction ? t(`monitoring.confirm_${confirmationAction.type}_msg`) : ''}
                        </Text>
                        <View className="flex-col gap-3">
                            <Button
                                title={confirmationAction?.type === 'batch_verify'
                                    ? t('monitoring.verify_all')
                                    : confirmationAction ? t(`monitoring.yes_${confirmationAction.type}`) : ''}
                                onPress={async () => {
                                    if (confirmationAction) {
                                        if (confirmationAction.type === 'verify' && confirmationAction.taskId) verifyTask(confirmationAction.taskId);
                                        if (confirmationAction.type === 'reject' && confirmationAction.taskId) rejectTask(confirmationAction.taskId);
                                        if (confirmationAction.type === 'delete' && confirmationAction.taskId) deleteTask(confirmationAction.taskId);

                                        if (confirmationAction.type === 'batch_verify') {
                                            for (const id of selectedTaskIds) {
                                                await verifyTask(id);
                                            }
                                            setSelectedTaskIds([]);
                                        }
                                        setConfirmationAction(null);
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
                    </View>
                </View>
            </Modal>
        </View >
    );
};
