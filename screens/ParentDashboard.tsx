import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';
import { MonitoringTab } from '../components/dashboard/MonitoringTab';
import { AssignmentTab } from '../components/dashboard/AssignmentTab';
import { FamilyTab } from '../components/dashboard/FamilyTab';
import { MessagesTab } from '../components/dashboard/MessagesTab';
import { RewardsTab } from '../components/dashboard/RewardsTab';

export default function ParentDashboard({ navigation }: any) {
    const { currentUser, logout, tasks, redemptions } = useTaskContext();
    const [currentTab, setCurrentTab] = useState<'monitoring' | 'assignment' | 'messages' | 'family' | 'rewards'>('monitoring');

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
        <SafeAreaView className="flex-1 bg-brand-cream dark:bg-brand-dark">
            <View className="flex-1">
                {/* Header */}
                <View className="p-6 flex-row justify-between items-center bg-white dark:bg-brand-dark shadow-sm pt-12">
                    <View>
                        <Text className="text-sm text-gray-500 font-medium">Hola,</Text>
                        <Text className="text-2xl font-bold text-brand-text-primary dark:text-brand-text-light">{currentUser?.name}</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <Button title="📊 Stats" variant="secondary" size="sm" onPress={() => navigation.navigate('Statistics')} />
                        <Button title="Salir" variant="outline" size="sm" onPress={confirmLogout} />
                    </View>
                </View>

                {/* Tab Switcher */}
                <View className="border-b border-gray-200">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 16 }}>
                        <TouchableOpacity onPress={() => setCurrentTab('monitoring')} className="relative">
                            <Text className={`text-lg font-bold ${currentTab === 'monitoring' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'}`}>
                                Seguimiento
                            </Text>
                            {tasks.filter(t => t.status === 'completed').length > 0 && (
                                <View className="absolute -top-2 -right-3 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
                                    <Text className="text-white text-xs font-bold">{tasks.filter(t => t.status === 'completed').length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('assignment')}>
                            <Text className={`text-lg font-bold ${currentTab === 'assignment' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'}`}>
                                Banco
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('family')}>
                            <Text className={`text-lg font-bold ${currentTab === 'family' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'}`}>
                                Familia
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('messages')}>
                            <Text className={`text-lg font-bold ${currentTab === 'messages' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'}`}>
                                Mensajes
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('rewards')} className="relative">
                            <Text className={`text-lg font-bold ${currentTab === 'rewards' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'}`}>
                                Premios
                            </Text>
                            {redemptions.filter(r => r.status === 'pending').length > 0 && (
                                <View className="absolute -top-2 -right-3 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
                                    <Text className="text-white text-xs font-bold">{redemptions.filter(r => r.status === 'pending').length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Content Area */}
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    {currentTab === 'monitoring' && <MonitoringTab />}
                    {currentTab === 'assignment' && <AssignmentTab />}
                    {currentTab === 'family' && <FamilyTab />}
                    {currentTab === 'messages' && <MessagesTab />}
                    {currentTab === 'rewards' && <RewardsTab />}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
