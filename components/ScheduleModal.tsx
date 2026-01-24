import React, { useState, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform, Alert, StatusBar } from 'react-native';
import * as Print from 'expo-print';
import { useTaskContext } from '../context/TaskContext';
import { Button } from './ui/Button';
import { Task } from '../types';
import { AdvancedFilterControls } from './ui/AdvancedFilterControls';

interface ScheduleModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ScheduleModal = ({ visible, onClose }: ScheduleModalProps) => {
    const { users, tasks, categories, updateTask, deleteTask, t } = useTaskContext();
    const children = users.filter((u: any) => u.role === 'child');
    const [selectedChildId, setSelectedChildId] = useState<string | null>(children.length > 0 ? children[0].id : null);

    // View Mode State: 'weekly' (default) or 'daily_compare'
    const [viewMode, setViewMode] = useState<'weekly' | 'daily_compare'>('weekly');
    const [selectedCompareDay, setSelectedCompareDay] = useState<number>(new Date().getDay());

    // Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [frequencyFilter, setFrequencyFilter] = useState('all');

    // State for managing selected task
    const [taskToManage, setTaskToManage] = useState<{ task: Task, day: number } | null>(null);

    const weekDays = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
    const daysLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']; // Fallback

    const getDayName = (dayIndex: number) => {
        // dayIndex: 0=Sun, 1=Mon...
        const map: string[] = [
            t('filter.date.sunday'),
            t('filter.date.monday') || 'Lun',
            t('filter.date.tuesday') || 'Mar',
            t('filter.date.wednesday') || 'Mié',
            t('filter.date.thursday') || 'Jue',
            t('filter.date.friday') || 'Vie',
            t('filter.date.saturday') || 'Sáb'
        ];
        return map[dayIndex] || daysLabels[dayIndex - 1];
    };

    // Helper to sort tasks: Category -> Title (Shift is implicit/secondary if we want)
    const sortTasks = (taskList: Task[]) => {
        return taskList.sort((a, b) => {
            // 1. Shift Rule (Still good to have time order)
            const shiftOrder: Record<string, number> = { 'morning': 1, 'afternoon': 2, 'night': 3, 'no-time': 4 };
            const sA = a.shift ? shiftOrder[a.shift] || 4 : 4;
            const sB = b.shift ? shiftOrder[b.shift] || 4 : 4;
            if (sA !== sB) return sA - sB;

            // 2. Category Order
            const catA = categories.find(c => c.id === a.categoryId);
            const catB = categories.find(c => c.id === b.categoryId);
            const orderA = catA?.order || 999;
            const orderB = catB?.order || 999;
            if (orderA !== orderB) return orderA - orderB;

            // 3. Alphabetical
            return a.title.localeCompare(b.title);
        });
    };

    // Helper to filter tasks based on current filters
    const filterTaskLogic = (task: Task, day: number) => {
        // Apply Filters
        if (searchText) {
            const lowText = searchText.toLowerCase();
            if (!task.title.toLowerCase().includes(lowText) &&
                !task.description?.toLowerCase().includes(lowText)) {
                return false;
            }
        }

        if (typeFilter !== 'all') {
            if (typeFilter === 'responsibility' && !task.isResponsibility) return false;
            if (typeFilter === 'extra' && (task.isResponsibility || task.type !== 'additional')) return false; // Rough mapping
            if (typeFilter === 'school' && !task.isSchool) return false;
        }

        if (frequencyFilter !== 'all') {
            if (frequencyFilter !== task.frequency) return false;
        }

        // Schedule Logic
        if (task.frequency === 'daily') return true;
        if (task.frequency === 'weekly') {
            if (task.recurrenceDays && task.recurrenceDays.includes(day)) return true;
            return false;
        }
        return false;
    };


    // DATA 1: Weekly Schedule for Selected Child
    const scheduleData = useMemo(() => {
        if (!selectedChildId) return {};
        const childTasks = tasks.filter(t => t.assignedTo === selectedChildId);

        const schedule: Record<number, Task[]> = {};

        weekDays.forEach(day => {
            const filtered = childTasks.filter(task => filterTaskLogic(task, day));
            schedule[day] = sortTasks(filtered);
        });

        return schedule;
    }, [selectedChildId, tasks, categories, searchText, typeFilter, frequencyFilter]);

    // DATA 2: Daily Comparison (All Children for Selected Day)
    const dailyCompareData = useMemo(() => {
        const compareData: Record<string, Task[]> = {}; // Key: ChildID, Value: Tasks

        children.forEach((child: any) => {
            const childTasks = tasks.filter(t => t.assignedTo === child.id);
            const filtered = childTasks.filter(task => filterTaskLogic(task, selectedCompareDay));
            compareData[child.id] = sortTasks(filtered);
        });

        return compareData;
    }, [selectedCompareDay, tasks, categories, searchText, typeFilter, frequencyFilter, children]);


    const totalWeeklyTasks = useMemo(() => {
        if (viewMode === 'weekly') {
            return Object.values(scheduleData).reduce((acc, list) => acc + list.length, 0);
        } else {
            return Object.values(dailyCompareData).reduce((acc, list) => acc + list.length, 0);
        }

    }, [scheduleData, dailyCompareData, viewMode]);

    const handleTaskPress = (task: Task, day: number) => {
        setTaskToManage({ task, day });
    };

    const handleDeleteTask = async () => {
        if (!taskToManage) return;
        const { task, day } = taskToManage;

        if (task.frequency === 'weekly' && task.recurrenceDays && task.recurrenceDays.includes(day)) {
            // Ask if delete for this day or entirely
            Alert.alert(
                t('common.delete'),
                t('task.delete_confirm'),
                [
                    {
                        text: t('schedule.delete_day_option'),
                        onPress: async () => {
                            const newRecurrence = task.recurrenceDays?.filter(d => d !== day) || [];
                            if (newRecurrence.length === 0) {
                                // If no days left, maybe delete entirely?
                                deleteTask(task.id);
                            } else {
                                updateTask(task.id, { recurrenceDays: newRecurrence });
                            }
                            setTaskToManage(null);
                        }
                    },
                    {
                        text: "Toda la tarea",
                        onPress: async () => {
                            deleteTask(task.id);
                            setTaskToManage(null);
                        },
                        style: 'destructive'
                    },
                    { text: t('common.cancel'), style: "cancel" }
                ]
            );
        } else {
            // Daily, One-time, or no recurrence logic -> Just delete
            Alert.alert(
                t('common.delete'),
                t('task.delete_confirm'),
                [
                    {
                        text: t('common.delete'),
                        onPress: async () => {
                            deleteTask(task.id);
                            setTaskToManage(null);
                        },
                        style: 'destructive'
                    },
                    { text: t('common.cancel'), style: "cancel" }
                ]
            );
        }
    };

    const handlePrint = async () => {
        // Simplified print for now (usually prints selected child schedule)
        if (!selectedChildId && viewMode === 'weekly') return;

        if (viewMode === 'weekly') {
            // Normal print logic
            const child = children.find((c: any) => c.id === selectedChildId);
            const html = `
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                  <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                    h1 { text-align: center; color: #4338ca; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 6px; vertical-align: top; }
                    th { background-color: #e0e7ff; color: #3730a3; }
                    .task { background-color: #f3f4f6; padding: 5px; margin-bottom: 5px; border-radius: 4px; font-size: 11px; border-left: 3px solid #6366f1; page-break-inside: avoid; }
                    .task-title { font-weight: bold; display: block; margin-bottom: 2px; }
                    .tag { display: inline-block; padding: 1px 3px; border-radius: 3px; font-size: 9px; margin-right: 3px; margin-bottom: 1px; }
                    .morning { background-color: #fef3c7; color: #92400e; }
                    .afternoon { background-color: #ffedd5; color: #9a3412; }
                    .night { background-color: #e0e7ff; color: #3730a3; }
                    .school { background-color: #e0f2fe; color: #0369a1; }
                    .bonus { background-color: #fce7f3; color: #be185d; }
                    .extra { background-color: #dcfce7; color: #15803d; }
                  </style>
                </head>
                <body>
                  <h1>${t('schedule.title')} - ${child?.name}</h1>
                  <table>
                    <thead>
                      <tr>
                        ${weekDays.map(d => `<th>${getDayName(d)}</th>`).join('')}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        ${weekDays.map(day => `
                          <td>
                            ${(scheduleData[day] || []).map(task => {
                let tags = '';

                // Shift
                if (task.shift && task.shift !== 'no-time') {
                    const shiftMap: any = { morning: t('shift.morning'), afternoon: t('shift.afternoon'), night: t('shift.night') };
                    let shiftClass = task.shift;
                    if (!['morning', 'afternoon', 'night'].includes(shiftClass)) shiftClass = 'morning';
                    tags += `<span class="tag ${shiftClass}">${shiftMap[task.shift] || task.shift}</span>`;
                }

                // Chips
                if (task.isSchool) tags += `<span class="tag school">${t('tags.school')}</span>`;
                if (task.type === 'additional') tags += `<span class="tag extra">${t('tags.extra')}</span>`;
                if (task.isResponsibility) tags += `<span class="tag bonus">${t('tags.bonus')}</span>`;

                return `
                              <div class="task">
                                <span class="task-title">${task.title}</span>
                                <div style="margin-top:2px;">${tags}</div>
                                ${(task.points || 0) > 0 ? `<div style="font-size:10px; color:#666; margin-top:2px;">💎 ${task.points} pts</div>` : ''}
                              </div>
                            `;
            }).join('')}
                          </td>
                        `).join('')}
                      </tr>
                    </tbody>
                  </table>
                </body>
              </html>
            `;

            try {
                await Print.printAsync({ html });
            } catch (e) {
                console.error("Print Error:", e);
                Alert.alert(t('common.error'), t('schedule.print_error'));
            }
        } else {
            // To be implemented or just alert
            Alert.alert("Info", "La impresión en modo comparación aún no está disponible (usa la vista semanal).");
            return;
        }
    };

    const renderTaskCard = (task: Task, day: number) => {
        const category = categories.find(c => c.id === task.categoryId);
        return (
            <TouchableOpacity
                key={task.id}
                onPress={() => handleTaskPress(task, day)}
                className="bg-white dark:bg-slate-700 p-2 rounded-lg mb-2 shadow-sm border-l-4 active:opacity-70"
                style={{ borderLeftColor: category?.color || '#6366f1' }}
            >
                <View className="flex-row justify-between mb-1">
                    {category && (
                        <View className="flex-row items-center bg-gray-100 rounded px-1 mb-1 self-start">
                            <Text className="text-[10px] mr-1">{category.icon}</Text>
                            <Text className="text-[9px] font-bold text-gray-600 uppercase">{category.name}</Text>
                        </View>
                    )}
                </View>

                <Text className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight mb-1" numberOfLines={2}>
                    {task.title}
                </Text>

                <View className="flex-row flex-wrap gap-1">
                    {task.shift && task.shift !== 'no-time' && (
                        <Text className={`text-[9px] px-1 rounded font-bold capitalize ${task.shift === 'morning' ? 'bg-amber-100 text-amber-800' :
                            task.shift === 'afternoon' ? 'bg-orange-100 text-orange-800' :
                                'bg-indigo-100 text-indigo-800'
                            }`}>
                            {task.shift === 'morning' ? '🌅' : task.shift === 'afternoon' ? '☀️' : '🌙'}
                        </Text>
                    )}
                    {task.isSchool && <Text className="text-[9px] bg-sky-100 text-sky-800 px-1 rounded">🎓</Text>}
                    {task.isResponsibility ? (
                        <Text className="text-[9px] bg-rose-100 text-rose-800 px-1 rounded">🎁</Text>
                    ) : task.type === 'additional' ? (
                        <Text className="text-[9px] bg-green-100 text-green-800 px-1 rounded">💵</Text>
                    ) : null}
                    {task.timeLimit && (
                        <Text className="text-[9px] bg-gray-100 text-gray-600 px-1 rounded">⏳ {task.timeLimit}m</Text>
                    )}
                    {task.frequency === 'weekly' && (
                        <Text className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded font-bold">SEM</Text>
                    )}
                    {task.frequency === 'one-time' && (
                        <Text className="text-[9px] bg-purple-50 text-purple-600 px-1 rounded font-bold">1x</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View className="flex-1 bg-white dark:bg-slate-900" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                <View className="p-4 border-b border-gray-100 dark:border-gray-800 flex-row justify-between items-center bg-gray-50 dark:bg-slate-800">
                    <Text className="text-xl font-bold text-gray-800 dark:text-white">{t('schedule.title')}</Text>
                    <View className="flex-row gap-2">
                        {/* View Mode Toggle */}
                        <View className="flex-row bg-gray-100 rounded-lg p-1 mr-2">
                            <TouchableOpacity
                                onPress={() => setViewMode('weekly')}
                                className={`px-3 py-1 rounded ${viewMode === 'weekly' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <Text className={`text-xs font-bold ${viewMode === 'weekly' ? 'text-indigo-600' : 'text-gray-500'}`}>{t('schedule.view_week')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setViewMode('daily_compare')}
                                className={`px-3 py-1 rounded ${viewMode === 'daily_compare' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <Text className={`text-xs font-bold ${viewMode === 'daily_compare' ? 'text-indigo-600' : 'text-gray-500'}`}>{t('schedule.view_day')}</Text>
                            </TouchableOpacity>
                        </View>
                        <Button title={t('common.close')} onPress={onClose} variant="outline" size="sm" />
                    </View>
                </View>

                <View className="p-4 flex-1">
                    {/* Top Controls Area */}
                    <View className="mb-4">
                        {viewMode === 'weekly' ? (
                            <>
                                <Text className="text-xs text-gray-500 font-bold uppercase mb-2">{t('schedule.select_child')}</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                                    {children.map((child: any) => (
                                        <TouchableOpacity
                                            key={child.id}
                                            onPress={() => setSelectedChildId(child.id)}
                                            className={`px-4 py-2 rounded-full mr-2 border ${selectedChildId === child.id
                                                ? 'bg-indigo-600 border-indigo-600'
                                                : 'bg-white border-gray-300'}`}
                                        >
                                            <Text className={selectedChildId === child.id ? 'text-white font-bold' : 'text-gray-700'}>
                                                {child.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            <>
                                <Text className="text-xs text-gray-500 font-bold uppercase mb-2">Selecciona un día para comparar:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                                    {weekDays.map((day: any) => (
                                        <TouchableOpacity
                                            key={day}
                                            onPress={() => setSelectedCompareDay(day)}
                                            className={`px-4 py-2 rounded-full mr-2 border ${selectedCompareDay === day
                                                ? 'bg-indigo-600 border-indigo-600'
                                                : 'bg-white border-gray-300'}`}
                                        >
                                            <Text className={selectedCompareDay === day ? 'text-white font-bold' : 'text-gray-700'}>
                                                {getDayName(day)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </>
                        )}

                        <Text className="text-xs text-indigo-600 font-bold text-right mt-1">
                            {viewMode === 'weekly' ? 'Total Semanal: ' : 'Total Día: '} {totalWeeklyTasks} tareas
                        </Text>
                    </View>

                    {/* Filters */}
                    <View className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 mb-4">
                        <AdvancedFilterControls
                            showFilters={showFilters}
                            setShowFilters={setShowFilters}
                            searchText={searchText}
                            setSearchText={setSearchText}
                            typeFilter={typeFilter}
                            setTypeFilter={setTypeFilter}
                            frequencyFilter={frequencyFilter}
                            setFrequencyFilter={setFrequencyFilter}
                        />
                    </View>

                    {/* Schedule Content */}
                    <View className="flex-1 mb-[80px]">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                            <View className="flex-row gap-3">
                                {viewMode === 'weekly' && weekDays.map(day => {
                                    // View: WEEKLY (Columns = Days)
                                    const tasksForDay = scheduleData[day] || [];
                                    const dayCount = tasksForDay.length;
                                    return (
                                        <View key={day} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-2 h-full w-60">
                                            <View className="flex-row justify-center items-center mb-3">
                                                <Text className="font-bold text-gray-500 uppercase text-xs tracking-wider mr-2">
                                                    {getDayName(day).substring(0, 3)}
                                                </Text>
                                                <View className="bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-full">
                                                    <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                                        {dayCount}
                                                    </Text>
                                                </View>
                                            </View>
                                            <ScrollView showsVerticalScrollIndicator={false}>
                                                {tasksForDay.map(task => renderTaskCard(task, day))}
                                                {tasksForDay.length === 0 && (
                                                    <View className="flex-1 justify-center items-center opacity-30 mt-10">
                                                        <Text className="text-2xl">💤</Text>
                                                    </View>
                                                )}
                                            </ScrollView>
                                        </View>
                                    );
                                })}

                                {viewMode === 'daily_compare' && children.map((child: any) => {
                                    // View: DAILY COMPARE (Columns = Children)
                                    const tasksForChild = dailyCompareData[child.id] || [];
                                    const count = tasksForChild.length;
                                    return (
                                        <View key={child.id} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-2 h-full w-60">
                                            <View className="flex-row justify-center items-center mb-3">
                                                <Text className="font-bold text-gray-500 uppercase text-xs tracking-wider mr-2">
                                                    {child.name}
                                                </Text>
                                                <View className="bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-full">
                                                    <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                                        {count}
                                                    </Text>
                                                </View>
                                            </View>
                                            <ScrollView showsVerticalScrollIndicator={false}>
                                                {tasksForChild.map(task => renderTaskCard(task, selectedCompareDay))}
                                                {tasksForChild.length === 0 && (
                                                    <View className="flex-1 justify-center items-center opacity-30 mt-10">
                                                        <Text className="text-2xl">💤</Text>
                                                    </View>
                                                )}
                                            </ScrollView>
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                </View>

                {/* Footer Action */}
                <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
                    <Button
                        title="🖨️ Imprimir / Guardar PDF"
                        onPress={handlePrint}
                        className="bg-indigo-600 w-full"
                    />
                </View>

                {/* Management Modal */}
                {taskToManage && (
                    <Modal transparent visible={!!taskToManage} animationType="fade">
                        <View className="flex-1 bg-black/50 justify-center items-center p-6">
                            <View className="bg-white p-6 rounded-2xl w-full max-w-xs">
                                <Text className="text-lg font-bold mb-2 text-center">{taskToManage.task.title}</Text>
                                <Text className="text-gray-500 text-center mb-6 text-sm">¿Qué deseas hacer?</Text>

                                <View className="gap-3">
                                    <Button
                                        title="Eliminar / Desasignar"
                                        onPress={handleDeleteTask}
                                        className="bg-red-600"
                                    />
                                    <Button
                                        title="Cancelar"
                                        variant="outline"
                                        onPress={() => setTaskToManage(null)}
                                    />
                                </View>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        </Modal >
    );
};
