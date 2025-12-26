import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, Alert, Modal } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Card } from '../components/ui/Card';
import { Task } from '../types';
import { Button } from '../components/ui/Button';

export default function ChildDashboard({ navigation }: any) {
    const { currentUser, tasks, history, completeTask, logout, messages } = useTaskContext();
    const [messageModalVisible, setMessageModalVisible] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [canClose, setCanClose] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const myTasks = tasks.filter(t => t.assignedTo === currentUser?.id);
    const myHistory = history.filter(h => h.assignedTo === currentUser?.id && h.status === 'verified');
    const myPoints = myHistory.reduce((acc, curr) => acc + curr.points, 0);

    useEffect(() => {
        // Show random message on mount
        if (messages && messages.length > 0) {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            setCurrentMessage(randomMsg);
            setMessageModalVisible(true);
            setCanClose(false);
            setCountdown(5);
        }
    }, [messages]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (messageModalVisible && countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            setCanClose(true);
        }
        return () => clearInterval(timer);
    }, [messageModalVisible, countdown]);

    const handleComplete = (task: Task) => {
        if (task.dueDate && new Date(task.dueDate) < new Date()) {
            Alert.alert("Vencida", "Esta tarea ha vencido y no se puede completar.");
            return;
        }

        Alert.alert(
            "¿Estás seguro?",
            "¿Ya terminaste esta tarea?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sí, ¡ya la hice!",
                    onPress: () => {
                        try {
                            completeTask(task.id);
                        } catch (e: any) {
                            Alert.alert("Ops", e.message);
                        }
                    }
                }
            ]
        );
    };

    const renderTask = ({ item }: { item: Task }) => {
        const isPending = item.status === 'pending';
        return (
            <Card className={`mb-4 border-l-4 ${item.status === 'verified' ? 'border-green-500 opacity-60' : 'border-indigo-500'}`}>
                <View className="flex-row items-center">
                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${item.status === 'verified' ? 'bg-green-100' : 'bg-indigo-50'}`}>
                        <Text className="text-2xl">
                            {item.title.toLowerCase().includes('dientes') ? '🦷' :
                                item.title.toLowerCase().includes('platos') ? '🍽️' :
                                    item.title.toLowerCase().includes('barrer') ? '🧹' : '📝'}
                        </Text>
                    </View>

                    <View className="flex-1">
                        <Text className={`text-lg font-bold ${item.status === 'verified' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {item.title}
                        </Text>
                        {item.points && (
                            <Text className="text-amber-500 font-bold text-sm">+{item.points} Pts ⭐️</Text>
                        )}
                    </View>
                </View>

                {isPending && (
                    <View className="mt-4">
                        <Button
                            title="¡Ya lo hice!"
                            onPress={() => handleComplete(item)}
                            variant="primary"
                        />
                    </View>
                )}

                {item.status === 'completed' && (
                    <View className="mt-4 bg-amber-50 p-2 rounded items-center">
                        <Text className="text-amber-600 font-medium">Esperando revisión de papá/mamá ⏳</Text>
                    </View>
                )}

                {item.status === 'verified' && (
                    <View className="mt-4 bg-green-50 p-2 rounded items-center">
                        <Text className="text-green-600 font-bold">¡Bien hecho! ✅</Text>
                    </View>
                )}
            </Card>
        );
    };

    const confirmLogout = () => {
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que quieres salir?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Salir", onPress: logout }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
            <View className="p-6 flex-row justify-between items-center bg-indigo-600 rounded-b-3xl shadow-lg mb-4">
                <View>
                    <Text className="text-indigo-100 font-medium text-lg">Hola,</Text>
                    <Text className="text-3xl font-bold text-white tracking-tight">{currentUser?.name}</Text>
                </View>
                <View className="flex-row gap-2">
                    <Button title="📜 Historial" size="sm" variant="secondary" onPress={() => navigation.navigate('History')} className="bg-indigo-500" />
                    <Button title="Salir" size="sm" variant="secondary" onPress={confirmLogout} className="bg-indigo-500" />
                </View>
            </View>

            <View className="px-6 mb-4">
                <Card className="bg-amber-100 border-amber-200 flex-row items-center justify-between p-3">
                    <Text className="text-amber-800 font-bold">Mis Puntos:</Text>
                    <Text className="text-2xl font-black text-amber-600">{myPoints} ⭐️</Text>
                </Card>
            </View>

            <FlatList
                data={myTasks}
                keyExtractor={(item) => item.id}
                renderItem={renderTask}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                ListEmptyComponent={
                    <Text className="text-center text-gray-400 mt-10">¡No tienes tareas pendientes! 🎉</Text>
                }
            />

            {/* Motivational Message Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={messageModalVisible}
                onRequestClose={() => {
                    if (canClose) setMessageModalVisible(false);
                }}
            >
                <View className="flex-1 justify-center items-center bg-black/80 p-6">
                    <View className="bg-white p-8 rounded-3xl w-full max-w-sm items-center">
                        <Text className="text-4xl mb-6">✨</Text>
                        <Text className="text-center text-xl font-bold text-gray-900 mb-8 leading-8">
                            {currentMessage}
                        </Text>

                        <Button
                            title={canClose ? "¡Entendido! 🚀" : `Leer mensaje... (${countdown})`}
                            onPress={() => setMessageModalVisible(false)}
                            variant="primary"
                            className={!canClose ? "opacity-50" : ""}
                            disabled={!canClose}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
