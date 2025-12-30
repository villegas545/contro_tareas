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
    const [taskLikelyToAssign, setTaskLikelyToAssign] = useState<Task | null>(null);
    const [assignmentSelection, setAssignmentSelection] = useState<string[]>([]);

    // Assignment Override State
    const [assignRecurrenceDays, setAssignRecurrenceDays] = useState<number[]>([]);
    const [assignDueDate, setAssignDueDate] = useState<string>('');

    const [activeFilter, setActiveFilter] = useState<'all' | 'responsibility' | 'extra' | 'school' | 'daily' | 'weekly'>('all');

    const poolTasks = tasks.filter(t => t.assignedTo === 'pool');

    // Derived state
    const displayTasks = poolTasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
            (t.description?.toLowerCase() || '').includes(assignmentSearch.toLowerCase());

        let matchesFilter = true;
        if (activeFilter === 'responsibility') matchesFilter = t.type === 'obligatory';
        else if (activeFilter === 'extra') matchesFilter = t.type === 'additional';
        else if (activeFilter === 'school') matchesFilter = (t.isSchool || false);
        else if (activeFilter === 'daily') matchesFilter = t.frequency === 'daily';
        else if (activeFilter === 'weekly') matchesFilter = t.frequency === 'weekly';

        return matchesSearch && matchesFilter;
    }).sort((a, b) => a.title.localeCompare(b.title));

    const handleAssignTask = () => {
        if (!taskLikelyToAssign || assignmentSelection.length === 0) return;

        const assignLogic = () => {
            let assignedCount = 0;
            let skippedCount = 0;

            assignmentSelection.forEach(childId => {
                // Check for duplicates (same title, assigned to same child, not completed/verified)
                const isDuplicate = tasks.some(t =>
                    t.assignedTo === childId &&
                    t.title === taskLikelyToAssign.title &&
                    t.status !== 'verified' && t.status !== 'completed'
                );

                if (isDuplicate) {
                    skippedCount++;
                    return;
                }

                const newTask: any = {
                    title: taskLikelyToAssign.title,
                    description: taskLikelyToAssign.description,
                    assignedTo: childId,
                    createdBy: currentUser?.id || '',
                    status: 'pending',
                    type: taskLikelyToAssign.type,
                    frequency: taskLikelyToAssign.frequency,
                    isResponsibility: taskLikelyToAssign.isResponsibility,
                    isSchool: taskLikelyToAssign.isSchool,
                };

                if (taskLikelyToAssign.points) newTask.points = taskLikelyToAssign.points;

                if (taskLikelyToAssign.timeWindow) newTask.timeWindow = taskLikelyToAssign.timeWindow;
                if (taskLikelyToAssign.dueTime) newTask.dueTime = taskLikelyToAssign.dueTime;
                if (assignRecurrenceDays && assignRecurrenceDays.length > 0) newTask.recurrenceDays = assignRecurrenceDays;
                if (assignDueDate) newTask.dueDate = assignDueDate;
                addTask(newTask);
                assignedCount++;
            });

            setTaskLikelyToAssign(null);
            setAssignmentSelection([]);

            let message = "";
            if (assignedCount > 0) message += `Asignada a ${assignedCount} hijo(s). `;
            if (skippedCount > 0) message += `Omitida para ${skippedCount} hijo(s) porque ya la tienen asignada.`;

            if (Platform.OS === 'web') window.alert(message);
            else Alert.alert("Resultado", message);
        }

        if (Platform.OS === 'web') {
            if (window.confirm(`¿Asignar "${taskLikelyToAssign.title}" a los hijos seleccionados?`)) {
                assignLogic();
            }
        } else {
            Alert.alert(
                "Confirmar Asignación",
                `¿Asignar "${taskLikelyToAssign.title}" a los hijos seleccionados?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Asignar",
                        onPress: assignLogic
                    }
                ]
            );
        }
    };

    const handlePoolAssign = (item: Task) => {
        setTaskLikelyToAssign(item);
        setAssignmentSelection(children.length > 0 ? [children[0].id] : []);
        // Initialize overrides
        setAssignRecurrenceDays(item.recurrenceDays || []);
        setAssignDueDate(item.dueDate || '');
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

    const confirmDeleteTemplate = (taskId: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Seguro que quieres eliminar esta plantilla?")) deleteTask(taskId);
        } else {
            Alert.alert(
                "Eliminar Plantilla",
                "¿Seguro que quieres eliminar esta plantilla? No afectará a las tareas ya asignadas.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: () => deleteTask(taskId) }
                ]
            );
        }
    };

    const renderTask = ({ item }: { item: Task }) => (
        <ParentTaskCard
            task={item}
            users={users}
            onVerify={confirmVerify}
            onReject={confirmReject}
            onAssign={handlePoolAssign}
            onEdit={(item) => navigation.navigate('CreateTask', { taskToEdit: item })}
            onDelete={confirmDeleteTemplate}
        />
    );

    return (
        <View className="p-5 pb-24">
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {[
                        { id: 'all', label: 'Todas' },
                        { id: 'responsibility', label: '🎁 Bonos' },
                        { id: 'extra', label: '💵 Extras' },
                        { id: 'school', label: '🎓 Escolares' },
                        { id: 'daily', label: '📅 Diarias' },
                        { id: 'weekly', label: '📅 Semanales' },
                    ].map(filter => (
                        <TouchableOpacity
                            key={filter.id}
                            onPress={() => setActiveFilter(filter.id as any)}
                            className={`px-3 py-1.5 rounded-full border ${activeFilter === filter.id
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'bg-white border-gray-300'
                                }`}
                        >
                            <Text className={`text-xs font-semibold ${activeFilter === filter.id ? 'text-white' : 'text-gray-600'}`}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {displayTasks.length === 0 ? (
                <Text className="text-gray-400 text-center py-8">No se encontraron plantillas</Text>
            ) : (
                displayTasks.map(item => (
                    <View key={item.id}>
                        {renderTask({ item })}
                    </View>
                ))
            )}

            {/* Modal for Assignment */}
            {taskLikelyToAssign && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View className="flex-1 bg-black/50 z-50 justify-center items-center p-6">
                        <View className="bg-white p-6 rounded-2xl w-full max-w-sm">
                            <Text className="text-xl font-bold mb-4">Asignar "{taskLikelyToAssign.title}" a:</Text>

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

                            {/* Schedule Override - Only for Weekly or One-Time */}
                            {(taskLikelyToAssign.frequency === 'weekly' || taskLikelyToAssign.frequency === 'one-time') && (
                                <View className="mb-6">
                                    <Text className="text-gray-700 font-bold mb-2">Programación (Opcional):</Text>

                                    {(taskLikelyToAssign.frequency === 'weekly') && (
                                        <View>
                                            <Text className="text-xs text-gray-500 mb-2">Selecciona días específicos para esta asignación:</Text>
                                            <View className="flex-row justify-between">
                                                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => {
                                                    const isSelected = assignRecurrenceDays.includes(index);
                                                    return (
                                                        <TouchableOpacity
                                                            key={index}
                                                            onPress={() => {
                                                                if (isSelected) setAssignRecurrenceDays(prev => prev.filter(d => d !== index));
                                                                else setAssignRecurrenceDays(prev => [...prev, index]);
                                                            }}
                                                            className={`w-9 h-9 rounded-full justify-center items-center border ${isSelected
                                                                ? 'bg-indigo-600 border-indigo-600'
                                                                : 'bg-white border-gray-300'}`}
                                                        >
                                                            <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-600'}`}>{day}</Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    )}

                                    {taskLikelyToAssign.frequency === 'one-time' && (
                                        <DatePicker
                                            value={assignDueDate}
                                            onChange={setAssignDueDate}
                                            label="Fecha Específica"
                                        />
                                    )}
                                </View>
                            )}

                            <View className="gap-3">
                                <Button title="Confirmar Asignación" onPress={handleAssignTask} />
                                <Button title="Cancelar" variant="outline" onPress={() => setTaskLikelyToAssign(null)} />
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};
