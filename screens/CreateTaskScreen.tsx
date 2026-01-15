import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TextInput, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import { TaskFrequency } from '../types';

export default function CreateTaskScreen({ navigation, route }: any) {
    const { addTask, updateTask, currentUser, categories, t } = useTaskContext();
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

    const handleCreate = async () => {
        console.log("[DEBUG] handleCreate called");
        if (!title) {
            Alert.alert(t('common.error'), t('create_task.error_title'));
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

        const saveLogic = async () => {
            try {
                if (taskToEdit) {
                    await updateTask(taskToEdit.id, taskData);
                    console.log("[DEBUG] Task Updated");
                    if (Platform.OS === 'web') window.alert(t('create_task.success_updated'));
                    else Alert.alert(t('common.success'), t('create_task.success_updated'));
                } else {
                    await addTask(taskData);
                    console.log("[DEBUG] Task Created");
                    if (Platform.OS === 'web') window.alert(t('create_task.success_created'));
                    else Alert.alert(t('common.success'), t('create_task.success_created'));
                }
                navigation.goBack();
            } catch (e) {
                console.error("[DEBUG] Error saving:", e);
                Alert.alert(t('common.error'), "Falló al guardar");
            }
        };

        // ... existing legacy confirmation block
        // Direct save without extra confirmation dialog
        await saveLogic();
    };



    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text className="text-2xl font-bold text-gray-900 mb-6">{taskToEdit ? t('create_task.title_edit') : t('create_task.title_new')}</Text>

                <View className="gap-4">
                    <View>
                        <Text className="text-gray-700 font-medium mb-1">{t('create_task.task_title_label')}</Text>
                        <TextInput
                            className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                            placeholder={t('create_task.task_title_placeholder')}
                            placeholderTextColor="#9ca3af"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View>
                        <Text className="text-gray-700 font-medium mb-1">{t('create_task.description_label')}</Text>
                        <TextInput
                            className="bg-white p-4 rounded-xl border border-gray-200 text-base h-24"
                            placeholder={t('create_task.description_placeholder')}
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
                            <Text className={`font-bold text-base mb-1 ${isResponsibility ? 'text-indigo-700' : 'text-gray-700'}`}>{t('create_task.responsibility')}</Text>
                            <Text className="text-gray-500 text-xs">{t('create_task.responsibility_desc')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsSchool(!isSchool)}
                            className={`flex-1 p-4 rounded-xl border ${isSchool ? 'bg-orange-50 border-orange-600' : 'bg-white border-gray-200'}`}
                        >
                            <Text className={`font-bold text-base mb-1 ${isSchool ? 'text-orange-700' : 'text-gray-700'}`}>{t('create_task.school')}</Text>
                            <Text className="text-gray-500 text-xs">{t('create_task.school_desc')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View>
                        <Text className="text-gray-700 font-medium mb-2">{t('create_task.frequency')}</Text>
                        <View className="flex-row flex-wrap gap-2 mb-2">
                            {(['daily', 'weekly', 'one-time'] as const).map((val) => {
                                let label = t('frequency.daily');
                                if (val === 'weekly') label = t('frequency.weekly');
                                if (val === 'one-time') label = t('frequency.one_time');

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
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>


                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-2">{t('create_task.category')}</Text>
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
                        <Text className="text-gray-700 font-medium mb-1">{t('create_task.time_type')}</Text>
                        <View className="flex-row flex-wrap gap-2 mb-2">
                            <TouchableOpacity
                                onPress={() => setTimeType('specific')}
                                className={`px-4 py-2 rounded-full border ${timeType === 'specific'
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <Text className={timeType === 'specific' ? 'text-white font-medium' : 'text-gray-700'}>
                                    {t('create_task.time_limit')}
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
                                    {t('create_task.time_range')}
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
                                    {t('create_task.time_none')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {timeType === 'specific' && (
                            <View>
                                <Text className="text-gray-500 text-xs mb-1">{t('create_task.time_helper')}</Text>
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
                                    <Text className="text-gray-500 text-xs mb-1">{t('create_task.start')}</Text>
                                    <TextInput
                                        className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                                        placeholder="13:00"
                                        value={windowStart}
                                        onChangeText={setWindowStart}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-xs mb-1">{t('create_task.end')}</Text>
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
                        <Text className="text-gray-700 font-medium mb-1">{t('create_task.points')}</Text>
                        <TextInput
                            className={`bg-white p-4 rounded-xl border border-gray-200 text-lg ${isResponsibility ? 'bg-gray-100 text-gray-400' : ''}`}
                            placeholder={isResponsibility ? t('create_task.points_disabled') : t('create_task.points_placeholder')}
                            placeholderTextColor="#9ca3af"
                            value={points}
                            onChangeText={setPoints}
                            keyboardType="numeric"
                            editable={!isResponsibility}
                        />
                    </View>

                    <View className="mt-8 gap-3">
                        <Button title={taskToEdit ? t('create_task.update') : t('create_task.save')} onPress={handleCreate} />
                        <Button title={t('common.cancel')} variant="outline" onPress={() => navigation.goBack()} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
