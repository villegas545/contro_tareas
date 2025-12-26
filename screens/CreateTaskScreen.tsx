import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';
import { TaskFrequency } from '../types';

export default function CreateTaskScreen({ navigation }: any) {
    const { addTask, users, currentUser } = useTaskContext();

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Task Configuration State
    const [frequency, setFrequency] = useState<TaskFrequency>('daily');
    const [type, setType] = useState<'obligatory' | 'additional'>('obligatory');
    const [points, setPoints] = useState('');

    // Time Window State
    const [timeType, setTimeType] = useState<'specific' | 'window' | 'none'>('specific');
    const [dueTime, setDueTime] = useState('');
    const [windowStart, setWindowStart] = useState('');
    const [windowEnd, setWindowEnd] = useState('');

    const handleCreate = () => {
        if (!title) {
            Alert.alert("Error", "El título es obligatorio");
            return;
        }

        Alert.alert(
            "Crear Plantilla",
            "¿Deseas guardar esta plantilla de tarea?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Guardar",
                    onPress: () => {
                        const newTask: any = {
                            title,
                            description,
                            assignedTo: 'pool', // Created as a template in the pool
                            createdBy: currentUser?.id || '',
                            status: 'pending',
                            type,
                            frequency,
                            points: points ? parseInt(points) : undefined
                        };

                        if (timeType === 'specific' && dueTime) {
                            newTask.dueTime = dueTime;
                        } else if (timeType === 'window' && windowStart && windowEnd) {
                            newTask.timeWindow = {
                                start: windowStart,
                                end: windowEnd
                            };
                        }

                        addTask(newTask);
                        navigation.goBack();
                        Alert.alert("Éxito", "Plantilla creada correctamente");
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text className="text-2xl font-bold text-gray-900 mb-6">Nueva Tarea (Plantilla)</Text>

                <View className="gap-4">
                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Título de la tarea</Text>
                        <TextInput
                            className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                            placeholder="Ej. Lavar los platos"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Descripción</Text>
                        <TextInput
                            className="bg-white p-4 rounded-xl border border-gray-200 text-base h-24"
                            placeholder="Detalles adicionales..."
                            multiline
                            value={description}
                            onChangeText={setDescription}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Assignment section removed - tasks are now created as templates */}

                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Tipo de Tarea:</Text>
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => setType('obligatory')}
                                className={`px-4 py-2 rounded-full border ${type === 'obligatory'
                                    ? 'bg-rose-500 border-rose-500'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <Text className={type === 'obligatory' ? 'text-white font-medium' : 'text-gray-700'}>
                                    ✋ Obligatoria
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setType('additional')}
                                className={`px-4 py-2 rounded-full border ${type === 'additional'
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <Text className={type === 'additional' ? 'text-white font-medium' : 'text-gray-700'}>
                                    🎁 Adicional
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Frecuencia Predeterminada:</Text>
                        <View className="flex-row gap-2">
                            {(['daily', 'weekly', 'one-time'] as const).map(freq => (
                                <TouchableOpacity
                                    key={freq}
                                    onPress={() => setFrequency(freq)}
                                    className={`px-4 py-2 rounded-full border ${frequency === freq
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'bg-white border-gray-300'
                                        }`}
                                >
                                    <Text className={frequency === freq ? 'text-white font-medium' : 'text-gray-700 capitalize'}>
                                        {freq === 'one-time' ? 'Una vez' : freq === 'daily' ? 'Diario' : 'Semanal'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View>
                        <Text className="text-gray-700 font-medium mb-1">Tipo de Horario:</Text>
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
                            className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                            placeholder="Ej. 10"
                            value={points}
                            onChangeText={setPoints}
                            keyboardType="numeric"
                        />
                    </View>

                    <View className="mt-8 gap-3">
                        <Button title="Guardar Tarea" onPress={handleCreate} />
                        <Button title="Cancelar" variant="outline" onPress={() => navigation.goBack()} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
