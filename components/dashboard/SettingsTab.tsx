import React from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { Card } from '../ui/Card';

export const SettingsTab = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigation = useNavigation<any>();
    const { globalSettings, updateGlobalSettings } = useTaskContext();

    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-slate-900 p-4">
            {/* Vacation Mode Section */}
            <Card className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">🏖️</Text>
                        <View>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">Modo Vacaciones</Text>
                            <Text className="text-gray-500 text-xs">Pausa todas las tareas escolares para todos.</Text>
                        </View>
                    </View>
                    <Switch
                        value={globalSettings?.isVacationMode || false}
                        onValueChange={(val) => updateGlobalSettings({ isVacationMode: val })}
                        trackColor={{ false: "#e5e7eb", true: "#fdba74" }}
                        thumbColor={globalSettings?.isVacationMode ? "#f97316" : "#f4f3f4"}
                    />
                </View>
            </Card>

            {/* School Calendar Section */}
            <Card className="mb-4">
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">📅</Text>
                        <View>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">Calendario Escolar</Text>
                            <Text className="text-gray-500 text-xs">Gestiona feriados y días sin clases.</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate('SchoolCalendar')}
                    className="flex-row items-center justify-between bg-orange-50 p-4 rounded-xl border border-orange-200 active:bg-orange-100"
                >
                    <View>
                        <Text className="font-bold text-orange-800">Gestionar Días No Escolares</Text>
                        <Text className="text-orange-600 text-xs mt-1">
                            {globalSettings?.nonSchoolDays?.length || 0} fechas configuradas
                        </Text>
                    </View>
                    <Text className="text-orange-500 text-xl">→</Text>
                </TouchableOpacity>

                <View className="mt-4">
                    <Text className="text-gray-500 text-xs mb-2">Próximos días sin escuela:</Text>
                    {globalSettings?.nonSchoolDays && globalSettings.nonSchoolDays.length > 0 ? (
                        <View className="flex-row flex-wrap gap-2">
                            {globalSettings.nonSchoolDays
                                .sort((a, b) => a.date.localeCompare(b.date))
                                .filter(d => d.date >= new Date().toISOString().split('T')[0])
                                .slice(0, 5) // Show next 5
                                .map((day) => (
                                    <View key={day.date} className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                        <Text className="text-gray-600 text-xs">{day.date}</Text>
                                    </View>
                                ))
                            }
                            {globalSettings.nonSchoolDays.filter(d => d.date >= new Date().toISOString().split('T')[0]).length === 0 && (
                                <Text className="text-gray-400 italic text-xs">No hay fechas futuras configuradas.</Text>
                            )}
                        </View>
                    ) : (
                        <Text className="text-gray-400 italic text-xs">Ninguna fecha configurada.</Text>
                    )}
                </View>
            </Card>

            {/* Timezone Section */}
            <Card className="mb-4">
                <View className="flex-row items-center gap-2 mb-2">
                    <Text className="text-2xl">🌎</Text>
                    <View>
                        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">Zona Horaria</Text>
                        <Text className="text-gray-500 text-xs">Define la hora para el cálculo de &quot;Hoy&quot;.</Text>
                    </View>
                </View>

                <View className="flex-row flex-wrap gap-2 mt-2">
                    {[
                        { id: 'America/Chicago', label: 'Dallas (Central US)' },
                        { id: 'America/Mexico_City', label: 'CDMX (Central MX)' },
                        { id: 'America/New_York', label: 'New York (Eastern)' },
                        { id: 'America/Los_Angeles', label: 'Los Angeles (Pacific)' }
                    ].map(tz => (
                        <TouchableOpacity
                            key={tz.id}
                            onPress={() => updateGlobalSettings({ timezone: tz.id })}
                            className={`px-3 py-2 rounded-lg border ${(globalSettings?.timezone || 'America/Chicago') === tz.id ? 'bg-indigo-100 border-indigo-500' : 'bg-gray-50 border-gray-200'}`}
                        >
                            <Text className={`text-xs ${(globalSettings?.timezone || 'America/Chicago') === tz.id ? 'text-indigo-700 font-bold' : 'text-gray-600'}`}>
                                {tz.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text className="text-xs text-gray-400 mt-2">Configuración actual: {globalSettings?.timezone || 'America/Chicago'}</Text>
            </Card>

            {/* Future Settings Placeholders */}
            <Card className="mb-4 opacity-50">
                <View className="flex-row items-center gap-2 mb-2">
                    <Text className="text-2xl">⚙️</Text>
                    <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">Más Configuraciones</Text>
                </View>
                <Text className="text-gray-400 text-sm">Próximamente: Gestión de usuarios, notificaciones avanzadas, etc.</Text>
            </Card>

        </ScrollView>
    );
};
