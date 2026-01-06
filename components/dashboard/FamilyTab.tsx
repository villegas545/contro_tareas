import React, { useState } from 'react';
import { View, Text, TextInput, Platform, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';

export const FamilyTab = () => {
    const { users, deleteUser } = useTaskContext();
    const navigation = useNavigation<any>();
    const children = users.filter(u => u.role === 'child');

    const confirmDeleteUser = (userId: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de eliminar a este usuario? Se perderá su historial.")) {
                deleteUser(userId);
            }
        } else {
            Alert.alert(
                "Confirmar Eliminación",
                "¿Estás seguro de eliminar a este usuario? Se perderá su historial.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: 'destructive', onPress: () => deleteUser(userId) }
                ]
            );
        }
    };

    return (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800 dark:text-white">Mi Familia</Text>
                <Button
                    title="+ Agregar Familiar"
                    onPress={() => navigation.navigate('AddFamilyMember')}
                    size="sm"
                />
            </View>

            {children.length === 0 ? (
                <View className="py-10 items-center">
                    <Text className="text-gray-400 text-center text-lg">No hay hijos registrados aún.</Text>
                    <Text className="text-gray-400 text-center text-sm mt-2">Agrega uno para empezar a asignar tareas.</Text>
                </View>
            ) : (
                children.map(item => (
                    <View key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm">
                        <View className="flex-row items-center gap-3">
                            <View style={{ backgroundColor: item.color || '#4338ca' }} className="w-10 h-10 rounded-full items-center justify-center">
                                <Text className="text-white font-bold text-lg">{item.name.charAt(0)}</Text>
                            </View>
                            <View>
                                <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">{item.name}</Text>
                                <Text className="text-gray-500 dark:text-gray-400 text-sm">@{item.username}</Text>
                            </View>
                        </View>
                        <View className="flex-row gap-2">
                            <Button
                                title="Editar"
                                variant="outline"
                                size="sm"
                                onPress={() => navigation.navigate('AddFamilyMember', { userToEdit: item })}
                            />
                            <Button
                                title="Eliminar"
                                variant="outline"
                                size="sm"
                                onPress={() => confirmDeleteUser(item.id)}
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
