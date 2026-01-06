import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';

export default function StatisticsScreen({ navigation, route, embedded }: any) {
    const { history, users, tasks, currentUser } = useTaskContext();
    const children = users.filter((u: any) => u.role === 'child');

    const isChildView = currentUser?.role === 'child';
    const isEmbedded = embedded || route?.params?.embedded;

    // Week Navigation State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedChildId, setSelectedChildId] = useState<string | null>(isChildView ? currentUser?.id : null);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

    useEffect(() => {
        if (isChildView && currentUser) {
            setSelectedChildId(currentUser.id);
        }
    }, [currentUser, isChildView]);

    const { startOfWeek, endOfWeek } = useMemo(() => {
        const start = new Date(currentDate);
        // If viewMode is day, start and end are the same day (conceptual for week logic reuse, but we'll use diff filter)
        if (viewMode === 'day') {
            const startDay = new Date(currentDate);
            startDay.setHours(0, 0, 0, 0);
            const endDay = new Date(currentDate);
            endDay.setHours(23, 59, 59, 999);
            return { startOfWeek: startDay, endOfWeek: endDay };
        }

        const day = start.getDay(); // 0 is Sunday
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { startOfWeek: start, endOfWeek: end };
    }, [currentDate, viewMode]);

    const changePeriod = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    const isCurrentPeriod = useMemo(() => {
        const today = new Date();
        if (viewMode === 'day') {
            return today.toDateString() === currentDate.toDateString();
        }
        return today >= startOfWeek && today <= endOfWeek;
    }, [startOfWeek, endOfWeek, currentDate, viewMode]);

    const filteredHistory = useMemo(() => {
        return history.filter((item: any) => {
            const itemDate = new Date(item.date);
            // Ensure we handle 'Hoy' if present (though 'Hoy' usually means today's date in history creation)
            // But usually history stores ISO date string. Assuming item.date is YYYY-MM-DD or ISO.
            // If item.date is 'Hoy', we map it to today.
            const dateToCheck = item.date === 'Hoy' ? new Date() : itemDate;

            return dateToCheck >= startOfWeek && dateToCheck <= endOfWeek;
        });
    }, [history, startOfWeek, endOfWeek]);

    const stats = useMemo(() => {
        const targetChildren = selectedChildId
            ? children.filter((c: any) => c.id === selectedChildId)
            : children;

        return targetChildren.map((child: any) => {
            const childHistory = filteredHistory.filter((h: any) => h.assignedTo === child.id);
            const totalPoints = childHistory.reduce((acc: any, curr: any) => acc + (curr.status === 'verified' ? curr.points : 0), 0);

            // Active Tasks (Only relevant for "Today" view effectively, or generally pending)
            // But if we are looking at Past Week, pending tasks aren't historically there, they are currently pending.
            // We'll show pending tasks only if viewing Current Week or Today.
            const isLatest = new Date() <= endOfWeek;

            const activePending = isLatest ? tasks.filter((t: any) => t.assignedTo === child.id && t.status === 'pending') : [];
            const activeWaiting = isLatest ? tasks.filter((t: any) => t.assignedTo === child.id && t.status === 'completed') : [];

            // Filter active by date if Day Mode? 
            // If Day Mode is "Yesterday", active tasks (which are current) don't belong there usually, 
            // unless they were created yesterday? Hard to track "pending yesterday". 
            // For simplicity: Pending tasks show up if visualizing "Today" or containing week.
            const showActive = isCurrentPeriod;

            const pending = showActive ? activePending.length : 0;
            const waiting = showActive ? activeWaiting.length : 0;

            // Map active to history format for display
            const pendingAsHistory = showActive ? activePending.map((t: any) => ({
                id: t.id,
                taskTitle: t.title,
                status: 'pending',
                date: 'Hoy',
                points: t.points || 0
            })) : [];

            const waitingAsHistory = showActive ? activeWaiting.map((t: any) => ({
                id: t.id,
                taskTitle: t.title,
                status: 'completed',
                date: 'Hoy',
                points: t.points || 0
            })) : [];

            const combinedActivity = [...childHistory, ...pendingAsHistory, ...waitingAsHistory];

            // Basic Stats
            const completed = childHistory.filter((h: any) => h.status === 'verified').length;
            const missed = childHistory.filter((h: any) => h.status === 'missed').length;

            // Punishment Logic (Week based)
            let punishmentWarning = false;
            let missedCount = 0;
            if (viewMode === 'week') {
                missedCount = childHistory.filter((h: any) => h.status === 'missed' && h.isResponsibility).length;
                punishmentWarning = missedCount > 5;
            }

            return {
                child,
                totalPoints,
                completed,
                waiting,
                missed,
                pending,
                history: combinedActivity,
                punishmentWarning,
                missedCount
            };
        });
    }, [filteredHistory, children, selectedChildId, tasks, isCurrentPeriod, viewMode, endOfWeek]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    // Helper for date string format for DatePicker
    const toDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const Container = isEmbedded ? View : SafeAreaView;

    return (
        <Container className="flex-1 bg-gray-50 dark:bg-slate-900">
            {!isEmbedded && (
                <View className="p-6 bg-white dark:bg-slate-800 shadow-sm flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Estadísticas</Text>
                    <Button title="Cerrar" size="sm" variant="outline" onPress={() => navigation.goBack()} />
                </View>
            )}

            <View className="px-6 pt-4 flex-row justify-between items-center bg-gray-50 dark:bg-slate-900">
                {/* View Mode Toggle */}
                <View className="flex-row bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                    <TouchableOpacity
                        onPress={() => setViewMode('week')}
                        className={`px-4 py-2 rounded-md ${viewMode === 'week' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                    >
                        <Text className={`font-bold ${viewMode === 'week' ? 'text-indigo-600 dark:text-white' : 'text-gray-500'}`}>Semana</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('day')}
                        className={`px-4 py-2 rounded-md ${viewMode === 'day' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                    >
                        <Text className={`font-bold ${viewMode === 'day' ? 'text-indigo-600 dark:text-white' : 'text-gray-500'}`}>Día</Text>
                    </TouchableOpacity>
                </View>

                {/* Date Picker for Day Mode */}
                {viewMode === 'day' && (
                    <DatePicker
                        value={toDateString(currentDate)}
                        onChange={(d) => {
                            if (d) {
                                const [y, m, day] = d.split('-').map(Number);
                                setCurrentDate(new Date(y, m - 1, day));
                            }
                        }}
                    />
                )}
            </View>

            {/* Child Filter (Only show if Parent) */}
            {!isChildView && (
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
            )}

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                {/* Navigator */}
                <Card className="mb-6 p-4 bg-white flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => changePeriod('prev')}
                        className="p-2 bg-gray-100 rounded-full"
                    >
                        <Text className="text-gray-600 font-bold">◀</Text>
                    </TouchableOpacity>

                    <View className="items-center">
                        <Text className="text-gray-500 text-xs font-bold uppercase mb-1">
                            {viewMode === 'week' ? 'Semana del' : 'Viendo el'}
                        </Text>
                        <Text className="text-lg font-bold text-indigo-600">
                            {viewMode === 'week'
                                ? `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`
                                : formatDate(startOfWeek) // startOfWeek === the day
                            }
                        </Text>
                        {isCurrentPeriod && (
                            <Text className="text-xs text-green-600 font-bold mt-1">
                                {viewMode === 'week' ? 'Semana Actual' : 'Hoy'}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => changePeriod('next')}
                        className="p-2 bg-gray-100 rounded-full"
                    >
                        <Text className="text-gray-600 font-bold">▶</Text>
                    </TouchableOpacity>
                </Card>

                {stats.map(({ child, totalPoints, completed, waiting, missed, pending, history, punishmentWarning, missedCount }) => (
                    <View key={child.id} className="mb-8 border-b-2 border-gray-100 pb-8 last:border-0">
                        <Text className="text-xl font-bold text-gray-800 mb-4">Progreso de {child.name}</Text>

                        {/* Bonus / Punishment Status (Only show in Week View as it's a weekly metric usually) */}
                        {viewMode === 'week' && (
                            punishmentWarning ? (
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
                            )
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
                            <Text className="text-center text-gray-400 italic py-4">No hay actividad en este periodo.</Text>
                        ) : (
                            // Group by date if Week View
                            (() => {
                                const sortedHistory = history.slice().sort((a, b) => {
                                    const dateA = a.date === 'Hoy' ? new Date() : new Date(a.date);
                                    const dateB = b.date === 'Hoy' ? new Date() : new Date(b.date);
                                    return dateB.getTime() - dateA.getTime();
                                });

                                // Render logic
                                return sortedHistory.map((item, index) => {
                                    // Date Header Logic
                                    const showHeader = viewMode === 'week' && (index === 0 || sortedHistory[index - 1].date !== item.date);

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
                                        <View key={item.id}>
                                            {showHeader && (
                                                <View className="mt-4 mb-2 border-b border-gray-200 pb-1">
                                                    <Text className="text-gray-400 font-bold text-xs uppercase">
                                                        {(() => {
                                                            if (item.date === 'Hoy') return 'HOY';
                                                            const d = new Date(item.date);
                                                            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                                                            // Adjust because new Date("YYYY-MM-DD") might result in UTC, while we often want local date.
                                                            // If item.dateCreated is stored as string already, we assume it's stable.
                                                            // However, usually we might run into TZ issues. Use simple getDay() + 1 if needed, or stick to standard.
                                                            // A safer way for "YYYY-MM-DD" string to day index without timezone shift is splitting.
                                                            const [y, m, da] = item.date.split('-').map(Number);
                                                            const localDate = new Date(y, m - 1, da);
                                                            const dayName = days[localDate.getDay()];
                                                            return `${dayName}, ${item.date}`;
                                                        })()}
                                                    </Text>
                                                </View>
                                            )}
                                            <View className="mb-3 flex-row items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
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
                                        </View>
                                    )
                                });
                            })()
                        )}
                    </View>
                ))}
            </ScrollView>
        </Container>
    );
}
