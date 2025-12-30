import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform, Switch, Image, Animated, Easing } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';
import { MonitoringTab } from '../components/dashboard/MonitoringTab';
import { AssignmentTab } from '../components/dashboard/AssignmentTab';
import { FamilyTab } from '../components/dashboard/FamilyTab';
import { MessagesTab } from '../components/dashboard/MessagesTab';
import { RewardsTab } from '../components/dashboard/RewardsTab';

export default function ParentDashboard({ navigation }: any) {
    const { currentUser, logout, tasks, updateUser, redemptions, users } = useTaskContext();
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
                <View className="p-6 flex-row justify-between items-center bg-brand-primary dark:bg-brand-dark shadow-sm pt-12">
                    <View>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-sm text-orange-50 font-medium">Hola,</Text>
                            <Image
                                source={require('../assets/task_logo_final.png')}
                                className="w-10 h-10 rounded-full border-2 border-white/30"
                                style={{ width: 40, height: 40 }}
                                resizeMode="cover"
                            />
                        </View>
                        <Text className="text-2xl font-bold text-white dark:text-brand-text-light">{currentUser?.name}</Text>
                    </View>
                    <View className="flex-row gap-2 items-center">
                        <View className="items-center mr-2">
                            <Text className="text-[10px] text-orange-50 font-bold uppercase mb-1">Vacaciones</Text>
                            <Switch
                                value={currentUser?.isVacationMode || false}
                                onValueChange={(val) => {
                                    users.filter(u => u.role === 'parent').forEach(p => {
                                        updateUser(p.id, { isVacationMode: val });
                                    });
                                }}
                                trackColor={{ false: "rgba(255,255,255,0.3)", true: "#fff" }}
                                thumbColor={currentUser?.isVacationMode ? "#f97316" : "#f4f3f4"}
                                style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }}
                            />
                        </View>
                        <Button
                            title="📊 Stats"
                            variant="secondary"
                            size="sm"
                            onPress={() => navigation.navigate('Statistics')}
                            className="bg-white/20 shadow-none"
                            textClassName="text-white"
                        />
                        <Button
                            title="Salir"
                            variant="outline"
                            size="sm"
                            onPress={confirmLogout}
                            className="border-white/40"
                            textClassName="text-white"
                        />
                    </View>
                </View>

                {/* Tab Switcher */}
                <View className="border-b border-gray-200">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 16 }}>
                        <TouchableOpacity onPress={() => setCurrentTab('monitoring')} className="relative">
                            <Text className={`text - lg font - bold ${currentTab === 'monitoring' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
                                Seguimiento
                            </Text>
                            {tasks.filter(t => t.status === 'completed').length > 0 && (
                                <View className="absolute -top-2 -right-3 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
                                    <Text className="text-white text-xs font-bold">{tasks.filter(t => t.status === 'completed').length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('assignment')}>
                            <Text className={`text - lg font - bold ${currentTab === 'assignment' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
                                Plantillas
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('family')}>
                            <Text className={`text - lg font - bold ${currentTab === 'family' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
                                Familia
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('messages')}>
                            <Text className={`text - lg font - bold ${currentTab === 'messages' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
                                Mensajes
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentTab('rewards')} className="relative">
                            <Text className={`text - lg font - bold ${currentTab === 'rewards' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400'} `}>
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
                <View className="flex-1">
                    {currentTab === 'monitoring' && <MonitoringTab />}
                    {currentTab === 'assignment' && <AssignmentTab />}
                    {currentTab === 'family' && <FamilyTab />}
                    {currentTab === 'messages' && <MessagesTab />}
                    {currentTab === 'rewards' && <RewardsTab />}
                </View>
            </View>
        </SafeAreaView>
    );
}
