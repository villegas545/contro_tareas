import React, { useMemo, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';

export default function StatisticsScreen({ navigation }: any) {
    const { history, users, tasks } = useTaskContext();
    const children = users.filter(u => u.role === 'child');

    // Week Navigation State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    const { startOfWeek, endOfWeek } = useMemo(() => {
        const start = new Date(currentDate);
        const day = start.getDay(); // 0 is Sunday
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { startOfWeek: start, endOfWeek: end };
    }, [currentDate]);

    const changeWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const isCurrentWeek = useMemo(() => {
        const today = new Date();
        return today >= startOfWeek && today <= endOfWeek;
    }, [startOfWeek, endOfWeek]);

    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startOfWeek && itemDate <= endOfWeek;
        });
    }, [history, startOfWeek, endOfWeek]);

    const stats = useMemo(() => {
        const targetChildren = selectedChildId
            ? children.filter(c => c.id === selectedChildId)
            : children;

        return targetChildren.map(child => {
            const childHistory = filteredHistory.filter(h => h.assignedTo === child.id);
            const totalPoints = childHistory.reduce((acc, curr) => acc + (curr.status === 'verified' ? curr.points : 0), 0);

            // Active Tasks
            const activePending = tasks.filter(t => t.assignedTo === child.id && t.status === 'pending');
            const activeWaiting = tasks.filter(t => t.assignedTo === child.id && t.status === 'completed');

            const pending = activePending.length;

            // Map active to history format
            const pendingAsHistory = activePending.map(t => ({
                id: t.id,
                taskTitle: t.title,
                status: 'pending',
                date: 'Hoy',
                points: t.points || 0
            }));

            const waitingAsHistory = activeWaiting.map(t => ({
                id: t.id,
                taskTitle: t.title,
                status: 'completed',
                date: 'Hoy',
                points: t.points || 0
            }));

            const combinedActivity = [...childHistory, ...pendingAsHistory, ...waitingAsHistory];

            // Basic Stats
            const completed = childHistory.filter(h => h.status === 'verified').length;
            const waiting = activeWaiting.length;
            const missed = childHistory.filter(h => h.status === 'missed').length;

            // Punishment Logic
            const responsibilityMissedCount = childHistory.filter(h => h.status === 'missed' && h.isResponsibility).length;
            const punishmentWarning = responsibilityMissedCount > 5;

            return {
                child,
                totalPoints,
                completed,
                waiting, // Added
                missed,
                pending,
                history: combinedActivity,
                punishmentWarning,
                missedCount: responsibilityMissedCount
            };
        });
    }, [filteredHistory, children, selectedChildId, tasks]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
            <View className="p-6 bg-white dark:bg-slate-800 shadow-sm flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">Estadísticas</Text>
                <Button title="Cerrar" size="sm" variant="outline" onPress={() => navigation.goBack()} />
            </View>

            {/* Child Filter */}
            <View className="px-6 py-4">
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
                                <View style={{ backgroundColor: isSelected ? 'white' : userColor }} className="w-3 h-3 rounded-full mr-2" />
                                <Text className={isSelected ? 'text-white font-medium' : 'text-gray-700'}>{child.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                {/* Weekly Navigator */}
                <Card className="mb-6 p-4 bg-white flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => changeWeek('prev')}
                        className="p-2 bg-gray-100 rounded-full"
                    >
                        <Text className="text-gray-600 font-bold">◀</Text>
                    </TouchableOpacity>

                    <View className="items-center">
                        <Text className="text-gray-500 text-xs font-bold uppercase mb-1">Semana del</Text>
                        <Text className="text-lg font-bold text-indigo-600">
                            {formatDate(startOfWeek)} - {formatDate(endOfWeek)}
                        </Text>
                        {isCurrentWeek && (
                            <Text className="text-xs text-green-600 font-bold mt-1">Semana Actual</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => changeWeek('next')}
                        className="p-2 bg-gray-100 rounded-full"
                    >
                        <Text className="text-gray-600 font-bold">▶</Text>
                    </TouchableOpacity>
                </Card>

                {stats.map(({ child, totalPoints, completed, waiting, missed, pending, history, punishmentWarning, missedCount }) => (
                    <View key={child.id} className="mb-8 border-b-2 border-gray-100 pb-8 last:border-0">
                        <Text className="text-xl font-bold text-gray-800 mb-4">Progreso de {child.name}</Text>

                        {/* Bonus / Punishment Status */}
                        {punishmentWarning ? (
                            <View className="bg-red-100 p-4 rounded-xl mb-6 border-l-4 border-red-500">
                                <Text className="text-red-700 font-bold text-lg">⚠️ ¡Alerta de Castigo!</Text>
                                <Text className="text-red-600 mt-1">
                                    Ha fallado {missedCount} tareas esta semana. (Límite: 5)
                                </Text>
                            </View>
                        ) : (
                            <View className="bg-green-100 p-3 rounded-xl mb-6 border-l-4 border-green-500">
                                <Text className="text-green-700 font-bold">✅ Buen camino para el Bono</Text>
                                <Text className="text-green-600 text-xs mt-1">Faltas: {missedCount} / 5 permitidas</Text>
                            </View>
                        )}

                        <View className="gap-4 mb-6">
                            {/* Row 1 */}
                            <View className="flex-row gap-4">
                                <Card className="flex-1 bg-indigo-50 border-indigo-100 items-center p-4">
                                    <Text className="text-3xl font-bold text-indigo-600">{totalPoints}</Text>
                                    <Text className="text-indigo-400 text-xs font-bold uppercase mt-1">Puntos</Text>
                                </Card>

                                <Card className="flex-1 bg-yellow-50 border-yellow-100 items-center p-4">
                                    <Text className="text-3xl font-bold text-yellow-600">{pending}</Text>
                                    <Text className="text-yellow-500 text-xs font-bold uppercase mt-1">Pendientes</Text>
                                </Card>

                                <Card className="flex-1 bg-blue-50 border-blue-100 items-center p-4">
                                    <Text className="text-3xl font-bold text-blue-600">{waiting}</Text>
                                    <Text className="text-blue-500 text-xs font-bold uppercase mt-1 text-center">Revisar</Text>
                                </Card>
                            </View>

                            {/* Row 2 */}
                            <View className="flex-row gap-4">
                                <Card className="flex-1 bg-green-50 border-green-100 items-center p-4">
                                    <Text className="text-3xl font-bold text-green-600">{completed}</Text>
                                    <Text className="text-green-400 text-xs font-bold uppercase mt-1">Completados</Text>
                                </Card>

                                <Card className="flex-1 bg-rose-50 border-rose-100 items-center p-4">
                                    <Text className="text-3xl font-bold text-rose-600">{missed}</Text>
                                    <Text className="text-rose-400 text-xs font-bold uppercase mt-1">Fallados</Text>
                                </Card>
                            </View>
                        </View>

                        <Text className="text-gray-500 font-bold mb-3">Detalle de Actividad</Text>
                        {history.length === 0 ? (
                            <Text className="text-center text-gray-400 italic py-4">No hay actividad esta semana.</Text>
                        ) : (
                            history.slice().sort((a, b) => {
                                if (a.date === 'Hoy') return -1;
                                if (b.date === 'Hoy') return 1;
                                return new Date(b.date).getTime() - new Date(a.date).getTime();
                            }).map(item => {
                                let statusColor = 'bg-gray-300';
                                let statusText = 'Desconocido';
                                let statusTextColor = 'text-gray-500';

                                if (item.status === 'verified') {
                                    statusColor = 'bg-green-500';
                                    statusText = 'Completado';
                                    statusTextColor = 'text-green-600';
                                } else if (item.status === 'missed') {
                                    statusColor = 'bg-rose-500';
                                    statusText = 'No realizado';
                                    statusTextColor = 'text-rose-500';
                                } else if (item.status === 'completed') {
                                    statusColor = 'bg-blue-400';
                                    statusText = 'Por Revisar';
                                    statusTextColor = 'text-blue-500';
                                } else if (item.status === 'pending') {
                                    statusColor = 'bg-yellow-400';
                                    statusText = 'Pendiente';
                                    statusTextColor = 'text-yellow-600';
                                }

                                return (
                                    <View key={item.id} className="mb-3 flex-row items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                        <View className={`w-2 h-10 rounded-full mr-3 ${statusColor}`} />

                                        <View className="flex-1">
                                            <Text className="font-bold text-gray-800">{item.taskTitle}</Text>
                                            <Text className="text-xs text-gray-500">{item.date}</Text>
                                        </View>

                                        <View className="items-end">
                                            <Text className={`font-bold ${statusTextColor}`}>
                                                {statusText}
                                            </Text>
                                            {item.status === 'verified' && (
                                                <Text className="text-xs text-indigo-500 font-bold">+{item.points} pts</Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
