import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { ParentTaskCard } from '../ParentTaskCard';
import { Task } from '../../types';

export const MonitoringTab = () => {
    const navigation = useNavigation<any>();
    const { tasks, users, verifyTask, rejectTask } = useTaskContext();
    const children = users.filter(u => u.role === 'child');
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    const activeTasks = selectedChildId
        ? tasks.filter(t => t.assignedTo === selectedChildId && t.assignedTo !== 'pool')
        : tasks.filter(t => t.assignedTo !== 'pool');

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

    const renderTask = ({ item }: { item: Task }) => (
        <ParentTaskCard
            task={item}
            users={users}
            onVerify={confirmVerify}
            onReject={confirmReject}
            onEdit={(item) => navigation.navigate('CreateTask', { taskToEdit: item })}
        />
    );

    return (
        <>
            <View className="px-6 py-4">
                <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Filtrar por hijo:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
