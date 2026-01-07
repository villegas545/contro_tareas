import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTaskContext } from '../context/TaskContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { AdvancedFilterControls } from '../components/ui/AdvancedFilterControls';

export default function StatisticsScreen({ navigation, route, embedded }: any) {
    const { history, users, tasks, currentUser } = useTaskContext();
    const children = users.filter((u: any) => u.role === 'child');

    const isChildView = currentUser?.role === 'child';
    const isEmbedded = embedded || route?.params?.embedded;

    // Week Navigation State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedChildId, setSelectedChildId] = useState<string | null>(isChildView ? currentUser?.id : null);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

    // Advanced Filters State
    const [showFilters, setShowFilters] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'verified' | 'expired'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'responsibility' | 'extra' | 'school'>('all');

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
            let dateToCheck;
            if (item.date === 'Hoy') {
                dateToCheck = new Date();
            } else if (typeof item.date === 'string' && item.date.includes('-')) {
                const [y, m, d] = item.date.split('-').map(Number);
                dateToCheck = new Date(y, m - 1, d);
                // Set to mid-day to avoid boundary issues with simple comparisons? 
                // Actually startOfWeek is 00:00:00 and endOfWeek is 23:59:59.
                // new Date(y, m-1, d) is 00:00:00. This is fine.
            } else {
                dateToCheck = new Date(item.date); // Fallback
            }

            return dateToCheck >= startOfWeek && dateToCheck <= endOfWeek;
        });
    }, [history, startOfWeek, endOfWeek]);

    const stats = useMemo(() => {
        const targetChildren = selectedChildId
            ? children.filter((c: any) => c.id === selectedChildId)
            : children;

        return targetChildren.map((child: any) => {
            // Helper to check filters against an item (History or Task-like)
            const matchesFilters = (item: any) => {
                // Text Search
                if (searchText) {
                    if (!item.taskTitle.toLowerCase().includes(searchText.toLowerCase())) return false;
                }

                // Status Filter
                if (statusFilter !== 'all') {
                    // Normalize item status to filter keys
                    // History: verified, missed
                    // Active: pending, completed(waiting), expired
                    // Filter keys: pending, completed, verified, expired

                    const itemStatus = item.status; // pending, completed, verified, missed/expired?

                    if (statusFilter === 'verified') {
                        if (itemStatus !== 'verified') return false;
                    } else if (statusFilter === 'pending') {
                        if (itemStatus !== 'pending') return false;
                    } else if (statusFilter === 'completed') {
                        // Waiting for review
                        if (itemStatus !== 'completed') return false;
                    } else if (statusFilter === 'expired') {
                        // Missed in history or Expired in active
                        if (itemStatus !== 'missed' && itemStatus !== 'expired') return false;
                    }
                }

                // Type Filter
                if (typeFilter !== 'all') {
                    // Check isResponsibility
                    if (typeFilter === 'responsibility') {
                        if (!item.isResponsibility) return false;
                    } else if (typeFilter === 'extra') {
                        if (item.isResponsibility) return false;
                    } else if (typeFilter === 'school') {
                        // Need to look up original task for 'isSchool' if not in item
                        const original = tasks.find((t: any) => t.id === (item.taskId || item.id));
                        if (!original?.isSchool) return false;
                    }
                }
                return true;
            };

            const childHistory = filteredHistory.filter((h: any) => h.assignedTo === child.id).filter(matchesFilters);

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

            // Map active to history format for display, AND apply filters
            const pendingAsHistory = showActive ? activePending.map((t: any) => ({
                id: t.id,
                taskId: t.id,
                taskTitle: t.title,
                status: 'pending',
                date: 'Hoy',
                points: t.points || 0,
                isResponsibility: t.isResponsibility
            })).filter(matchesFilters) : [];

            const waitingAsHistory = showActive ? activeWaiting.map((t: any) => ({
                id: t.id,
                taskId: t.id,
                taskTitle: t.title,
                status: 'completed',
                date: 'Hoy',
                points: t.points || 0,
                isResponsibility: t.isResponsibility
            })).filter(matchesFilters) : [];

            const combinedActivity = [...childHistory, ...pendingAsHistory, ...waitingAsHistory];

            // Re-calculate Stats based on Filtered Data?
            // Ideally stats should reflect what is SEEN.
            const totalPoints = combinedActivity.reduce((acc: any, curr: any) => acc + (curr.status === 'verified' ? curr.points : 0), 0);

            const completed = combinedActivity.filter((h: any) => h.status === 'verified').length;
            const missed = combinedActivity.filter((h: any) => h.status === 'missed' || h.status === 'expired').length;
            const pending = pendingAsHistory.length;
            const waiting = waitingAsHistory.length;

            // Punishment Logic (Week based)
            // Warning should probably be based on REALITY (Raw), not filtered view.
            // But for UI consistency, let's keep it on raw history for the week.
            const rawChildHistory = filteredHistory.filter((h: any) => h.assignedTo === child.id);
            let punishmentWarning = false;
            let missedCount = 0;
            if (viewMode === 'week') {
                missedCount = rawChildHistory.filter((h: any) => h.status === 'missed' && h.isResponsibility).length;
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
    }, [filteredHistory, children, selectedChildId, tasks, isCurrentPeriod, viewMode, endOfWeek, searchText, statusFilter, typeFilter]);

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

    const exportToCSV = async () => {
        try {
            let csvContent = "Fecha,Nino,Tarea,Estado,Puntos,Tipo,Turno\n";

            stats.forEach((childStat: any) => {
                const childName = childStat.child.name;
                childStat.history.forEach((t: any) => {
                    // map values
                    const date = t.date === 'Hoy' ? new Date().toISOString().split('T')[0] : t.date;
                    const status = t.status === 'verified' ? 'Verificado' :
                        t.status === 'completed' ? 'Completado' :
                            t.status === 'missed' ? 'Fallido' :
                                t.status === 'pending' ? 'Pendiente' : t.status;
                    const points = t.points || 0;
                    const type = t.isResponsibility ? "Responsabilidad" : "Extra";
                    const cleanTitle = (t.taskTitle || "").replace(/,/g, ' ');

                    const shiftMap: Record<string, string> = {
                        morning: 'Mañana',
                        afternoon: 'Tarde',
                        night: 'Noche',
                        'no-time': 'Sin Horario'
                    };
                    const shift = t.shift ? (shiftMap[t.shift] || t.shift) : 'Sin Horario';

                    csvContent += `${date},${childName},${cleanTitle},${status},${points},${type},${shift}\n`;
                });
            });

            const fileName = `reporte_tareas_${new Date().toISOString().split('T')[0]}.csv`;

            if (Platform.OS === 'web') {
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // @ts-ignore
                const fileUri = FileSystem.documentDirectory + fileName;

                // @ts-ignore
                await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    Alert.alert("Error", "Compartir no está disponible en este dispositivo");
                }
            }

        } catch (error) {
            console.error("Export error", error);
            Alert.alert("Error", "No se pudo exportar el archivo");
        }
    };

    const Container = isEmbedded ? View : SafeAreaView;
    const bgColor = isChildView ? 'bg-sky-50' : 'bg-brand-cream';
    const darkBgColor = isChildView ? 'dark:bg-brand-dark' : 'dark:bg-brand-dark';

    return (
        <Container className={`flex-1 ${bgColor} ${darkBgColor}`}>
            {!isEmbedded && (
                <View className={`p-6 bg-white dark:bg-slate-800 shadow-sm flex-row items-center justify-between`}>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Estadísticas</Text>
                    <View className="flex-row gap-2">
                        {!isChildView && (
                            <Button title="📥 CSV" size="sm" variant="secondary" onPress={exportToCSV} />
                        )}
                        <Button title="Cerrar" size="sm" variant="outline" onPress={() => navigation.goBack()} />
                    </View>
                </View>
            )}

            <View className={`px-6 py-2 bg-transparent border-b border-gray-100 dark:border-gray-800`}>
                <AdvancedFilterControls
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    searchPlaceholder="Buscar tarea..."
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    statusOptions={[
                        { id: 'all', label: 'Todos' },
                        { id: 'pending', label: '⏳ Pendientes' },
                        { id: 'completed', label: '✅ Por Revisar' },
                        { id: 'verified', label: '⭐️ Completados' },
                        { id: 'expired', label: '❌ Fallados' },
                    ]}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                >
                    <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Periodo:</Text>
                    <View className="flex-row items-center justify-between mb-4 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                        <View className="flex-row bg-white dark:bg-gray-700 rounded-md p-0.5">
                            <TouchableOpacity
                                onPress={() => setViewMode('week')}
                                className={`px-3 py-1.5 rounded-md ${viewMode === 'week' ? 'bg-indigo-100' : ''}`}
                            >
                                <Text className={`font-bold ${viewMode === 'week' ? 'text-indigo-600' : 'text-gray-500'}`}>Semana</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setViewMode('day')}
                                className={`px-3 py-1.5 rounded-md ${viewMode === 'day' ? 'bg-indigo-100' : ''}`}
                            >
                                <Text className={`font-bold ${viewMode === 'day' ? 'text-indigo-600' : 'text-gray-500'}`}>Día</Text>
                            </TouchableOpacity>
                        </View>

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

                    {/* Child Filter */}
                    {!isChildView && (
                        <>
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

                                {children.map((child: any) => {
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
                        </>
                    )}
                </AdvancedFilterControls>
            </View>

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
                                    <Text className="text-green-400 text-xs font-bold uppercase mt-1">Aprobados</Text>
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
                                const getStatusWeight = (status: string) => {
                                    switch (status) {
                                        case 'completed': return 1; // Waiting for review (High priority)
                                        case 'pending': return 2;   // Still to do
                                        case 'verified': return 3;  // Done
                                        case 'missed': return 4;    // Failed
                                        case 'expired': return 5;
                                        default: return 99;
                                    }
                                };

                                const sortedHistory = history.slice().sort((a: any, b: any) => {
                                    // 1. Sort by Date (Descending)
                                    // Normalize dates for comparison
                                    const getDate = (d: string) => {
                                        if (d === 'Hoy') return new Date();
                                        if (d.includes('-')) {
                                            const [y, m, day] = d.split('-').map(Number);
                                            return new Date(y, m - 1, day);
                                        }
                                        return new Date(d);
                                    };

                                    const dateA = getDate(a.date);
                                    const dateB = getDate(b.date);

                                    // Compare days only? Or full time?
                                    // 'Hoy' includes time. Past dates are 00:00.
                                    // Descending: Newer (Hoy) > Older.
                                    // const timeDiff = dateB.getTime() - dateA.getTime();

                                    // If dates are significantly different (more than a day approx, or just different days)
                                    // We want strict day ordering.
                                    const dayA = dateA.toDateString();
                                    const dayB = dateB.toDateString();

                                    if (dayA !== dayB) {
                                        return dateB.getTime() - dateA.getTime();
                                    }

                                    // 2. Sort by Status
                                    const statusDiff = getStatusWeight(a.status) - getStatusWeight(b.status);
                                    if (statusDiff !== 0) return statusDiff;

                                    // 3. Sort by Title (Alphabetical)
                                    return a.taskTitle.localeCompare(b.taskTitle);
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
                                                            // const d = new Date(item.date);
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

                                                    {/* Tags Row */}
                                                    <View className="flex-row flex-wrap gap-1 mt-1">
                                                        <Text className="text-xs text-gray-400 mr-2">{item.date === 'Hoy' ? 'Hoy' : item.date}</Text>

                                                        {item.isResponsibility !== undefined && (
                                                            <Text className={`text-[10px] px-1.5 py-0.5 rounded font-bold overflow-hidden ${item.isResponsibility ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {item.isResponsibility ? 'Bono' : 'Extra'}
                                                            </Text>
                                                        )}

                                                        {(() => {
                                                            const originalTask = tasks.find((t: any) => t.id === item.taskId);
                                                            if (!originalTask) return null;
                                                            return (
                                                                <>
                                                                    {originalTask.frequency && (
                                                                        <Text className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold overflow-hidden capitalize">
                                                                            {originalTask.frequency === 'daily' ? 'Diario' : originalTask.frequency === 'weekly' ? 'Semanal' : 'Una Vez'}
                                                                        </Text>
                                                                    )}
                                                                    {originalTask.isSchool && (
                                                                        <Text className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold overflow-hidden">
                                                                            Escolar
                                                                        </Text>
                                                                    )}
                                                                    {originalTask.timeWindow && (
                                                                        <Text className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold overflow-hidden">
                                                                            {originalTask.timeWindow.start}-{originalTask.timeWindow.end}
                                                                        </Text>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </View>
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
