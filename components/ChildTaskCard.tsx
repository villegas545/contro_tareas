import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { Card } from './ui/Card';
import { Task } from '../types';

interface ChildTaskCardProps {
    item: Task;
    onComplete: (task: Task, evidenceUrl?: string) => void;
}

export const ChildTaskCard = ({ item, onComplete }: ChildTaskCardProps) => {
    const [uploading, setUploading] = useState(false);
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
                        {item.title}
                    </Text>
                    {item.description && (
                        <Text className="text-gray-500 text-sm mt-1">{item.description}</Text>
                    )}
                    {item.points && (
                        <Text className="text-amber-500 font-bold text-sm mt-1">+{item.points} Pts ⭐️</Text>
                    )}
                </View>
            </View>

            {isPending && (
                <View className="mt-4">
                    {uploading ? (
                        <View className="bg-indigo-100 px-4 py-3 rounded-xl items-center justify-center">
                            <ActivityIndicator color="#4f46e5" />
                            <Text className="text-indigo-600 text-xs mt-1">Subiendo foto...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={handlePressComplete}
                            className="bg-indigo-600 px-4 py-3 rounded-xl items-center justify-center shadow-sm active:opacity-80 flex-row gap-2"
                        >
                            <Text className="text-white font-bold font-semibold">¡Ya lo hice!</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

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
