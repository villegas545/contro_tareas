import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';

export default function LoginScreen() {
    const { login } = useTaskContext();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (!username || !password) {
            Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
            return;
        }

        const success = login(username, password);
        if (!success) {
            Alert.alert('Error', 'Credenciales incorrectas');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                    <View className="items-center mb-12">
                        <View className="w-20 h-20 bg-indigo-600 rounded-3xl items-center justify-center mb-4 transform rotate-3 shadow-lg shadow-indigo-500/30">
                            <Text className="text-4xl text-white">✓</Text>
                        </View>
                        <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                            Control de Tareas
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
                            Ingresa tus credenciales
                        </Text>
                    </View>

                    <View className="gap-4">
                        <View>
                            <Text className="text-gray-700 font-medium mb-1">Usuario</Text>
                            <TextInput
                                className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                                placeholder="Usuario (ej. papa, hijo1)"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        <View>
                            <Text className="text-gray-700 font-medium mb-1">Contraseña</Text>
                            <TextInput
                                className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                                placeholder="Contraseña (ej. 123)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <Button title="Entrar" onPress={handleLogin} className="mt-4" />

                        <View className="mt-4 items-center">
                            <Text className="text-gray-400 text-sm">Usuarios de prueba:</Text>
                            <Text className="text-gray-400 text-xs">papa / 123</Text>
                            <Text className="text-gray-400 text-xs">hijo1 / 123</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
