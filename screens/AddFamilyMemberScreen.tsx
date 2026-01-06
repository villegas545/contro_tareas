import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';

export default function AddFamilyMemberScreen({ navigation, route }: any) {
    const { users, addUser, updateUser } = useTaskContext();
    const editingUser = route.params?.userToEdit;

    const [name, setName] = useState(editingUser?.name || '');
    const [username, setUsername] = useState(editingUser?.username || '');
    const [password, setPassword] = useState('');
    const [color, setColor] = useState(editingUser?.color || '#ef4444');

    const COLORS = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
        '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
    ];

    useEffect(() => {
        if (editingUser) {
            setName(editingUser.name);
            setUsername(editingUser.username);
            setColor(editingUser.color || '#ef4444');
        }
    }, [editingUser]);

    const handleSave = () => {
        if (!name || !username || (!password && !editingUser)) {
            if (Platform.OS === 'web') window.alert("Todos los campos son obligatorios (contraseña opcional al editar)");
            else Alert.alert("Error", "Todos los campos son obligatorios");
            return;
        }

        if (!editingUser) {
            // Check duplicate
            if (users.some(u => u.username === username)) {
                if (Platform.OS === 'web') window.alert("El usuario ya existe");
                else Alert.alert("Error", "El usuario ya existe");
                return;
            }

            addUser({
                name,
                username,
                password,
                role: 'child',
                color,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username
            });
            Alert.alert("Éxito", "Hijo agregado correctamente");
        } else {
            updateUser(editingUser.id, {
                name,
                username,
                ...(password ? { password } : {}),
                color
            });
            Alert.alert("Éxito", "Información actualizada");
        }
        navigation.goBack();
    };

    return (
        <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-6">
            <Text className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
                {editingUser ? "Editar Familiar" : "Agregar Nuevo Familiar"}
            </Text>

            <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-1">Nombre</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej. Juanito"
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-base"
                />
            </View>

            <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-1">Usuario (para login)</Text>
                <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Ej. juanito123"
                    autoCapitalize="none"
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-base"
                />
            </View>

            <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-1">Contraseña</Text>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={editingUser ? "Dejar en blanco para mantener actual" : "Crear contraseña"}
                    secureTextEntry
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-base"
                />
            </View>

            <View className="mb-8">
                <Text className="text-gray-700 font-medium mb-2">Color Identificador:</Text>
                <View className="flex-row flex-wrap gap-3 justify-center">
                    {COLORS.map(c => (
                        <TouchableOpacity
                            key={c}
                            onPress={() => setColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-10 h-10 rounded-full ${color === c ? 'border-4 border-gray-800 dark:border-white scale-110' : ''}`}
                        />
                    ))}
                </View>
            </View>

            <View className="gap-3">
                <Button title={editingUser ? "Guardar Cambios" : "Agregar Familiar"} onPress={handleSave} size="lg" />
                <Button title="Cancelar" variant="outline" onPress={() => navigation.goBack()} size="lg" />
            </View>
        </ScrollView>
    );
}
