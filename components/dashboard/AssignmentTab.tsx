import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';
import { AdvancedFilterControls } from '../ui/AdvancedFilterControls';
import { DatePicker } from '../ui/DatePicker';
import { ParentTaskCard } from '../ParentTaskCard';
import { Task } from '../../types';

export const AssignmentTab = () => {
    const navigation = useNavigation<any>();
    const { users, tasks, schedules, currentUser, categories, addTask, deleteTask, addSchedule, t } = useTaskContext();

    const children = users.filter(u => u.role === 'child');

    // State for assignment mode
    const [isAssigningMode, setIsAssigningMode] = useState(false);
    const [assignmentSelection, setAssignmentSelection] = useState<string[]>([]);
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

    // State for Overrides
    const [assignRecurrenceDays, setAssignRecurrenceDays] = useState<number[]>([]);
    const [assignDueDate, setAssignDueDate] = useState<string>('');

    // Filters
    const [assignmentSearch, setAssignmentSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'responsibility' | 'extra' | 'school'>('all');
    const [frequencyFilter, setFrequencyFilter] = useState<'all' | 'daily' | 'weekly' | 'one-time'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    // Confirmation Modal
    const [confirmationAction, setConfirmationAction] = useState<{ type: 'delete', taskId: string } | null>(null);

    const poolTasks = tasks.filter(t => t.assignedTo === 'pool');

    // Derived state
    const displayTasks = poolTasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
            (t.description?.toLowerCase() || '').includes(assignmentSearch.toLowerCase());

        let matchesType = true;
        if (typeFilter === 'responsibility') matchesType = t.type === 'obligatory';
        else if (typeFilter === 'extra') matchesType = t.type === 'additional';
        else if (typeFilter === 'school') matchesType = t.isSchool || false;

        let matchesFrequency = true;
        if (frequencyFilter !== 'all') matchesFrequency = t.frequency === frequencyFilter;

        return matchesSearch && matchesType && matchesFrequency;
    }).sort((a, b) => a.title.localeCompare(b.title));

    const handleToggleSelection = (task: Task) => {
        if (selectedTemplateIds.includes(task.id)) {
            setSelectedTemplateIds(prev => prev.filter(id => id !== task.id));
            if (selectedTemplateIds.length === 1) {
                // Reset overrides if untoggling the last one
                setAssignRecurrenceDays([]);
                setAssignDueDate('');
            }
            return;
        }

        // Logic for Weekly Tasks (Must be single selection)
        if (task.frequency === 'weekly') {
            if (selectedTemplateIds.length > 0) {
                if (Platform.OS === 'web') window.alert(t('assign.alert.weekly_restrict_1'));
                else Alert.alert(t('common.restriction'), t('assign.alert.weekly_restrict_1'));
                return;
            }
        }

        // Logic restricts adding if a weekly task is ALREADY selected
        const hasWeeklySelected = selectedTemplateIds.some(id => tasks.find(t => t.id === id)?.frequency === 'weekly');
        if (hasWeeklySelected) {
            if (Platform.OS === 'web') window.alert(t('assign.alert.weekly_restrict_2'));
            else Alert.alert(t('common.restriction'), t('assign.alert.weekly_restrict_2'));
            return;
        }

        if (selectedTemplateIds.length === 0) {
            // First selection, initialize potential overrides defaults from this task
            setAssignRecurrenceDays(task.recurrenceDays || []);
            setAssignDueDate(task.dueDate || '');

            // Auto-select first child if none selected
            if (assignmentSelection.length === 0 && children.length > 0) {
                setAssignmentSelection([children[0].id]);
            }
        }

        setSelectedTemplateIds(prev => [...prev, task.id]);
    };

    const handleBatchAssign = () => {
        if (selectedTemplateIds.length === 0 || assignmentSelection.length === 0) return;

        const assignLogic = () => {
            let totalAssigned = 0;
            let totalSkipped = 0;

            selectedTemplateIds.forEach(templateId => {
                const template = tasks.find(t => t.id === templateId);
                if (!template) return;

                assignmentSelection.forEach(childId => {
                    const isRecurring = template.frequency === 'daily' || template.frequency === 'weekly';

                    // Check duplicate
                    // If recurring, check Schedules. If one-time, check Tasks.
                    let isDuplicate = false;

                    if (isRecurring) {
                        // Check in schedules
                        isDuplicate = schedules.some(s =>
                            s.assignedTo === childId &&
                            s.title === template.title &&
                            s.active // Check active schedules only
                        );
                    } else {
                        // Check in tasks (pending)
                        isDuplicate = tasks.some(t =>
                            t.assignedTo === childId &&
                            t.title === template.title &&
                            t.status !== 'verified' && t.status !== 'completed' && t.status !== 'expired'
                        );
                    }

                    if (isDuplicate) {
                        totalSkipped++;
                        return;
                    }

                    // Common Data
                    const commonData: any = {
                        title: template.title,
                        description: template.description,
                        assignedTo: childId,
                        createdBy: currentUser?.id || '',
                        type: template.type,
                        frequency: template.frequency,
                        isResponsibility: template.isResponsibility,
                        isSchool: template.isSchool,
                        shift: template.shift,
                        categoryId: template.categoryId,
                    };

                    if (template.points) commonData.points = template.points;
                    if (template.timeWindow) commonData.timeWindow = template.timeWindow;
                    if (template.dueTime) commonData.dueTime = template.dueTime; // This might be schedule property or task

                    if (isRecurring) {
                        // Create SCHEDULE
                        const newSchedule: any = {
                            ...commonData,
                            templateId: template.id,
                            active: true
                        };

                        // Apply Recurrence Overrides
                        if (template.frequency === 'weekly') {
                            newSchedule.recurrenceDays = assignRecurrenceDays;
                        } else if (assignRecurrenceDays && assignRecurrenceDays.length > 0) {
                            newSchedule.recurrenceDays = assignRecurrenceDays;
                        }

                        addSchedule(newSchedule);
                    } else {
                        // Create One-Time TASK
                        const newTask: any = {
                            ...commonData,
                            status: 'pending',
                            templateId: template.id,
                            dueDate: assignDueDate || new Date().toISOString().split('T')[0], // Default today if missing
                        };
                        // one-time typically doesn't have recurrenceDays
                        addTask(newTask);
                    }

                    totalAssigned++;
                });
            });

            setSelectedTemplateIds([]);
            setIsAssigningMode(false);
            setAssignmentSelection([]);

            let message = "";
            if (totalAssigned > 0) message += t('assign.alert.assign_summary_1').replace('{count}', String(totalAssigned));
            if (totalSkipped > 0) message += t('assign.alert.assign_summary_2').replace('{skipped}', String(totalSkipped));

            if (Platform.OS === 'web') window.alert(message);
            else Alert.alert(t('assign.alert.assign_success'), message);
        };

        // Execute the assignment logic
        assignLogic();
    };


    const confirmDeleteTemplate = (taskId: string) => {
        setConfirmationAction({ type: 'delete', taskId });
    };

    const representativeTask = selectedTemplateIds.length > 0
        ? tasks.find(t => t.id === selectedTemplateIds[0])
        : null;

    return (
        <View className="flex-1 relative bg-brand-cream dark:bg-brand-dark">
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <View className="mb-4 flex-row justify-between items-center">
                    <Text className="text-lg font-bold text-gray-700 dark:text-gray-200">{t('assignment.templates_title')}</Text>
                    <Button
                        title={t('assign.create_template')}
                        size="sm"
                        onPress={() => navigation.navigate('CreateTask')}
                    />
                </View>

                <View className="mb-2">
                    <AdvancedFilterControls
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        searchText={assignmentSearch}
                        setSearchText={setAssignmentSearch}
                        searchPlaceholder={t('assign.search_placeholder')}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                        frequencyFilter={frequencyFilter}
                        setFrequencyFilter={setFrequencyFilter}
                    />
                </View>

                <Text className="text-xs text-gray-400 mb-2 italic">
                    {t('assign.tip_select')}
                </Text>

                {displayTasks.length === 0 ? (
                    <Text className="text-gray-400 text-center py-8">{t('assign.no_templates')}</Text>
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
                            title: `📂 ${t('common.general')}`,
                            bg: 'bg-gray-50',
                            border: 'border-gray-200',
                            text: 'text-gray-600'
                        });

                        return categorySections.map(section => {
                            const sectionTasks = displayTasks.filter(t =>
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
                                        <View className="flex-row items-center gap-2">
                                            <Text className={`font-bold ${section.text} text-lg`}>{section.title}</Text>
                                            <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                                                <Text className="text-xs font-bold text-gray-500">{sectionTasks.length}</Text>
                                            </View>
                                        </View>
                                        <Text className="text-gray-400">{isExpanded ? '▼' : '▶'}</Text>
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View className="gap-0">
                                            {sectionTasks.map(item => {
                                                const isSelected = selectedTemplateIds.includes(item.id);
                                                return (
                                                    <View
                                                        key={item.id}
                                                        className={`mb-4 rounded-xl border-4 overflow-hidden relative ${isSelected ? 'border-indigo-500 bg-indigo-50 transform scale-[1.02]' : 'border-transparent bg-white'}`}
                                                    >
                                                        {isSelected && (
                                                            <View className="absolute top-2 right-2 z-10 bg-indigo-600 rounded-full w-6 h-6 items-center justify-center">
                                                                <Text className="text-white font-bold">✓</Text>
                                                            </View>
                                                        )}
                                                        <View>
                                                            <ParentTaskCard
                                                                task={item}
                                                                users={users}
                                                                showAssignAction={false}
                                                                onVerify={() => { }}
                                                                onReject={() => { }}
                                                                onAssign={() => { }}
                                                                onEdit={(task) => navigation.navigate('CreateTask', { taskToEdit: task })}
                                                                onDelete={confirmDeleteTemplate}
                                                                onPress={() => handleToggleSelection(item)}
                                                            />
                                                        </View>
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
            </ScrollView>

            {/* Floating Action Button */}
            {selectedTemplateIds.length > 0 && (
                <View className="absolute bottom-6 left-6 right-6 z-50">
                    <Button
                        title={t('assign.btn_assign_count').replace('{count}', String(selectedTemplateIds.length))}
                        onPress={() => setIsAssigningMode(true)}
                        className="shadow-xl bg-indigo-600 h-14"
                        textClassName="text-lg font-bold"
                    />
                </View>
            )}

            {/* Modal for Batch Assignment */}
            {isAssigningMode && representativeTask && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View className="flex-1 bg-black/50 z-50 justify-center items-center p-6">
                        <View className="bg-white p-6 rounded-2xl w-full max-w-sm">
                            <Text className="text-xl font-bold mb-4">
                                {t('assign.modal_title').replace('{count}', String(selectedTemplateIds.length))}
                            </Text>

                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {children.map(child => {
                                    const isSelected = assignmentSelection.includes(child.id);
                                    const userColor = child.color || '#4338ca';

                                    return (
                                        <TouchableOpacity
                                            key={child.id}
                                            onPress={() => {
                                                if (isSelected) {
                                                    setAssignmentSelection(prev => prev.filter(id => id !== child.id));
                                                } else {
                                                    setAssignmentSelection(prev => [...prev, child.id]);
                                                }
                                            }}
                                            style={isSelected ? { backgroundColor: userColor, borderColor: userColor } : { borderColor: '#e5e7eb' }}
                                            className={`px-4 py-2 rounded-full border ${isSelected ? '' : 'bg-gray-100'}`}
                                        >
                                            <Text className={isSelected ? 'text-white font-medium' : 'text-gray-700'}>
                                                {child.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Schedule Override */}
                            {(representativeTask.frequency === 'weekly' || representativeTask.frequency === 'one-time') && (
                                <View className="mb-6">
                                    <Text className="text-gray-700 font-bold mb-2">{t('assign.schedule_optional')}</Text>

                                    {(representativeTask.frequency === 'weekly') && (
                                        <View>
                                            <Text className="text-xs text-gray-500 mb-2">{t('assign.select_days')}</Text>
                                            <View className="flex-row justify-between">
                                                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => {
                                                    const isDaySelected = assignRecurrenceDays.includes(index);
                                                    return (
                                                        <TouchableOpacity
                                                            key={index}
                                                            onPress={() => {
                                                                if (isDaySelected) setAssignRecurrenceDays(prev => prev.filter(d => d !== index));
                                                                else setAssignRecurrenceDays(prev => [...prev, index]);
                                                            }}
                                                            className={`w-9 h-9 rounded-full justify-center items-center border ${isDaySelected
                                                                ? 'bg-indigo-600 border-indigo-600'
                                                                : 'bg-white border-gray-300'}`}
                                                        >
                                                            <Text className={`text-xs font-bold ${isDaySelected ? 'text-white' : 'text-gray-600'}`}>{day}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    )}

                                    {representativeTask.frequency === 'one-time' && (
                                        <DatePicker
                                            value={assignDueDate}
                                            onChange={setAssignDueDate}
                                            label={t('common.specific_date')}
                                        />
                                    )}
                                </View>
                            )}

                            <Text className="text-xs text-gray-400 mb-4 text-center">
                                {t('assign.apply_same_config')}
                            </Text>

                            <View className="gap-3">
                                <Button title={t('assign.confirm_assign')} onPress={handleBatchAssign} />
                                <Button title={t('common.cancel')} variant="outline" onPress={() => setIsAssigningMode(false)} />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

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
                            {confirmationAction?.type === 'assign'
                                ? t('assign.alert.assign_title')
                                : t('assign.alert.delete_template_title')}
                        </Text>
                        <Text className="text-gray-600 text-center mb-6">
                            {confirmationAction?.type === 'assign'
                                ? t('assign.alert.assign_msg').replace('{count}', String(selectedTemplateIds.length))
                                : t('assign.alert.delete_template_msg')}
                        </Text>
                        <View className="flex-col gap-3">
                            <Button
                                title={confirmationAction?.type === 'assign' ? t('assignment.assign_task') : t('common.delete')}
                                onPress={async () => {
                                    if (confirmationAction) {
                                        if (confirmationAction.type === 'assign') handleBatchAssign();
                                        if (confirmationAction.type === 'delete' && confirmationAction.taskId) await deleteTask(confirmationAction.taskId);
                                        setConfirmationAction(null);
                                    }
                                }}
                                className={confirmationAction?.type === 'assign' ? "bg-indigo-600" : "bg-red-600"}
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
        </View>
    );
};
