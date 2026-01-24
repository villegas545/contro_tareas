import React from 'react';
import { View, Text, Alert, SafeAreaView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';

// Setup Spanish Locale
LocaleConfig.locales['es'] = {
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
    today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

export default function SchoolCalendarScreen({ navigation }: any) {
    const { globalSettings, updateGlobalSettings } = useTaskContext();
    const nonSchoolDays = globalSettings?.nonSchoolDays || [];

    const toggleDate = (day: any) => {
        const dateStr = day.dateString;
        const exists = nonSchoolDays.find(d => d.date === dateStr);

        if (exists) {
            Alert.alert(
                "Habilitar Escuela",
                `¿Marcar el ${dateStr} como día de escuela?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Sí, Habilitar", onPress: async () => {
                            const newDays = nonSchoolDays.filter(d => d.date !== dateStr);
                            await updateGlobalSettings({ nonSchoolDays: newDays });
                        }
                    }
                ]
            );
        } else {
            Alert.alert(
                "Deshabilitar Escuela",
                `¿Marcar el ${dateStr} como día SIN escuela (feriado/vacaciones)?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Sí, Sin Escuela", onPress: async () => {
                            const newDays = [...nonSchoolDays, { date: dateStr }];
                            await updateGlobalSettings({ nonSchoolDays: newDays });
                        }
                    }
                ]
            );
        }
    };

    const markedDates = nonSchoolDays.reduce((acc: any, curr) => {
        acc[curr.date] = { selected: true, marked: true, selectedColor: '#f97316' }; // Orange for "Holiday"
        return acc;
    }, {});

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
            <View className="p-4 border-b border-gray-200 flex-row items-center justify-between">
                <Button title="Atrás" variant="outline" onPress={() => navigation.goBack()} size="sm" />
                <Text className="text-lg font-bold text-gray-800 dark:text-white">Calendario Escolar</Text>
                <View style={{ width: 50 }} />
            </View>
            <View className="p-4">
                <Text className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                    Toca las fechas para marcarlas como NO escolares (feriados/vacaciones).
                    {"\n"}Sábados y Domingos ya son libres por defecto.
                </Text>

                <Calendar
                    onDayPress={toggleDate}
                    markedDates={markedDates}
                    theme={{
                        selectedDayBackgroundColor: '#f97316',
                        todayTextColor: '#4f46e5',
                        arrowColor: '#4f46e5',
                        calendarBackground: 'transparent',
                        textSectionTitleColor: '#b6c1cd',
                    }}
                    style={{
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'gray',
                        height: 350
                    }}
                />

                <View className="mt-6 bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <Text className="text-orange-800 font-bold mb-1">ℹ️ Nota:</Text>
                    <Text className="text-orange-700 text-sm">
                        Los días marcados en naranja ocultarán automáticamente las tareas escolares para todos los niños.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
