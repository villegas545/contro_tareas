import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TextInput, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { TaskFrequency } from '../types';

export default function CreateTaskScreen({ navigation, route }: any) {
    const { addTask, updateTask, currentUser, categories } = useTaskContext();
    const taskToEdit = route.params?.taskToEdit;

    // Form State
    const [title, setTitle] = useState(taskToEdit?.title || '');
    const [categoryId, setCategoryId] = useState(taskToEdit?.categoryId || '');
    const [description, setDescription] = useState(taskToEdit?.description || '');

    // Task Configuration State
    const [frequency, setFrequency] = useState<TaskFrequency>(taskToEdit?.frequency || 'daily');
    const [isResponsibility, setIsResponsibility] = useState(taskToEdit?.isResponsibility || false);
    const [isSchool, setIsSchool] = useState(taskToEdit?.isSchool || false);
    const [recurrenceDays] = useState<number[]>(taskToEdit?.recurrenceDays || []);
    const [points, setPoints] = useState(taskToEdit?.points ? taskToEdit.points.toString() : '');
    const [shift, setShift] = useState<'morning' | 'afternoon' | 'night' | 'no-time'>(taskToEdit?.shift || 'no-time');
    const [dueDate, setDueDate] = useState<string>(taskToEdit?.dueDate || '');

    // Time Window State
    const [timeType, setTimeType] = useState<'specific' | 'window' | 'none'>(() => {
        if (taskToEdit) {
            if (taskToEdit.timeWindow) return 'window';
            if (taskToEdit.dueTime) return 'specific';
            return 'none';
        }
        return 'specific';
    });
    const [dueTime, setDueTime] = useState(taskToEdit?.dueTime || '');
    const [windowStart, setWindowStart] = useState(taskToEdit?.timeWindow?.start || '');
    const [windowEnd, setWindowEnd] = useState(taskToEdit?.timeWindow?.end || '');

    useEffect(() => {
        if (isResponsibility) {
            setPoints('');
        }
    }, [isResponsibility]);

    const handleCreate = () => {
        if (!title) {
            Alert.alert("Error", "El título es obligatorio");
            return;
        }

        const taskData: any = {
            title,
            description,
            assignedTo: 'pool',
            createdBy: currentUser?.id || '',
            status: 'pending',
            type: isResponsibility ? 'obligatory' : 'additional',
            frequency,
            isResponsibility,
            categoryId,
            isSchool,
            recurrenceDays,
            shift,
        };

        if (points) taskData.points = parseInt(points);
        if (dueDate) taskData.dueDate = dueDate;

        if (timeType === 'specific' && dueTime) {
            taskData.dueTime = dueTime;
        } else if (timeType === 'window' && windowStart && windowEnd) {
            taskData.timeWindow = {
                start: windowStart,
                end: windowEnd
            };
        }

        const saveLogic = () => {
            if (taskToEdit) {
                updateTask(taskToEdit.id, taskData);
                if (Platform.OS === 'web') window.alert("Plantilla actualizada");
                else Alert.alert("Éxito", "Plantilla actualizada");
            } else {
                addTask(taskData);
                if (Platform.OS === 'web') window.alert("Plantilla creada correctamente");
                else Alert.alert("Éxito", "Plantilla creada correctamente");
            }
            navigation.goBack();
        };

        // ... existing legacy confirmation block
        if (Platform.OS === 'web') {
            if (window.confirm(taskToEdit ? "¿Guardar cambios en la plantilla?" : "¿Deseas guardar esta plantilla de tarea?")) {
                saveLogic();
            }
        } else {
            Alert.alert(
                taskToEdit ? "Actualizar Plantilla" : "Crear Plantilla",
                taskToEdit ? "¿Guardar cambios?" : "¿Deseas guardar esta plantilla de tarea?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Guardar", onPress: saveLogic }
                ]
            );
        }
    };



    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text className="text-2xl font-bold text-gray-900 mb-6">{taskToEdit ? "Editar Plantilla" : "Nueva Tarea (Plantilla)"}</Text>

                <View className="gap-4">
                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Título de la tarea</Text>
                        <TextInput
                            className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                            placeholder="Ej. Lavar los platos"
                            placeholderTextColor="#9ca3af"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Descripción</Text>
                        <TextInput
                            className="bg-white p-4 rounded-xl border border-gray-200 text-base h-24"
                            placeholder="Detalles adicionales..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            value={description}
                            onChangeText={setDescription}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* New Categorization Section */}
                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            onPress={() => setIsResponsibility(!isResponsibility)}
                            className={`flex-1 p-4 rounded-xl border ${isResponsibility ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-gray-200'}`}
                        >
                            <Text className={`font-bold text-base mb-1 ${isResponsibility ? 'text-indigo-700' : 'text-gray-700'}`}>🏆 De Responsabilidad</Text>
                            <Text className="text-gray-500 text-xs">Cuenta para bonos y castigos.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsSchool(!isSchool)}
                            className={`flex-1 p-4 rounded-xl border ${isSchool ? 'bg-orange-50 border-orange-600' : 'bg-white border-gray-200'}`}
                        >
                            <Text className={`font-bold text-base mb-1 ${isSchool ? 'text-orange-700' : 'text-gray-700'}`}>📚 Escolar</Text>
                            <Text className="text-gray-500 text-xs">Solo en días de escuela.</Text>
                        </TouchableOpacity>
                    </View>

                    <View>
                        <Text className="text-gray-700 font-medium mb-2">Frecuencia:</Text>
                        <View className="flex-row flex-wrap gap-2 mb-2">
                            {(['Diario', 'Semanal', 'Una Vez'] as const).map((opt) => {
                                const val = opt === 'Diario' ? 'daily' : opt === 'Una Vez' ? 'one-time' : 'weekly';
                                return (
                                    <TouchableOpacity
                                        key={val}
                                        onPress={() => setFrequency(val as TaskFrequency)}
                                        className={`px-4 py-2 rounded-full border ${frequency === val
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'bg-white border-gray-300'
                                            }`}
                                    >
                                        <Text className={frequency === val ? 'text-white font-medium' : 'text-gray-700'}>
                                            {opt}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Date Picker for One-Time */}

                    </View>


                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-2">Categoría (Opcional):</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            <View className="flex-row gap-2">
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => setCategoryId(cat.id === categoryId ? '' : cat.id)}
                                        className={`items-center justify-center p-2 rounded-xl border ${categoryId === cat.id ? 'bg-indigo-100 border-indigo-500' : 'bg-white border-gray-200'
                                            }`}
                                        style={{ width: 72, height: 72 }}
                                    >
                                        <Text className="text-2xl mb-1">{cat.icon}</Text>
                                        <Text className="text-[10px] text-center font-medium leading-tight text-gray-700">{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>



                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Tipo de Horario (Restrictivo):</Text>
                        <View className="flex-row flex-wrap gap-2 mb-2">
                            <TouchableOpacity
                                onPress={() => setTimeType('specific')}
                                className={`px-4 py-2 rounded-full border ${timeType === 'specific'
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <Text className={timeType === 'specific' ? 'text-white font-medium' : 'text-gray-700'}>
                                    Hora Límite
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setTimeType('window')}
                                className={`px-4 py-2 rounded-full border ${timeType === 'window'
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <Text className={timeType === 'window' ? 'text-white font-medium' : 'text-gray-700'}>
                                    Rango de Horario
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setTimeType('none')}
                                className={`px-4 py-2 rounded-full border ${timeType === 'none'
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <Text className={timeType === 'none' ? 'text-white font-medium' : 'text-gray-700'}>
                                    No requerido
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {timeType === 'specific' && (
                            <View>
                                <Text className="text-gray-500 text-xs mb-1">Se debe cumplir antes de esta hora</Text>
                                <TextInput
                                    className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                                    placeholder="Ej. 14:00"
                                    value={dueTime}
                                    onChangeText={setDueTime}
                                />
                            </View>
                        )}

                        {timeType === 'window' && (
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-1">Desde</Text>
                                    <TextInput
                                        className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                                        placeholder="13:00"
                                        value={windowStart}
                                        onChangeText={setWindowStart}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-1">Hasta</Text>
                                    <TextInput
                                        className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                                        placeholder="18:00"
                                        value={windowEnd}
                                        onChangeText={setWindowEnd}
                                    />
                                </View>
                            </View>
                        )}
                    </View>

                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Puntos:</Text>
                        <TextInput
                            className={`bg-white p-4 rounded-xl border border-gray-200 text-lg ${isResponsibility ? 'bg-gray-100 text-gray-400' : ''}`}
                            placeholder={isResponsibility ? "Sin puntos (Responsabilidad)" : "Ej. 10"}
                            placeholderTextColor="#9ca3af"
                            value={points}
                            onChangeText={setPoints}
                            keyboardType="numeric"
                            editable={!isResponsibility}
                        />
                    </View>

                    <View className="mt-8 gap-3">
                        <Button title={taskToEdit ? "Actualizar Tarea" : "Guardar Tarea"} onPress={handleCreate} />
                        <Button title="Cancelar" variant="outline" onPress={() => navigation.goBack()} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
