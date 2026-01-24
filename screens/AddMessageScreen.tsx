import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';

export default function AddMessageScreen({ navigation, route }: any) {
    const { addMessage, updateMessage } = useTaskContext();
    const { messageToEdit, indexToEdit } = route.params || {};
    const isEditing = indexToEdit !== undefined && indexToEdit !== null;

    const [text, setText] = useState(messageToEdit || '');

    const handleSave = async () => {
        if (!text.trim()) {
            Alert.alert("Error", "El mensaje no puede estar vacío");
            return;
        }

        if (isEditing) {
            await updateMessage(indexToEdit, text);
            Alert.alert("Éxito", "Mensaje actualizado");
        } else {
            await addMessage(text);
            Alert.alert("Éxito", "Mensaje agregado");
        }
        navigation.goBack();
    };

    return (
        <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-6">
            <Text className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
                {isEditing ? "Editar Mensaje" : "Nuevo Mensaje"}
            </Text>

            <Text className="text-gray-600 mb-2">Este mensaje aparecerá aleatoriamente en el dashboard de tus hijos.</Text>

            <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Escribe algo inspirador o un recordatorio..."
                className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-lg min-h-[150px] mb-6"
                multiline
                textAlignVertical="top"
            />

            <View className="gap-3">
                <Button title={isEditing ? "Guardar Cambios" : "Agregar Mensaje"} onPress={handleSave} size="lg" />
                <Button title="Cancelar" variant="outline" onPress={() => navigation.goBack()} size="lg" />
            </View>
        </ScrollView>
    );
}
