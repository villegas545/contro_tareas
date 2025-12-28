import React, { useState } from 'react';
import { View, Text, TextInput, Platform, Alert } from 'react-native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';

export const FamilyTab = () => {
    const { users, addUser, updateUser, deleteUser } = useTaskContext();
    const children = users.filter(u => u.role === 'child');

    const [newChildName, setNewChildName] = useState('');
    const [newChildUsername, setNewChildUsername] = useState('');
    const [newChildPassword, setNewChildPassword] = useState('');
    const [editingChildId, setEditingChildId] = useState<string | null>(null);

    const handleAddUser = () => {
        if (!newChildName || !newChildUsername || (!newChildPassword && !editingChildId)) {
            if (Platform.OS === 'web') window.alert("Todos los campos obligatorios (contraseña opcional solo al editar)");
            else Alert.alert("Error", "Todos los campos obligatorios");
            return;
        }

        if (!editingChildId) {
            const usernameExists = users.some(u => u.username === newChildUsername && u.id !== editingChildId);
            if (usernameExists) {
                if (Platform.OS === 'web') window.alert("Este nombre de usuario ya existe");
                else Alert.alert("Error", "Este nombre de usuario ya existe");
                return;
            }

            addUser({
                name: newChildName,
                username: newChildUsername,
                password: newChildPassword,
                role: 'child',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + newChildUsername
            });
            if (Platform.OS === 'web') window.alert("Hijo agregado correctamente");
            else Alert.alert("Éxito", "Hijo agregado correctamente");
        } else {
            // Update
            updateUser(editingChildId, {
                name: newChildName,
                username: newChildUsername,
                ...(newChildPassword ? { password: newChildPassword } : {})
            });
            setEditingChildId(null);
            if (Platform.OS === 'web') window.alert("Información actualizada");
            else Alert.alert("Éxito", "Información actualizada");
        }

        setNewChildName('');
        setNewChildUsername('');
        setNewChildPassword('');
    };

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

    const startEditingUser = (user: any) => {
        setEditingChildId(user.id);
        setNewChildName(user.name);
        setNewChildUsername(user.username);
        setNewChildPassword('');
    };

    const cancelEditingUser = () => {
        setEditingChildId(null);
        setNewChildName('');
        setNewChildUsername('');
        setNewChildPassword('');
    };

    return (
        <View className="flex-1 p-6 pb-24">
            <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
                <Text className="text-lg font-bold mb-4 text-brand-text-primary dark:text-brand-text-light">{editingChildId ? "Editar Información del Hijo" : "Agregar Nuevo Hijo"}</Text>
                <TextInput
                    value={newChildName}
                    onChangeText={setNewChildName}
                    placeholder="Nombre del hijo"
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 text-base"
                />
                <TextInput
                    value={newChildUsername}
                    onChangeText={setNewChildUsername}
                    placeholder="Nombre de usuario (Login)"
                    autoCapitalize="none"
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 text-base"
                />
                <TextInput
                    value={newChildPassword}
                    onChangeText={setNewChildPassword}
                    placeholder={editingChildId ? "Nueva Contraseña (opcional)" : "Contraseña"}
                    secureTextEntry
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 text-base"
                />
                <View className="flex-row gap-2">
                    <Button title={editingChildId ? "Actualizar Hijo" : "Agregar Hijo"} onPress={handleAddUser} className="flex-1" />
                    {editingChildId && (
                        <Button title="Cancelar" variant="outline" onPress={cancelEditingUser} className="flex-1" />
                    )}
                </View>
            </View>

            <Text className="text-lg font-bold mb-4 text-brand-text-primary dark:text-brand-text-light">Lista de Hijos</Text>
            {children.map(item => (
                <View key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm">
                    <View>
                        <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">{item.name}</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">@{item.username}</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <Button
                            title="Editar"
                            variant="outline"
                            size="sm"
                            onPress={() => startEditingUser(item)}
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
            ))}
        </View>
    );
};
