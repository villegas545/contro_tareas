import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';

export default function LoginScreen() {
    const { login } = useTaskContext();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (!username || !password) {
            if (Platform.OS === 'web') {
                window.alert('Por favor ingresa usuario y contraseña');
            } else {
                Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
            }
            return;
        }

        const success = login(username, password);
        if (!success) {
            if (Platform.OS === 'web') {
                window.alert('Credenciales incorrectas');
            } else {
                Alert.alert('Error', 'Credenciales incorrectas');
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-brand-cream dark:bg-brand-dark">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                    <View className="items-center mb-12">
                        <Image
                            source={require('../assets/task_logo.png')}
                            className="w-32 h-32 mb-6 rounded-full"
                            style={{ width: 128, height: 128 }}
                            resizeMode="cover"
                        />
                        <Text className="text-3xl font-bold text-brand-text-primary dark:text-brand-text-light text-center">
                            Control de Tareas
                        </Text>
                        <Text className="text-brand-text-secondary dark:text-brand-text-muted mt-2 text-center">
                            Ingresa tus credenciales
                        </Text>
                    </View>

                    <View className="gap-4">
                        <View>
                            <Text className="text-brand-text-secondary font-medium mb-1">Usuario</Text>
                            <TextInput
                                className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                                placeholder="Usuario (ej. papa, hijo1)"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        <View>
                            <Text className="text-brand-text-secondary font-medium mb-1">Contraseña</Text>
                            <TextInput
                                className="bg-white p-4 rounded-xl border border-gray-200 text-lg"
                                placeholder="Contraseña (ej. 123)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <Button title="Entrar" onPress={handleLogin} className="mt-4" />


                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
