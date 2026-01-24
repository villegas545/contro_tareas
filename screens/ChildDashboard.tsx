import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, Alert, Modal, TouchableOpacity, Platform, ScrollView, Image } from 'react-native';
import { useTaskContext } from '../context/TaskContext';

import { Task, Reward } from '../types';
import { Button } from '../components/ui/Button';
import { AdvancedFilterControls } from '../components/ui/AdvancedFilterControls';
import { ChildTaskCard } from '../components/ChildTaskCard';
import StatisticsScreen from './StatisticsScreen';

export default function ChildDashboard({ navigation }: any) {
    const { currentUser, tasks, history, completeTask, logout, messages, rewards, redeemReward, redemptions, isTaskActiveToday, categories, t } = useTaskContext();
    const [messageModalVisible, setMessageModalVisible] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [canClose, setCanClose] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [currentTab, setCurrentTab] = useState<'tasks' | 'store' | 'history'>('tasks');

    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'verified'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'responsibility' | 'extra' | 'school'>('all');
    const [searchText, setSearchText] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const myTasks = tasks
        .filter(t => t.assignedTo === currentUser?.id && (isTaskActiveToday ? isTaskActiveToday(t) : true))
        .filter(t => {
            if (searchText && !t.title.toLowerCase().includes(searchText.toLowerCase())) return false;
            if (statusFilter !== 'all' && t.status !== statusFilter) return false;
            if (typeFilter === 'responsibility') return t.type === 'obligatory';
            if (typeFilter === 'extra') return t.type === 'additional';
            if (typeFilter === 'school') return t.isSchool;
            return true;
        })
        .sort((a, b) => a.title.localeCompare(b.title));
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

                // Helper to format 12h
                const to12h = (time24: string) => {
                    const [h, m] = time24.split(':');
                    let hours = parseInt(h);
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    return `${hours}:${m} ${ampm}`;
                };

                const start12 = to12h(task.timeWindow.start);
                const end12 = to12h(task.timeWindow.end);

                if (Platform.OS === 'web') {
                    window.alert(t('child_flow.time_window_alert_msg').replace('{start}', start12).replace('{end}', end12));
                } else {
                    Alert.alert(t('child_flow.time_window_alert_title'), t('child_flow.time_window_alert_msg').replace('{start}', start12).replace('{end}', end12));
                }
                return;
            }
        }

        // Due Date Check
        if (task.dueDate && task.status !== 'completed') {
            const dueDate = new Date(task.dueDate);
            // Allow completion anytime ON the due date (set to 23:59:59)
            // Note: task.dueDate string is usually YYYY-MM-DD. new Date(s) might be UTC or Local.
            // We assume it maps to the correct day. To be safe, we rely on string comparison first or ensure end of day.
            // If we adjust local date:
            if (!task.dueDate.includes('T')) {
                // It's a date string, treat as local day end
                const [y, m, d] = task.dueDate.split('-').map(Number);
                dueDate.setFullYear(y);
                dueDate.setMonth(m - 1);
                dueDate.setDate(d);
                dueDate.setHours(23, 59, 59, 999);
            } else {
                // If it has time, leave as is? Assuming dueDate is just date.
                dueDate.setHours(23, 59, 59, 999);
            }

            if (dueDate < new Date()) {
                if (Platform.OS === 'web') {
                    window.alert(t('child_flow.expired_alert_msg'));
                } else {
                    Alert.alert(t('child_flow.expired_alert_title'), t('child_flow.expired_alert_msg'));
                }
                return;
            }
        }

        const proceed = async () => {
            try {
                await completeTask(task.id, evidenceUrl);
            } catch (e: any) {
                if (Platform.OS === 'web') window.alert(e.message);
                else Alert.alert(t('common.error'), e.message);
            }
        };

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(t('child_flow.complete_confirm_msg'));
            if (confirmed) proceed();
        } else {
            // If evidence (photo) is provided, we skip the second confirmation because 
            // taking a photo is already a strong intentional action.
            if (evidenceUrl) {
                proceed();
            } else {
                Alert.alert(
                    t('child_flow.complete_confirm_title'),
                    t('child_flow.complete_confirm_msg'),
                    [
                        { text: t('common.cancel'), style: "cancel" },
                        {
                            text: t('child_flow.complete_confirm_yes'),
                            onPress: proceed
                        }
                    ]
                );
            }
        }
    };

    const handleRedeem = (reward: Reward) => {
        if (myPoints < reward.cost) {
            Alert.alert(t('child_flow.redeem_insufficient_title'), t('child_flow.redeem_insufficient_msg'));
            return;
        }

        const proceed = () => {
            redeemReward({
                rewardId: reward.id,
                rewardTitle: reward.title,
                childId: currentUser?.id || '',
                cost: reward.cost
            });
            Alert.alert(t('child_flow.redeem_success_title'), t('child_flow.redeem_success_msg'));
        };

        if (Platform.OS === 'web') {
            if (window.confirm(t('child_flow.redeem_confirm_msg').replace('{reward}', reward.title).replace('{cost}', reward.cost.toString()))) proceed();
        } else {
            Alert.alert(
                t('child_flow.redeem_confirm_title'),
                t('child_flow.redeem_confirm_msg').replace('{reward}', reward.title).replace('{cost}', reward.cost.toString()),
                [
                    { text: t('common.cancel'), style: "cancel" },
                    { text: t('child_flow.redeem_confirm_yes'), onPress: proceed }
                ]
            );
        }
    };

    const renderTask = ({ item }: { item: Task }) => (
        <ChildTaskCard item={item} onComplete={handleComplete} />
    );

    const confirmLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm(t('child_flow.logout_confirm_msg'))) {
                logout();
            }
        } else {
            Alert.alert(
                t('child_flow.logout_confirm_title'),
                t('child_flow.logout_confirm_msg'),
                [
                    { text: t('common.cancel'), style: "cancel" },
                    { text: t('header.logout'), onPress: logout }
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
                <View className="flex-row items-center gap-3">
                    <Image
                        source={require('../assets/task_logo_final.png')} // eslint-disable-line @typescript-eslint/no-require-imports
                        className="w-14 h-14 rounded-full border-2 border-white/20"
                        style={{ width: 56, height: 56 }}
                        resizeMode="cover"
                    />
                    <View>
                        <Text className="text-white text-lg font-medium opacity-90">{t('header.greeting')} {currentUser?.name} 👋</Text>
                        <Text className="text-white text-3xl font-bold mt-1">{myPoints} {t('stats.points')} ⭐️</Text>
                        <Text className="text-emerald-300 text-lg font-bold mt-1">
                            💰 ${(currentUser?.walletBalance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
                <Button title={t('header.logout')} variant="secondary" size="sm" onPress={confirmLogout} className="bg-white/20" />
            </View>

            {/* Tab Switcher */}
            <View className="flex-row mx-6 mb-4 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm">
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg items-center ${currentTab === 'tasks' ? 'bg-indigo-100 dark:bg-indigo-900' : ''}`}
                    onPress={() => setCurrentTab('tasks')}
                >
                    <Text className={`font-bold ${currentTab === 'tasks' ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500'}`}>📝 {t('child.tabs.tasks')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg items-center ${currentTab === 'store' ? 'bg-amber-100 dark:bg-amber-900' : ''}`}
                    onPress={() => setCurrentTab('store')}
                >
                    <Text className={`font-bold ${currentTab === 'store' ? 'text-amber-600 dark:text-amber-300' : 'text-gray-500'}`}>🛍️ {t('child.tabs.store')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg items-center ${currentTab === 'history' ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                    onPress={() => setCurrentTab('history')}
                >
                    <Text className={`font-bold ${currentTab === 'history' ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500'}`}>📊 {t('child.tabs.history')}</Text>
                </TouchableOpacity>
            </View>

            {currentTab === 'tasks' ? (
                <>
                    <View className="px-6 py-2 border-b border-gray-100 dark:border-gray-800">
                        <AdvancedFilterControls
                            showFilters={showFilters}
                            setShowFilters={setShowFilters}
                            searchText={searchText}
                            setSearchText={setSearchText}
                            searchPlaceholder="Buscar tarea..."
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            statusOptions={[
                                { id: 'all', label: t('filter.all') },
                                { id: 'pending', label: t('status.pending') },
                                { id: 'completed', label: t('status.completed_msg') },
                                { id: 'verified', label: t('status.verified') },
                            ]}
                            typeFilter={typeFilter}
                            setTypeFilter={setTypeFilter}
                        />
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                        {myTasks.length === 0 ? (
                            <View className="items-center justify-center py-10">
                                <Text className="text-6xl mb-4">🎉</Text>
                                <Text className="text-gray-500 text-lg text-center dark:text-gray-400">{t('child.no_tasks')}</Text>
                                <Text className="text-gray-400 text-center mt-2 dark:text-gray-500">{t('child.no_tasks_desc')}</Text>
                            </View>
                        ) : (
                            (() => {
                                // 1. Map Categories to Sections
                                const categorySections = categories.map(cat => ({
                                    id: cat.id,
                                    title: `${cat.icon} ${cat.name}`,
                                    bg: 'bg-white',
                                    border: 'border-gray-200',
                                    text: 'text-gray-800'
                                }));

                                // 2. Add "No Category"
                                categorySections.push({
                                    id: 'uncategorized',
                                    title: '📂 General',
                                    bg: 'bg-gray-50',
                                    border: 'border-gray-200',
                                    text: 'text-gray-600'
                                });

                                return categorySections.map(section => {
                                    const sectionTasks = myTasks.filter(t =>
                                        section.id === 'uncategorized'
                                            ? !t.categoryId || !categories.find(c => c.id === t.categoryId)
                                            : t.categoryId === section.id
                                    );

                                    if (sectionTasks.length === 0) return null;

                                    const isExpanded = expandedCategories[section.id] ?? true;

                                    return (
                                        <View key={section.id} className="mb-4">
                                            <TouchableOpacity
                                                onPress={() => setExpandedCategories(prev => ({ ...prev, [section.id]: !isExpanded }))}
                                                className={`flex-row justify-between items-center p-3 rounded-xl border ${section.bg} ${section.border} mb-2 shadow-sm bg-white`}
                                            >
                                                <View className="flex-row items-center gap-2 flex-1 mr-2">
                                                    <Text className={`font-bold ${section.text} text-lg mr-2`}>{section.title}</Text>
                                                    {(() => {
                                                        const pending = sectionTasks.filter(t => t.status === 'pending').length;
                                                        const completed = sectionTasks.filter(t => t.status === 'completed').length;
                                                        const verified = sectionTasks.filter(t => t.status === 'verified').length;
                                                        const total = sectionTasks.length;

                                                        return (
                                                            <View className="flex-col gap-0 items-start ml-auto">
                                                                {pending === 0 && total > 0 ? (
                                                                    <Text className="text-green-600 font-bold">{t('status.completed_msg')}</Text>
                                                                ) : (
                                                                    <>
                                                                        <Text className="text-[10px] text-red-500 font-bold">{String(pending)} {t('status.pending')}</Text>
                                                                        <Text className="text-[10px] text-orange-500 font-bold">{String(completed)} {t('status.in_review')}</Text>
                                                                        <Text className="text-[10px] text-green-600 font-bold">{String(verified)} {t('status.verified')}</Text>
                                                                    </>
                                                                )}
                                                            </View>
                                                        );
                                                    })()}
                                                </View>
                                                <Text className="text-gray-400">{isExpanded ? '▼' : '▶'}</Text>
                                            </TouchableOpacity>

                                            {isExpanded && (
                                                <View className="gap-4">
                                                    {sectionTasks.map(item => (
                                                        <ChildTaskCard key={item.id} item={item} onComplete={handleComplete} />
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    );
                                });
                            })()
                        )}
                    </ScrollView>
                </>
            ) : currentTab === 'history' ? (
                <View className="flex-1">
                    <StatisticsScreen embedded={true} navigation={navigation} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                    {myRedemptionRequests.length > 0 && (
                        <View className="mb-6">
                            <Text className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">{t('child.pending_requests')}</Text>
                            {myRedemptionRequests.map(req => (
                                <View key={req.id} className="bg-amber-50 dark:bg-gray-800 border border-amber-200 dark:border-amber-900 p-4 rounded-xl mb-2 flex-row justify-between items-center">
                                    <Text className="font-medium text-gray-800 dark:text-gray-200">{req.rewardTitle}</Text>
                                    <Text className="text-amber-600 font-bold">-{req.cost} pts</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">{t('child.available_rewards')}</Text>
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

                                    {!canAfford && (
                                        <View className="absolute inset-0 bg-white/60 dark:bg-black/60 justify-center items-center rounded-xl">
                                            <Text className="text-2xl">🔒</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                    {rewards.length === 0 && (
                        <Text className="text-gray-400 text-center py-10">{t('child.ask_parents')}</Text>
                    )}
                </ScrollView>
            )
            }

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
        </SafeAreaView >
    );
}
