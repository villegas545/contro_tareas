import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// Static asset import for better web compatibility
const taskLogo = require('../assets/task_logo.jpg');

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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        entering={FadeInUp.delay(200).duration(1000).springify()}
                        className="items-center mb-8"
                    >
                        <View className="shadow-2xl shadow-brand-primary/40 bg-white rounded-[3rem] p-1">
                            <Image
                                source={taskLogo}
                                style={{ width: 140, height: 140, borderRadius: 40 }}
                                resizeMode="cover"
                            />
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(400).duration(1000).springify()}
                        className="bg-white/95 dark:bg-zinc-800/95 p-8 rounded-[2rem] shadow-xl border border-white/20"
                    >
                        <View className="mb-8">
                            <Text className="text-3xl font-extrabold text-brand-primary text-center mb-2">
                                Control de Tareas
                            </Text>
                            <Text className="text-brand-text-secondary dark:text-brand-text-muted text-center text-base">
                                ¡Bienvenido de nuevo! 👋
                            </Text>
                        </View>

                        <View className="gap-5">
                            <View>
                                <Text className="text-sm font-bold text-brand-text-primary dark:text-brand-text-light ml-1 mb-2 uppercase tracking-wide opacity-80">
                                    Usuario
                                </Text>
                                <TextInput
                                    className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-lg text-brand-text-primary dark:text-white"
                                    placeholder="Ej. papa, hijo1"
                                    placeholderTextColor="#9CA3AF"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View>
                                <Text className="text-sm font-bold text-brand-text-primary dark:text-brand-text-light ml-1 mb-2 uppercase tracking-wide opacity-80">
                                    Contraseña
                                </Text>
                                <TextInput
                                    className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-gray-200 dark:border-zinc-700 text-lg text-brand-text-primary dark:text-white"
                                    placeholder="••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <Button
                                title="Iniciar Sesión"
                                onPress={handleLogin}
                                className="mt-4 shadow-lg shadow-brand-primary/30 py-4"
                                size="lg"
                            />
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
