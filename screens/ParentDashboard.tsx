import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';
import { MonitoringTab } from '../components/dashboard/MonitoringTab';
import { AssignmentTab } from '../components/dashboard/AssignmentTab';
import { FamilyTab } from '../components/dashboard/FamilyTab';
import { MessagesTab } from '../components/dashboard/MessagesTab';
import { RewardsTab } from '../components/dashboard/RewardsTab';
import { SettingsTab } from '../components/dashboard/SettingsTab';
import { ScheduleModal } from '../components/ScheduleModal';


export default function ParentDashboard({ navigation }: any) {
    const { currentUser, logout, tasks, redemptions, t } = useTaskContext();
    const [currentTab, setCurrentTab] = useState<'monitoring' | 'assignment' | 'messages' | 'family' | 'rewards' | 'settings'>('monitoring');
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);

    const confirmLogout = () => {
        logout();
    };

    return (
        <SafeAreaView className="flex-1 bg-brand-cream dark:bg-brand-dark">
            <View className="flex-1">
                {/* Header */}
                {/* Header */}
                <View className="px-6 py-4 flex-row justify-between items-center bg-brand-primary dark:bg-brand-dark shadow-sm">
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                        <Image
                            source={require('../assets/task_logo_final.png')} // eslint-disable-line @typescript-eslint/no-require-imports
                            className="w-12 h-12 rounded-full border-2 border-white/30"
                            style={{ width: 44, height: 44 }}
                            resizeMode="cover"
                        />
                        <View className="flex-1">
                            <Text className="text-orange-100 text-xs font-medium" numberOfLines={1}>{t('header.greeting')}</Text>
                            <Text className="text-xl font-bold text-white dark:text-brand-text-light" numberOfLines={1} adjustsFontSizeToFit>{currentUser?.name}</Text>
                        </View>
                    </View>
                    <View className="flex-row gap-2 items-center flex-shrink-0">

                        <Button
                            title={t('header.stats')}
                            variant="secondary"
                            size="sm"
                            onPress={() => navigation.navigate('Statistics')}
                            className="bg-white/20 shadow-none px-3"
                            textClassName="text-white text-xs"
                        />
                        <Button
                            title={t('header.schedule')}
                            variant="secondary"
                            size="sm"
                            onPress={() => setScheduleModalVisible(true)}
                            className="bg-white/20 shadow-none px-3"
                            textClassName="text-white text-xs"
                        />
                        <Button
                            title={t('header.logout')}
                            variant="outline"
                            size="sm"
                            onPress={confirmLogout}
                            className="border-white/40 px-3"
                            textClassName="text-white text-xs"
                            style={{ backgroundColor: 'transparent' }}
                        />
                    </View>
                </View>

                {/* Tab Switcher */}
                <View className="border-b border-gray-200">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 16 }}>
                        <TouchableOpacity onPress={() => setCurrentTab('monitoring')} className="relative">
                            <Text className={`text-lg font-bold ${currentTab === 'monitoring' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
                                {t('tabs.monitoring')}
                            </Text>
                            {tasks.filter(t => t.status === 'completed').length > 0 && (
                                <View className="absolute -top-2 -right-3 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
                                    <Text className="text-white text-xs font-bold">{tasks.filter(t => t.status === 'completed').length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('assignment')}>
                            <Text className={`text-lg font-bold ${currentTab === 'assignment' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
                                {t('tabs.assignment')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('family')}>
                            <Text className={`text-lg font-bold ${currentTab === 'family' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
                                {t('tabs.family')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('messages')}>
                            <Text className={`text-lg font-bold ${currentTab === 'messages' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
                                {t('tabs.messages')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setCurrentTab('rewards')} className="relative">
                            <Text className={`text-lg font-bold ${currentTab === 'rewards' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
                                {t('tabs.rewards')}
                            </Text>
                            {redemptions.filter(r => r.status === 'pending').length > 0 && (
                                <View className="absolute -top-2 -right-3 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
                                    <Text className="text-white text-xs font-bold">{redemptions.filter(r => r.status === 'pending').length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('settings')}>
                            <Text className={`text-lg font-bold ${currentTab === 'settings' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
                                {t('tabs.settings')}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Content Area */}
                <View className="flex-1">
                    {currentTab === 'monitoring' && <MonitoringTab />}
                    {currentTab === 'assignment' && <AssignmentTab />}
                    {currentTab === 'family' && <FamilyTab />}
                    {currentTab === 'messages' && <MessagesTab />}
                    {currentTab === 'rewards' && <RewardsTab />}
                    {currentTab === 'settings' && <SettingsTab />}

                </View>
            </View>
            <ScheduleModal visible={scheduleModalVisible} onClose={() => setScheduleModalVisible(false)} />
        </SafeAreaView >
    );
}
