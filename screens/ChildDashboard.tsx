import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, Alert, Modal, TouchableOpacity, Platform } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Card } from '../components/ui/Card';
import { Task } from '../types';
import { Button } from '../components/ui/Button';
import { ChildTaskCard } from '../components/ChildTaskCard';

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

    const handleComplete = (task: Task, evidenceUrl?: string) => {
        // Time window check (redundant but safe)
        if (task.timeWindow) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            if (currentTime < task.timeWindow.start || currentTime > task.timeWindow.end) {
                if (Platform.OS === 'web') {
                    window.alert(`Esta tarea solo está disponible entre ${task.timeWindow.start} y ${task.timeWindow.end}`);
                } else {
                    Alert.alert("Aún no es hora", `Esta tarea solo está disponible entre ${task.timeWindow.start} y ${task.timeWindow.end}`);
                }
                return;
            }
        }

        // Due Date Check
        if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
            if (Platform.OS === 'web') {
                window.alert("Esta tarea ha vencido y no se puede completar.");
            } else {
                Alert.alert("Vencida", "Esta tarea ha vencido y no se puede completar.");
            }
            return;
        }

        const proceed = () => {
            try {
                completeTask(task.id, evidenceUrl);
            } catch (e: any) {
                if (Platform.OS === 'web') window.alert(e.message);
                else Alert.alert("Ops", e.message);
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm("¿Ya terminaste esta tarea?");
            if (confirmed) proceed();
        } else {
            // If evidence (photo) is provided, we skip the second confirmation because 
            // taking a photo is already a strong intentional action.
            if (evidenceUrl) {
                proceed();
            } else {
                Alert.alert(
                    "¿Estás seguro?",
                    "¿Ya terminaste esta tarea?",
                    [
                        { text: "Cancelar", style: "cancel" },
                        {
                            text: "Sí, ¡ya la hice!",
                            onPress: proceed
                        }
                    ]
                );
            }
        }
    };

    const renderTask = ({ item }: { item: Task }) => (
        <ChildTaskCard item={item} onComplete={handleComplete} />
    );

    const confirmLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de que quieres salir?")) {
                logout();
            }
        } else {
            Alert.alert(
                "Cerrar Sesión",
                "¿Estás seguro de que quieres salir?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Salir", onPress: logout }
                ]
            );
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-sky-50 dark:bg-brand-dark">
            <View
                style={{ backgroundColor: currentUser?.color || '#4f46e5' }}
                className="p-6 flex-row justify-between items-center rounded-b-3xl shadow-lg mb-4"
            >
                <View>
                    <Text className="text-white/80 font-medium text-lg">Hola,</Text>
                    <Text className="text-3xl font-bold text-white tracking-tight">{currentUser?.name}</Text>
                </View>
                <View className="flex-row gap-2">
                    <Button title="📜 Historial" size="sm" variant="secondary" onPress={() => navigation.navigate('History')} className="bg-white/20" />
                    <Button title="Salir" size="sm" variant="secondary" onPress={confirmLogout} className="bg-white/20" />
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
