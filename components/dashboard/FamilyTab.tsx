import React from 'react';
import { View, Text, Platform, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';

export const FamilyTab = () => {
    const { users, deleteUser } = useTaskContext();
    const navigation = useNavigation<any>();
    const children = users.filter(u => u.role === 'child');
    const parents = users.filter(u => u.role !== 'child');

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

    const renderUserList = (list: typeof users, title: string, emptyMsg: string) => (
        <View className="mb-6">
            <Text className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">{title}</Text>
            {list.length === 0 ? (
                <View className="py-4 items-center bg-gray-50 rounded-xl border-dashed border border-gray-200">
                    <Text className="text-gray-400 italic">{emptyMsg}</Text>
                </View>
            ) : (
                list.map(item => (
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
        </View>
    );

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

            {renderUserList(parents, "Padres / Tutores", "No hay padres registrados.")}
            {renderUserList(children, "Hijos", "No hay hijos registrados aún.")}
        </ScrollView>
    );
};
