import React from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { Card } from '../ui/Card';

export const SettingsTab = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigation = useNavigation<any>();
    const { globalSettings, updateGlobalSettings, language, setLanguage, t, regenerateWeek } = useTaskContext();

    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-slate-900 p-4">
            {/* Language Section */}
            <Card className="mb-4">
                <View className="flex-row items-center gap-2 mb-4">
                    <Text className="text-2xl">🌍</Text>
                    <View>
                        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('settings.language')}</Text>
                        <Text className="text-gray-500 text-xs">Selecciona el idioma de la aplicación</Text>
                    </View>
                </View>

                <View className="flex-row flex-wrap gap-2">
                    {[
                        { id: 'es', flag: '🇲🇽', name: 'Español' },
                        { id: 'en', flag: '🇺🇸', name: 'English' },
                        { id: 'fr', flag: '🇫🇷', name: 'Français' },
                        { id: 'pt', flag: '🇧🇷', name: 'Português' },
                        { id: 'it', flag: '🇮🇹', name: 'Italiano' },
                    ].map((lang) => (
                        <TouchableOpacity
                            key={lang.id}
                            onPress={() => setLanguage(lang.id as any)}
                            className={`flex-row items-center p-3 rounded-xl border ${language === lang.id ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-200'}`}
                        >
                            <Text className="text-xl mr-2">{lang.flag}</Text>
                            <Text className={`font-bold ${language === lang.id ? 'text-blue-700' : 'text-gray-600'}`}>
                                {lang.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Card>

            {/* Vacation Mode Section */}
            <Card className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">🏖️</Text>
                        <View>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('settings.vacation_mode')}</Text>
                            <Text className="text-gray-500 text-xs">{t('settings.vacation_desc')}</Text>
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

            {/* Categories Section */}
            <Card className="mb-4">
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">🏷️</Text>
                        <View>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('settings.manage_categories')}</Text>
                            <Text className="text-gray-500 text-xs">{t('settings.categories_desc')}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate('ManageCategories')}
                    className="flex-row items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-200 active:bg-indigo-100"
                >
                    <View>
                        <Text className="font-bold text-indigo-800">{t('settings.manage_categories')}</Text>
                        <Text className="text-indigo-600 text-xs mt-1">
                            {t('settings.categories_desc')}
                        </Text>
                    </View>
                    <Text className="text-indigo-500 text-xl">→</Text>
                </TouchableOpacity>
            </Card>

            {/* Justifications Section */}
            <Card className="mb-4">
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">🤔</Text>
                        <View>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('settings.manage_justifications')}</Text>
                            <Text className="text-gray-500 text-xs">{t('settings.manage_justifications_desc')}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate('ManageJustifications')}
                    className="flex-row items-center justify-between bg-purple-50 p-4 rounded-xl border border-purple-200 active:bg-purple-100"
                >
                    <View>
                        <Text className="font-bold text-purple-800">{t('settings.manage_justifications')}</Text>
                        <Text className="text-purple-600 text-xs mt-1">
                            Añade o edita las opciones disponibles
                        </Text>
                    </View>
                    <Text className="text-purple-500 text-xl">→</Text>
                </TouchableOpacity>
            </Card>

            {/* School Calendar Section */}
            <Card className="mb-4">
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">📅</Text>
                        <View>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('settings.school_calendar')}</Text>
                            <Text className="text-gray-500 text-xs">{t('settings.school_calendar_desc')}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => navigation.navigate('SchoolCalendar')}
                    className="flex-row items-center justify-between bg-orange-50 p-4 rounded-xl border border-orange-200 active:bg-orange-100"
                >
                    <View>
                        <Text className="font-bold text-orange-800">{t('settings.school_calendar')}</Text>
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

            {/* Maintenance Section */}
            <Card className="mb-4 border-2 border-red-100 bg-red-50 dark:bg-red-900/20 dark:border-red-900">
                <View className="flex-row items-center gap-2 mb-4">
                    <Text className="text-2xl">🚨</Text>
                    <View>
                        <Text className="text-lg font-bold text-red-900 dark:text-red-300">Zona de Mantenimiento</Text>
                        <Text className="text-red-700 dark:text-red-400 text-xs">Herramientas para corregir errores</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => {
                        if (Platform.OS === 'web') {
                            if (window.confirm("¿Estás seguro? Esto borrará todas las tareas pendientes de esta semana y las volverá a generar basándose en tus horarios actuales. Úsalo si ves tareas duplicadas o incorrectas.")) {
                                regenerateWeek();
                            }
                        } else {
                            Alert.alert(
                                "Regenerar Semana",
                                "¿Estás seguro? Esto borrará todas las tareas pendientes de esta semana y las volverá a generar. Úsalo si ves errores.",
                                [
                                    { text: "Cancelar", style: "cancel" },
                                    { text: "Sí, Reparar", onPress: regenerateWeek, style: "destructive" }
                                ]
                            );
                        }
                    }}
                    className="flex-row items-center justify-center bg-red-600 p-4 rounded-xl shadow-sm active:bg-red-700"
                >
                    <Text className="text-white font-bold text-lg">⚠️ Regenerar Tareas Semanales</Text>
                </TouchableOpacity>
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
