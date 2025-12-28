import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, Alert, Modal, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Card } from '../components/ui/Card';
import { Task, Reward } from '../types';
import { Button } from '../components/ui/Button';
import { ChildTaskCard } from '../components/ChildTaskCard';

export default function ChildDashboard({ navigation }: any) {
    const { currentUser, tasks, history, completeTask, logout, messages, rewards, redeemReward, redemptions } = useTaskContext();
    const [messageModalVisible, setMessageModalVisible] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [canClose, setCanClose] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [currentTab, setCurrentTab] = useState<'tasks' | 'store'>('tasks');

    const myTasks = tasks.filter(t => t.assignedTo === currentUser?.id);
    const myHistory = history.filter(h => h.assignedTo === currentUser?.id && h.status === 'verified');
    const myPoints = myHistory.reduce((acc, curr) => acc + curr.points, 0);

    const myRedemptionRequests = redemptions.filter(r => r.childId === currentUser?.id && r.status === 'pending');

    useEffect(() => {
        // Show random message on mount
        if (messages && messages.length > 0) {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            setCurrentMessage(randomMsg);
            setMessageModalVisible(true);
            setCanClose(false);
            setCountdown(5);
        }
    }, []);

    useEffect(() => {
        if (!messageModalVisible) return;
        if (countdown > 0) {
            const timer = setInterval(() => setCountdown(c => c - 1), 1000);
            return () => clearInterval(timer);
        } else {
            setCanClose(true);
        }
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

    const handleRedeem = (reward: Reward) => {
        if (myPoints < reward.cost) {
            Alert.alert("Insuficiente", "No tienes suficientes puntos para este premio.");
            return;
        }

        const proceed = () => {
            redeemReward({
                rewardId: reward.id,
                rewardTitle: reward.title,
                childId: currentUser?.id || '',
                cost: reward.cost
            });
            Alert.alert("¡Solicitud Enviada!", "Dile a tus papás que aprueben tu premio.");
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`¿Quieres canjear "${reward.title}" por ${reward.cost} puntos?`)) proceed();
        } else {
            Alert.alert(
                "Canjear Premio",
                `¿Quieres canjear "${reward.title}" por ${reward.cost} puntos?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "¡SÍ, CANJEAR!", onPress: proceed }
                ]
            );
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
                    <Text className="text-white text-lg font-medium opacity-90">Hola, {currentUser?.name} 👋</Text>
                    <Text className="text-white text-3xl font-bold mt-1">{myPoints} Puntos ⭐️</Text>
                </View>
                <Button title="Salir" variant="secondary" size="sm" onPress={confirmLogout} className="bg-white/20" />
            </View>

            {/* Tab Switcher */}
            <View className="flex-row mx-6 mb-4 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg items-center ${currentTab === 'tasks' ? 'bg-indigo-100 dark:bg-indigo-900' : ''}`}
                    onPress={() => setCurrentTab('tasks')}
                >
                    <Text className={`font-bold ${currentTab === 'tasks' ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500'}`}>📝 Mis Tareas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg items-center ${currentTab === 'store' ? 'bg-amber-100 dark:bg-amber-900' : ''}`}
                    onPress={() => setCurrentTab('store')}
                >
                    <Text className={`font-bold ${currentTab === 'store' ? 'text-amber-600 dark:text-amber-300' : 'text-gray-500'}`}>🛍️ Tienda de Premios</Text>
                </TouchableOpacity>
            </View>

            {currentTab === 'tasks' ? (
                <FlatList
                    data={myTasks}
                    renderItem={renderTask}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-10">
                            <Text className="text-6xl mb-4">🎉</Text>
                            <Text className="text-gray-500 text-lg text-center dark:text-gray-400">¡No tienes tareas pendientes!</Text>
                            <Text className="text-gray-400 text-center mt-2 dark:text-gray-500">Disfruta tu tiempo libre.</Text>
                        </View>
                    }
                />
            ) : (
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                    {myRedemptionRequests.length > 0 && (
                        <View className="mb-6">
                            <Text className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">⏳ Solicitudes Pendientes</Text>
                            {myRedemptionRequests.map(req => (
                                <View key={req.id} className="bg-amber-50 dark:bg-gray-800 border border-amber-200 dark:border-amber-900 p-4 rounded-xl mb-2 flex-row justify-between items-center">
                                    <Text className="font-medium text-gray-800 dark:text-gray-200">{req.rewardTitle}</Text>
                                    <Text className="text-amber-600 font-bold">-{req.cost} pts</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">💎 Premios Disponibles</Text>
                    <View className="flex-row flex-wrap gap-4">
                        {rewards.map(reward => {
                            const canAfford = myPoints >= reward.cost;
                            return (
                                <TouchableOpacity
                                    key={reward.id}
                                    onPress={() => handleRedeem(reward)}
                                    disabled={!canAfford}
                                    style={{ width: '47%' }}
                                    className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-2 ${canAfford ? 'border-indigo-100 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-50'}`}
                                >
                                    <Text className="text-3xl mb-2 text-center">{reward.icon || '🎁'}</Text>
                                    <Text className="font-bold text-center text-gray-800 dark:text-white mb-1">{reward.title}</Text>
                                    <View className="bg-amber-100 dark:bg-amber-900 self-center px-3 py-1 rounded-full mt-2">
                                        <Text className="text-amber-700 dark:text-amber-300 font-bold text-xs">{reward.cost} Pts</Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                    {rewards.length === 0 && (
                        <Text className="text-gray-400 text-center py-10">Dile a tus papás que agreguen premios a la tienda.</Text>
                    )}
                </ScrollView>
            )}

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
