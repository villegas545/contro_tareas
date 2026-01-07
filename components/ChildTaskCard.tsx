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

export const ChildTaskCard = ({ item, onComplete }: ChildTaskCardProps) => {
    const { categories } = useTaskContext();
    const category = categories.find(c => c.id === item.categoryId);
    const [uploading, setUploading] = useState(false);
    const [justifyModalVisible, setJustifyModalVisible] = useState(false);
    const [justificationReason, setJustificationReason] = useState('');
    const isPending = item.status === 'pending';

    const handleTakePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            alert("Es necesario dar permiso a la cámara para tomar fotos.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false, // Changed to false as requested
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
            // Use XMLHttpRequest for better Android compatibility
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
            Alert.alert("Error", "No se pudo subir la imagen: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handlePressComplete = () => {
        if (Platform.OS === 'web') {
            onComplete(item); // Web simplifies for now, camera complicates things on web without more setup
            return;
        }

        Alert.alert(
            "COMPLETAR TAREA",
            "¿Quieres agregar una foto como evidencia?",
            [
                {
                    text: "No, solo completar",
                    onPress: () => onComplete(item)
                },
                {
                    text: "📸 Sí, tomar foto",
                    onPress: handleTakePhoto
                },
                {
                    text: "Cancelar",
                    style: "cancel"
                }
            ]
        );
    };

    return (
        <Card className={`mb-4 border-l-4 ${item.status === 'verified' ? 'border-green-500 opacity-60' : 'border-indigo-500'}`}>
            <View className="flex-row items-center">
                <View className="flex-1">
                    <Text className={`text-lg font-bold ${item.status === 'verified' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {category && <Text>{category.icon} </Text>}
                        {item.title}
                    </Text>
                    {item.description && (
                        <Text className="text-gray-500 text-sm mt-1">{item.description}</Text>
                    )}

                    {/* Time Window and Limits */}
                    {(item.timeWindow || item.timeLimit) && (
                        <View className="flex-row gap-3 mt-1.5 flex-wrap">
                            {item.timeWindow && (() => {
                                const to12h = (time24: string) => {
                                    if (!time24) return '';
                                    const [h, m] = time24.split(':');
                                    let hours = parseInt(h);
                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                    hours = hours % 12;
                                    hours = hours ? hours : 12;
                                    return `${hours}:${m} ${ampm}`;
                                };
                                return (
                                    <View className="flex-row items-center bg-gray-100 px-2 py-0.5 rounded-full">
                                        <Text className="text-xs text-gray-600 font-medium">
                                            🕒 {to12h(item.timeWindow.start)} - {to12h(item.timeWindow.end)}
                                        </Text>
                                    </View>
                                );
                            })()}
                            {item.timeLimit && (
                                <View className="flex-row items-center bg-amber-100 px-2 py-0.5 rounded-full">
                                    <Text className="text-xs text-amber-700 font-medium">
                                        ⏳ Límite: {item.timeLimit} min
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {item.shift && item.shift !== 'no-time' && (
                        <View className="mt-1.5 flex-row">
                            <Text className={`text-xs px-2 py-0.5 rounded capitalize ${item.shift === 'morning' ? 'bg-amber-100 text-amber-800' :
                                item.shift === 'afternoon' ? 'bg-orange-100 text-orange-800' :
                                    item.shift === 'night' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {item.shift === 'morning' ? '🌅 Mañana' :
                                    item.shift === 'afternoon' ? '☀️ Tarde' :
                                        item.shift === 'night' ? '🌙 Noche' : 'Sin Horario'}
                            </Text>
                        </View>
                    )}

                    <View className="flex-row gap-2 mt-2 items-center flex-wrap">
                        {item.isSchool && (
                            <Text className="self-start text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded font-bold overflow-hidden">
                                🎓 Escolar
                            </Text>
                        )}
                        <Text className={`self-start text-xs px-2 py-1 rounded font-bold overflow-hidden ${item.isResponsibility ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {item.isResponsibility ? '🎁 Bono' : '💵 Extra'}
                        </Text>
                        {(item.points || 0) > 0 && (
                            <Text className="text-amber-500 font-bold text-sm">+{item.points} Pts ⭐️</Text>
                        )}
                    </View>
                </View>
            </View>

            {isPending && (
                <View className="mt-4 flex-row gap-2">
                    {uploading ? (
                        <View className="bg-indigo-100 px-4 py-3 rounded-xl items-center justify-center flex-1">
                            <ActivityIndicator color="#4f46e5" />
                            <Text className="text-indigo-600 text-xs mt-1">Subiendo foto...</Text>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={handlePressComplete}
                                className="bg-indigo-600 px-4 py-3 rounded-xl items-center justify-center shadow-sm active:opacity-80 flex-row gap-2 flex-1"
                            >
                                <Text className="text-white font-bold text-center">¡Ya lo hice! 📸</Text>
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
                    <View className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
                        <Text className="text-xl font-bold text-gray-800 mb-2">Justificar Tarea</Text>
                        <Text className="text-gray-500 mb-4 tex-sm">
                            ¿Por qué no puedes realizar esta tarea hoy? (Opcional)
                        </Text>

                        <TextInput
                            value={justificationReason}
                            onChangeText={setJustificationReason}
                            placeholder="Ej: Me duele la cabeza, no hay material..."
                            multiline
                            numberOfLines={3}
                            className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6 text-gray-800"
                            style={{ textAlignVertical: 'top' }}
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setJustifyModalVisible(false)}
                                className="flex-1 py-3 items-center justify-center rounded-xl bg-gray-200"
                            >
                                <Text className="text-gray-600 font-bold">Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    setJustifyModalVisible(false);
                                    // Send specialized evidence string
                                    const evidence = `JUSTIFICADO: ${justificationReason.trim() || 'Sin razón especificada'}`;
                                    onComplete(item, evidence);
                                }}
                                className="flex-1 py-3 items-center justify-center rounded-xl bg-orange-500"
                            >
                                <Text className="text-white font-bold">Enviar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {item.status === 'completed' && (
                <View className="mt-4 bg-amber-50 p-2 rounded items-center">
                    <Text className="text-amber-600 font-medium">Esperando revisión de papá/mamá ⏳</Text>
                    {item.evidenceUrl && (
                        <Text className="text-xs text-amber-500 mt-1">📸 Foto enviada</Text>
                    )}
                </View>
            )}

            {item.status === 'verified' && (
                <View className="mt-4 bg-green-50 p-2 rounded items-center">
                    <Text className="text-green-600 font-bold">¡Bien hecho! ✅</Text>
                </View>
            )}
        </Card>
    );
};
