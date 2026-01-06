import React, { useState } from 'react';
import { View, Text, TextInput, Platform, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';

export const MessagesTab = () => {
    const { messages, deleteMessage } = useTaskContext();
    const navigation = useNavigation<any>();
    const [messagesSearch, setMessagesSearch] = useState('');

    const filteredMessages = messages.filter(m =>
        m.toLowerCase().includes(messagesSearch.toLowerCase())
    );

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
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
            <View className="flex-row justify-between items-center mb-6 flex-wrap gap-2">
                <Text className="text-xl font-bold text-gray-800 dark:text-white shrink">Mensajes y Recordatorios</Text>
                <Button
                    title="+ Nuevo"
                    onPress={() => navigation.navigate('AddMessage')}
                    size="sm"
                />
            </View>

            <SearchInput
                placeholder="Buscar mensajes..."
                value={messagesSearch}
                onChangeText={setMessagesSearch}
            />

            {filteredMessages.length === 0 ? (
                <View className="py-10 items-center">
                    <Text className="text-gray-400 text-center text-lg">No se encontraron mensajes</Text>
                    <Text className="text-gray-400 text-center text-sm mt-2">Agrega mensajes motivacionales o recordatorios para tus hijos.</Text>
                </View>
            ) : (
                filteredMessages.map((item, index) => (
                    <View key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm">
                        <Text className="flex-1 text-gray-800 dark:text-gray-100 text-base mr-2" numberOfLines={2}>"{item}"</Text>
                        <View className="flex-row gap-2">
                            <Button
                                title="Editar"
                                variant="outline"
                                size="sm"
                                onPress={() => navigation.navigate('AddMessage', { messageToEdit: item, indexToEdit: index })}
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
        </ScrollView>
    );
};
