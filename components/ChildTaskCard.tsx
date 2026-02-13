import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTaskContext } from '../context/TaskContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { Card } from './ui/Card';
import { Task } from '../types';

interface ChildTaskCardProps {
    item: Task;
    onComplete: (task: Task, evidenceUrl?: string) => void;
}

const to12h = (time24?: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${m} ${ampm}`;
};

export const ChildTaskCard = ({ item, onComplete }: ChildTaskCardProps) => {
    const { categories, justificationReasons, t } = useTaskContext();
    const category = categories.find(c => c.id === item.categoryId);
    const [uploading, setUploading] = useState(false);
    const [justifyModalVisible, setJustifyModalVisible] = useState(false);
    const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null);
    const [otherReasonText, setOtherReasonText] = useState('');
    const isPending = item.status === 'pending';

    const handleTakePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            alert(t('child_task.camera_permission'));
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            uploadImage(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string) => {
        setUploading(true);
        try {
            const blob: Blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    resolve(xhr.response);
                };
                xhr.onerror = function (e) {
                    console.log(e);
                    reject(new TypeError("Network request failed"));
                };
                xhr.responseType = "blob";
                xhr.open("GET", uri, true);
                xhr.send(null);
            });

            const filename = `evidence/${item.id}_${new Date().getTime()}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            onComplete(item, downloadURL);
        } catch (error: any) {
            console.error(error);
            Alert.alert(t('common.error'), t('child_task.upload_error') + " " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handlePressComplete = () => {
        if (Platform.OS === 'web') {
            onComplete(item);
            return;
        }

        Alert.alert(
            t('child_task.complete_title'),
            t('child_task.complete_desc'),
            [
                {
                    text: t('child_task.just_complete'),
                    onPress: () => onComplete(item)
                },
                {
                    text: `📸 ${t('child_task.take_photo')}`,
                    onPress: handleTakePhoto
                },
                {
                    text: t('common.cancel'),
                    style: "cancel"
                }
            ]
        );
    };

    const hasTimeWindow = !!item.timeWindow;
    const hasTimeLimit = !!(item.timeLimit && item.timeLimit > 0);
    const hasShift = !!(item.shift && item.shift !== 'no-time');
    const isSchool = !!item.isSchool;
    const isResponsibility = !!item.isResponsibility;
    const hasPoints = !!(item.points && item.points > 0);

    return (
        <Card className={`mb-4 border-l-4 ${item.status === 'verified' ? 'border-green-500 opacity-60' : 'border-indigo-500'}`}>
            <View className="flex-row items-center">
                <View className="flex-1">
                    <Text className={`text-lg font-bold ${item.status === 'verified' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {category && <Text>{category.icon} </Text>}
                        {item.title}
                    </Text>
                    {item.description ? (
                        <Text className="text-gray-500 text-sm mt-1">{item.description}</Text>
                    ) : null}

                    {/* Time Window and Limits */}
                    {(hasTimeWindow || hasTimeLimit) && (
                        <View className="flex-row gap-3 mt-1.5 flex-wrap">
                            {hasTimeWindow && item.timeWindow ? (
                                <View className="flex-row items-center bg-gray-100 px-2 py-0.5 rounded-full">
                                    <Text className="text-xs text-gray-600 font-medium">
                                        🕒 {to12h(item.timeWindow.start)} - {to12h(item.timeWindow.end)}
                                    </Text>
                                </View>
                            ) : null}
                            {hasTimeLimit ? (
                                <View className="flex-row items-center bg-amber-100 px-2 py-0.5 rounded-full">
                                    <Text className="text-xs text-amber-700 font-medium">
                                        ⏳ {t('task.limit')}: {item.timeLimit} {t('common.min')}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    )}

                    {hasShift && (
                        <View className="mt-1.5 flex-row">
                            <Text className={`text-xs px-2 py-0.5 rounded capitalize ${item.shift === 'morning' ? 'bg-amber-100 text-amber-800' :
                                item.shift === 'afternoon' ? 'bg-orange-100 text-orange-800' :
                                    item.shift === 'night' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {item.shift === 'morning' ? `🌅 ${t('shift.morning')}` :
                                    item.shift === 'afternoon' ? `☀️ ${t('shift.afternoon')}` :
                                        item.shift === 'night' ? `🌙 ${t('shift.night')}` : t('shift.no_schedule')}
                            </Text>
                        </View>
                    )}

                    <View className="flex-row gap-2 mt-2 items-center flex-wrap">
                        {isSchool && (
                            <Text className="self-start text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded font-bold overflow-hidden">
                                🎓 {t('task.school')}
                            </Text>
                        )}
                        <Text className={`self-start text-xs px-2 py-1 rounded font-bold overflow-hidden ${isResponsibility ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {isResponsibility ? `🎁 ${t('task.bonus')}` : `💵 ${t('task.extra')}`}
                        </Text>
                        {hasPoints && (
                            <Text className="text-amber-500 font-bold text-sm">+{item.points} {t('task.points')} ⭐️</Text>
                        )}
                    </View>
                </View>
            </View>

            {isPending && (
                <View className="mt-4 flex-row gap-2">
                    {uploading ? (
                        <View className="bg-indigo-100 px-4 py-3 rounded-xl items-center justify-center flex-1">
                            <ActivityIndicator color="#4f46e5" />
                            <Text className="text-indigo-600 text-xs mt-1">{t('child_task.uploading')}...</Text>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={handlePressComplete}
                                className="bg-indigo-600 px-4 py-3 rounded-xl items-center justify-center shadow-sm active:opacity-80 flex-row gap-2 flex-1"
                            >
                                <Text className="text-white font-bold text-center">{t('child_task.finish_button')} 📸</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setJustifyModalVisible(true)}
                                className="bg-orange-100 border border-orange-200 px-3 py-3 rounded-xl items-center justify-center shadow-sm active:opacity-80 w-14"
                            >
                                <Text className="text-orange-600 font-bold text-2xl">⚠️</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}

            <Modal
                visible={justifyModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setJustifyModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 items-center justify-center p-4">
                    <View className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl max-h-[80%]">
                        <Text className="text-xl font-bold text-gray-800 mb-2">{t('child_task.justify_title')}</Text>
                        <Text className="text-gray-500 mb-4 text-sm">
                            {t('child_task.justify_desc')}:
                        </Text>

                        <View className="mb-4">
                            {justificationReasons.map(r => (
                                <TouchableOpacity
                                    key={r.id}
                                    onPress={() => setSelectedReasonId(r.id)}
                                    className={`flex-row items-center p-3 mb-2 rounded-xl border ${selectedReasonId === r.id ? 'bg-indigo-50 border-indigo-500' : 'bg-gray-50 border-gray-100'}`}
                                >
                                    <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${selectedReasonId === r.id ? 'border-indigo-500' : 'border-gray-400'}`}>
                                        {selectedReasonId === r.id && <View className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                    </View>
                                    <Text className="text-gray-800">{r.text}</Text>
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                onPress={() => setSelectedReasonId('other')}
                                className={`flex-row items-center p-3 mb-2 rounded-xl border ${selectedReasonId === 'other' ? 'bg-indigo-50 border-indigo-500' : 'bg-gray-50 border-gray-100'}`}
                            >
                                <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${selectedReasonId === 'other' ? 'border-indigo-500' : 'border-gray-400'}`}>
                                    {selectedReasonId === 'other' && <View className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                </View>
                                <Text className="text-gray-800">{t('common.other')}...</Text>
                            </TouchableOpacity>

                            {selectedReasonId === 'other' && (
                                <TextInput
                                    value={otherReasonText}
                                    onChangeText={setOtherReasonText}
                                    placeholder={t('child_task.explain_placeholder')}
                                    multiline
                                    className="bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 text-gray-800"
                                />
                            )}
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setJustifyModalVisible(false)}
                                className="flex-1 py-3 items-center justify-center rounded-xl bg-gray-200"
                            >
                                <Text className="text-gray-600 font-bold">{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (!selectedReasonId) {
                                        Alert.alert(t('justification.select_reason_title'), t('justification.select_reason_msg'));
                                        return;
                                    }
                                    let reasonText = '';
                                    if (selectedReasonId === 'other') {
                                        if (!otherReasonText.trim()) {
                                            Alert.alert(t('justification.missing_info_title'), t('justification.missing_info_msg'));
                                            return;
                                        }
                                        reasonText = otherReasonText.trim();
                                    } else {
                                        const r = justificationReasons.find(x => x.id === selectedReasonId);
                                        reasonText = r ? r.text : 'Desconocido';
                                    }

                                    setJustifyModalVisible(false);
                                    const evidence = `JUSTIFICADO: ${reasonText}`;
                                    onComplete(item, evidence);
                                }}
                                className={`flex-1 py-3 items-center justify-center rounded-xl ${selectedReasonId ? 'bg-orange-500' : 'bg-gray-300'}`}
                                disabled={!selectedReasonId}
                            >
                                <Text className="text-white font-bold">{t('common.send')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {item.status === 'completed' && (
                <View className="mt-4 bg-amber-50 p-2 rounded items-center">
                    <Text className="text-amber-600 font-medium">{t('child_task.waiting_review')} ⏳</Text>
                    {item.evidenceUrl && (
                        <Text className="text-xs text-amber-500 mt-1">📸 {t('child_task.photo_sent')}</Text>
                    )}
                </View>
            )}

            {item.status === 'verified' && (
                <View className="mt-4 bg-green-50 p-2 rounded items-center">
                    <Text className="text-green-600 font-bold">{t('child_task.well_done')} ✅</Text>
                </View>
            )}
        </Card>
    );
};
