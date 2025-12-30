import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { ParentTaskCard } from '../ParentTaskCard';
import { Task } from '../../types';

export const MonitoringTab = () => {
    const navigation = useNavigation<any>();
    const { tasks, users, verifyTask, rejectTask, deleteTask, isTaskActiveToday } = useTaskContext();
    const children = users.filter(u => u.role === 'child');
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'verified'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'responsibility' | 'extra' | 'school'>('all');
    const [showFilters, setShowFilters] = useState(false);

    const activeTasks = (selectedChildId
        ? tasks.filter(t => t.assignedTo === selectedChildId && t.assignedTo !== 'pool')
        : tasks.filter(t => t.assignedTo !== 'pool')
    ).filter(t => isTaskActiveToday ? isTaskActiveToday(t) : true)
        .filter(t => {
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;

            if (typeFilter === 'responsibility') return t.type === 'obligatory';
            if (typeFilter === 'extra') return t.type === 'additional';
            if (typeFilter === 'school') return t.isSchool;

            return true;
        })
        .sort((a, b) => a.title.localeCompare(b.title));

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

    const renderTask = ({ item }: { item: Task }) => (
        <ParentTaskCard
            task={item}
            users={users}
            onVerify={confirmVerify}
            onReject={confirmReject}
            onAssign={() => { }}
            onEdit={(item) => navigation.navigate('CreateTask', { taskToEdit: item })}
            onDelete={confirmUnassign}
        />
    );

    return (
        <>
            <View className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity
                    onPress={() => setShowFilters(!showFilters)}
                    className="flex-row justify-between items-center"
                >
                    <Text className="text-gray-500 text-xs font-bold uppercase">Filtros Avanzados</Text>
                    <Text className="text-gray-500 text-lg">{showFilters ? '🔼' : '🔽'}</Text>
                </TouchableOpacity>

                {showFilters && (
                    <View className="mt-4">
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

                            {children.map(child => {
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

                        <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Estado:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} className="mb-4">
                            {[
                                { id: 'all', label: 'Todos' },
                                { id: 'pending', label: '⏳ Pendientes' },
                                { id: 'completed', label: '✅ Hechos' },
                                { id: 'verified', label: '⭐️ Verificados' },
                            ].map(f => (
                                <TouchableOpacity
                                    key={f.id}
                                    onPress={() => setStatusFilter(f.id as any)}
                                    className={`px-3 py-1.5 rounded-full border ${statusFilter === f.id
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'bg-white border-gray-300'
                                        }`}
                                >
                                    <Text className={`text-xs font-semibold ${statusFilter === f.id ? 'text-white' : 'text-gray-600'}`}>
                                        {f.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Tipo:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
                                    <Text className={`text-xs font-semibold ${typeFilter === f.id ? 'text-white' : 'text-gray-600'}`}>
                                        {f.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            <View className="p-5 pb-24">
                <Text className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Tareas Activas</Text>
                {activeTasks.length === 0 ? (
                    <Text className="text-gray-400 text-center py-8">No hay tareas activas</Text>
                ) : (
                    activeTasks.map(item => (
                        <View key={item.id}>
                            {renderTask({ item })}
                        </View>
                    ))
                )}
            </View>
        </>
    );
};
