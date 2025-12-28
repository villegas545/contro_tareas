import React, { useState } from 'react';
import { View, Text, TextInput, Platform, Alert } from 'react-native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';

export const MessagesTab = () => {
    const { messages, addMessage, updateMessage, deleteMessage } = useTaskContext();
    const [newMessageText, setNewMessageText] = useState('');
    const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
    const [messagesSearch, setMessagesSearch] = useState('');

    const filteredMessages = messages.filter(m =>
        m.toLowerCase().includes(messagesSearch.toLowerCase())
    );

    const handleAddMessage = () => {
        if (!newMessageText.trim()) {
            if (Platform.OS === 'web') window.alert("El mensaje no puede estar vacío");
            else Alert.alert("Error", "El mensaje no puede estar vacío");
            return;
        }

        if (editingMessageIndex !== null) {
            updateMessage(editingMessageIndex, newMessageText);
            setEditingMessageIndex(null);
            setNewMessageText('');
            if (Platform.OS === 'web') window.alert("Mensaje actualizado");
            else Alert.alert("Éxito", "Mensaje actualizado");
        } else {
            if (Platform.OS === 'web') {
                if (window.confirm("¿Deseas agregar este mensaje?")) {
                    addMessage(newMessageText);
                    setNewMessageText('');
                    window.alert("Mensaje agregado");
                }
            } else {
                Alert.alert(
                    "Confirmar",
                    "¿Deseas agregar este mensaje?",
                    [
                        { text: "Cancelar", style: "cancel" },
                        {
                            text: "Agregar",
                            onPress: () => {
                                addMessage(newMessageText);
                                setNewMessageText('');
                                Alert.alert("Éxito", "Mensaje agregado");
                            }
                        }
                    ]
                );
            }
        }
    };

    const startEditingMessage = (index: number, text: string) => {
        setEditingMessageIndex(index);
        setNewMessageText(text);
    };

    const cancelEditingMessage = () => {
        setEditingMessageIndex(null);
        setNewMessageText('');
    };

    const confirmDeleteMessage = (index: number) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de eliminar este mensaje?")) deleteMessage(index);
        } else {
            Alert.alert(
                "Confirmar Eliminación",
                "¿Estás seguro de eliminar este mensaje?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: 'destructive', onPress: () => deleteMessage(index) }
                ]
            );
        }
    };

    return (
        <View className="flex-1 p-6 pb-24">
            <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
                <Text className="text-lg font-bold mb-2 text-brand-text-primary dark:text-brand-text-light">{editingMessageIndex !== null ? "Editar Mensaje" : "Nuevo Mensaje / Recordatorio"}</Text>
                <TextInput
                    value={newMessageText}
                    onChangeText={setNewMessageText}
                    placeholder="Escribe un mensaje aquí..."
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 text-base"
                    multiline
                />
                <View className="flex-row gap-2">
                    <Button title={editingMessageIndex !== null ? "Actualizar Mensaje" : "Agregar Mensaje"} onPress={handleAddMessage} className="flex-1" />
                    {editingMessageIndex !== null && (
                        <Button title="Cancelar" variant="outline" onPress={cancelEditingMessage} className="flex-1" />
                    )}
                </View>
            </View>

            <Text className="text-lg font-bold mb-4 text-brand-text-primary dark:text-brand-text-light">Mensajes Actuales</Text>

            <SearchInput
                placeholder="Buscar mensajes..."
                value={messagesSearch}
                onChangeText={setMessagesSearch}
            />

            {filteredMessages.length === 0 ? (
                <Text className="text-gray-400 text-center py-4">No se encontraron mensajes</Text>
            ) : (
                filteredMessages.map((item, index) => (
                    <View key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm">
                        <Text className="flex-1 text-gray-800 dark:text-gray-100 text-base mr-2">"{item}"</Text>
                        <View className="flex-row gap-2">
                            <Button
                                title="Editar"
                                variant="outline"
                                size="sm"
                                onPress={() => startEditingMessage(index, item)}
                            />
                            <Button
                                title="Eliminar"
                                variant="outline"
                                size="sm"
                                onPress={() => confirmDeleteMessage(index)}
                                className="border-rose-200"
                                textClassName="text-rose-600"
                            />
                        </View>
                    </View>
                ))
            )}
        </View>
    );
};
