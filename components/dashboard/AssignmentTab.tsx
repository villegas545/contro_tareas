import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';
import { DatePicker } from '../ui/DatePicker';
import { ParentTaskCard } from '../ParentTaskCard';
import { Task } from '../../types';

export const AssignmentTab = () => {
    const navigation = useNavigation<any>();
    const { tasks, currentUser, users, verifyTask, rejectTask, addTask, deleteTask } = useTaskContext();
    const children = users.filter(u => u.role === 'child');

    const [assignmentSearch, setAssignmentSearch] = useState('');
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [isAssigningMode, setIsAssigningMode] = useState(false);
    const [assignmentSelection, setAssignmentSelection] = useState<string[]>([]);

    // Assignment Override State
    const [assignRecurrenceDays, setAssignRecurrenceDays] = useState<number[]>([]);
    const [assignDueDate, setAssignDueDate] = useState<string>('');

    const [typeFilter, setTypeFilter] = useState<'all' | 'responsibility' | 'extra' | 'school'>('all');
    const [frequencyFilter, setFrequencyFilter] = useState<'all' | 'daily' | 'weekly' | 'one-time'>('all');
    const [showFilters, setShowFilters] = useState(false);

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
                if (Platform.OS === 'web') window.alert("Las tareas semanales deben asignarse individualmente para configurar sus días.");
                else Alert.alert("Restricción", "Las tareas semanales deben asignarse individualmente para configurar sus días.");
                return;
            }
        }

        // Logic restricts adding if a weekly task is ALREADY selected
        const hasWeeklySelected = selectedTemplateIds.some(id => tasks.find(t => t.id === id)?.frequency === 'weekly');
        if (hasWeeklySelected) {
            if (Platform.OS === 'web') window.alert("No puedes mezclar otras tareas con una tarea semanal seleccionada.");
            else Alert.alert("Restricción", "No puedes mezclar otras tareas con una tarea semanal seleccionada.");
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
                    // Check duplicate
                    const isDuplicate = tasks.some(t =>
                        t.assignedTo === childId &&
                        t.title === template.title &&
                        t.status !== 'verified' && t.status !== 'completed'
                    );

                    if (isDuplicate) {
                        totalSkipped++;
                        return;
                    }

                    const newTask: any = {
                        title: template.title,
                        description: template.description,
                        assignedTo: childId,
                        createdBy: currentUser?.id || '',
                        status: 'pending',
                        type: template.type,
                        frequency: template.frequency,
                        isResponsibility: template.isResponsibility,
                        isSchool: template.isSchool,
                    };

                    if (template.points) newTask.points = template.points;
                    if (template.timeWindow) newTask.timeWindow = template.timeWindow;
                    if (template.dueTime) newTask.dueTime = template.dueTime;

                    // Apply Overrides
                    if (assignRecurrenceDays && assignRecurrenceDays.length > 0) newTask.recurrenceDays = assignRecurrenceDays;
                    if (assignDueDate) newTask.dueDate = assignDueDate;

                    addTask(newTask);
                    totalAssigned++;
                });
            });

            setSelectedTemplateIds([]);
            setIsAssigningMode(false);
            setAssignmentSelection([]);

            let message = "";
            if (totalAssigned > 0) message += `Se asignaron ${totalAssigned} tareas en total. `;
            if (totalSkipped > 0) message += `${totalSkipped} fueron omitidas por duplicado.`;

            if (Platform.OS === 'web') window.alert(message);
            else Alert.alert("Asignación Completada", message);
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`¿Asignar ${selectedTemplateIds.length} tareas a los hijos seleccionados?`)) {
                assignLogic();
            }
        } else {
            Alert.alert(
                "Confirmar Asignación",
                `¿Asignar ${selectedTemplateIds.length} tareas a los hijos seleccionados?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Asignar", onPress: assignLogic }
                ]
            );
        }
    };

    const confirmVerify = (taskId: string) => { /* Not used in pool view usually, strictly for templates */ };
    const confirmReject = (taskId: string) => { /* Not used */ };

    const confirmDeleteTemplate = (taskId: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Seguro que quieres eliminar esta plantilla?")) deleteTask(taskId);
        } else {
            Alert.alert(
                "Eliminar Plantilla",
                "¿Seguro que quieres eliminar esta plantilla?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: () => deleteTask(taskId) }
                ]
            );
        }
    };

    const representativeTask = selectedTemplateIds.length > 0
        ? tasks.find(t => t.id === selectedTemplateIds[0])
        : null;

    return (
        <View className="flex-1 relative bg-gray-50 dark:bg-gray-900">
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <View className="mb-4 flex-row justify-between items-center">
                    <Text className="text-lg font-bold text-gray-700 dark:text-gray-200">Plantillas de Tareas</Text>
                    <Button
                        title="+ Crear Plantilla"
                        size="sm"
                        onPress={() => navigation.navigate('CreateTask')}
                    />
                </View>

                <SearchInput
                    placeholder="Buscar plantilla..."
                    value={assignmentSearch}
                    onChangeText={setAssignmentSearch}
                />

                <View className="mb-4 mt-2">
                    <TouchableOpacity
                        onPress={() => setShowFilters(!showFilters)}
                        className="flex-row justify-between items-center mb-2 px-1"
                    >
                        <Text className="text-gray-500 text-xs font-bold uppercase">Filtros Avanzados</Text>
                        <Text className="text-gray-500 text-lg">{showFilters ? '🔼' : '🔽'}</Text>
                    </TouchableOpacity>

                    {showFilters && (
                        <View className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2">Tipo:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} className="mb-3">
                                {[
                                    { id: 'all', label: 'Todos' },
                                    { id: 'responsibility', label: '🎁 Bonos' },
                                    { id: 'extra', label: '💵 Extras' },
                                    { id: 'school', label: '🎓 Escolar' },
                                ].map(f => (
                                    <TouchableOpacity
                                        key={f.id}
                                        onPress={() => setTypeFilter(f.id as any)}
                                        className={`px-3 py-1.5 rounded-full border ${typeFilter === f.id
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <Text className={`text-xs font-semibold ${typeFilter === f.id ? 'text-white' : 'text-gray-600'}`}>{f.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2">Frecuencia:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} className="mb-3">
                                {[
                                    { id: 'all', label: 'Todas' },
                                    { id: 'daily', label: '📅 Diaria' },
                                    { id: 'weekly', label: '📅 Semanal' },
                                    { id: 'one-time', label: '☝️ Una vez' },
                                ].map(f => (
                                    <TouchableOpacity
                                        key={f.id}
                                        onPress={() => setFrequencyFilter(f.id as any)}
                                        className={`px-3 py-1.5 rounded-full border ${frequencyFilter === f.id
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <Text className={`text-xs font-semibold ${frequencyFilter === f.id ? 'text-white' : 'text-gray-600'}`}>{f.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                <Text className="text-xs text-gray-400 mb-2 italic">
                    * Toca las tarjetas para seleccionarlas.
                </Text>

                {displayTasks.length === 0 ? (
                    <Text className="text-gray-400 text-center py-8">No se encontraron plantillas</Text>
                ) : (
                    displayTasks.map(item => {
                        const isSelected = selectedTemplateIds.includes(item.id);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => handleToggleSelection(item)}
                                activeOpacity={0.9}
                            >
                                <View
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
                                        />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Floating Action Button */}
            {selectedTemplateIds.length > 0 && (
                <View className="absolute bottom-6 left-6 right-6 z-50">
                    <Button
                        title={`Asignar ${selectedTemplateIds.length} Tarea(s)`}
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
                                Asignar {selectedTemplateIds.length} tareas a:
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
                                    <Text className="text-gray-700 font-bold mb-2">Programación (Opcional):</Text>

                                    {(representativeTask.frequency === 'weekly') && (
                                        <View>
                                            <Text className="text-xs text-gray-500 mb-2">Selecciona días específicos:</Text>
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
                                            label="Fecha Específica"
                                        />
                                    )}
                                </View>
                            )}

                            <Text className="text-xs text-gray-400 mb-4 text-center">
                                Se aplicará la misma configuración a todas las tareas seleccionadas.
                            </Text>

                            <View className="gap-3">
                                <Button title="Confirmar Asignación" onPress={handleBatchAssign} />
                                <Button title="Cancelar" variant="outline" onPress={() => setIsAssigningMode(false)} />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};
