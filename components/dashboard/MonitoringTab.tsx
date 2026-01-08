
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { ParentTaskCard } from '../ParentTaskCard';
import { Task } from '../../types';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';

import { AdvancedFilterControls } from '../ui/AdvancedFilterControls';

export const MonitoringTab = () => {
    const navigation = useNavigation<any>();
    const { tasks, users, categories, verifyTask, rejectTask, deleteTask, isTaskActiveToday, getLocalDateString } = useTaskContext();
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

        const verifyLogic = () => {
            selectedTaskIds.forEach(id => verifyTask(id));
            setSelectedTaskIds([]);
            if (Platform.OS === 'web') window.alert(`${selectedTaskIds.length} tareas verificadas.`);
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`¿Verificar ${selectedTaskIds.length} tareas seleccionadas?`)) verifyLogic();
        } else {
            Alert.alert(
                "Verificación Masiva",
                `¿Marcar ${selectedTaskIds.length} tareas como verificadas?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Verificar Todas", onPress: verifyLogic }
                ]
            );
        }
    };

    const confirmVerify = (taskId: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de que esta tarea se completó correctamente?")) verifyTask(taskId);
        } else {
            Alert.alert(
                "Confirmar Verificación",
                "¿Estás seguro de que esta tarea se completó correctamente?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Sí, Verificar", onPress: () => verifyTask(taskId) }
                ]
            );
        }
    };

    const confirmReject = (taskId: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de rechazar esta tarea? Volverá a estar pendiente.")) rejectTask(taskId);
        } else {
            Alert.alert(
                "Confirmar Rechazo",
                "¿Estás seguro de rechazar esta tarea? Volverá a estar pendiente.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Sí, Rechazar", onPress: () => rejectTask(taskId) }
                ]
            );
        }
    };

    const confirmUnassign = (taskId: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Quieres desasignar (eliminar) esta tarea?")) deleteTask(taskId);
        } else {
            Alert.alert(
                "Desasignar Tarea",
                "¿Quieres desasignar (eliminar) esta tarea del hijo?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Sí, Eliminar", style: "destructive", onPress: () => deleteTask(taskId) }
                ]
            );
        }
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
                        searchPlaceholder="Buscar por nombre..."
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        statusOptions={[
                            { id: 'all', label: 'Todos' },
                            { id: 'pending', label: '⏳ Pendientes' },
                            { id: 'completed', label: '✅ Por Revisar' },
                            { id: 'verified', label: '⭐️ Verificados' },
                            { id: 'expired', label: '❌ Falladas/Vencidas' },
                        ]}
                        typeFilter={typeFilter}
                        setTypeFilter={setTypeFilter}
                    >
                        <View className="flex-row items-center justify-between mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                            <Text className="text-gray-500 text-xs font-bold uppercase">Fecha de Visualización</Text>
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

                        <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Filtrar por hijo:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} className="mb-4">
                            <TouchableOpacity
                                onPress={() => setSelectedChildId(null)}
                                className={`px-4 py-2 rounded-full border ${selectedChildId === null
                                    ? 'bg-gray-800 border-gray-800'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <Text className={selectedChildId === null ? 'text-white font-medium' : 'text-gray-700'}>Todos</Text>
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
                    <Text className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">Tareas Activas</Text>
                    <Text className="text-xs text-gray-400 mb-4 italic">
                        * Toca las tarjetas para seleccionar y verificar masivamente.
                    </Text>

                    {activeTasks.length === 0 ? (
                        <Text className="text-gray-400 text-center py-8">No hay tareas activas</Text>
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
                                            <View className="flex-row items-center gap-2">
                                                <Text className={`font-bold ${section.text} text-lg`}>{section.title}</Text>
                                                <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                                                    <Text className="text-xs font-bold text-gray-600">{sectionTasks.length}</Text>
                                                </View>
                                            </View>
                                            <Text className="text-gray-400">{isExpanded ? '▼' : '▶'}</Text>
                                        </TouchableOpacity>

                                        {isExpanded && (
                                            <View className="gap-0">
                                                {sectionTasks.map(item => {
                                                    const isSelected = selectedTaskIds.includes(item.id);
                                                    return (
                                                        <TouchableOpacity
                                                            key={item.id}
                                                            onPress={() => handleToggleSelection(item)}
                                                            activeOpacity={0.9}
                                                            disabled={item.status === 'verified'}
                                                        >
                                                            <View className={`mb-4 rounded-xl border-4 overflow-hidden relative ${isSelected ? 'border-green-500 bg-green-50 transform scale-[1.02]' : 'border-transparent'}`}>
                                                                {isSelected && (
                                                                    <View className="absolute top-2 right-2 z-10 bg-green-600 rounded-full w-6 h-6 items-center justify-center">
                                                                        <Text className="text-white font-bold">✓</Text>
                                                                    </View>
                                                                )}
                                                                <View>
                                                                    {renderTask({ item })}
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
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
                            title={`Verificar (${selectedTaskIds.length}) Tareas`}
                            onPress={handleBatchVerify}
                            className="shadow-xl bg-green-600 h-14"
                            textClassName="text-lg font-bold"
                        />
                    </View>
                )
            }
        </View >
    );
};
