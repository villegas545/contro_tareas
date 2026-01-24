import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/ui/Button';

export default function AddFamilyMemberScreen({ navigation, route }: any) {
    const { users, addUser, updateUser, t } = useTaskContext();
    const editingUser = route.params?.userToEdit;

    const [name, setName] = useState(editingUser?.name || '');
    const [username, setUsername] = useState(editingUser?.username || '');
    const [password, setPassword] = useState('');
    const [color, setColor] = useState(editingUser?.color || '#ef4444');
    const [role, setRole] = useState<'parent' | 'child'>(editingUser?.role || 'child');

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

    const handleSave = async () => {
        if (!name || !username || (!password && !editingUser)) {
            if (Platform.OS === 'web') window.alert(editingUser ? t('family_form.error_required') + " (password optional)" : t('family_form.error_required')); // Simplification for web alert
            else Alert.alert(t('common.error'), t('family_form.error_required'));
            return;
        }

        if (!editingUser) {
            // Check duplicate
            if (users.some(u => u.username === username)) {
                if (Platform.OS === 'web') window.alert(t('family_form.error_duplicate'));
                else Alert.alert(t('common.error'), t('family_form.error_duplicate'));
                return;
            }

            await addUser({
                name,
                username,
                password,
                role,
                color,
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username
            });
            Alert.alert(t('common.success'), t('family_form.success_added'));
        } else {
            await updateUser(editingUser.id, {
                name,
                username,
                ...(password ? { password } : {}),
                role,
                color
            });
            Alert.alert(t('common.success'), t('family_form.success_updated'));
        }
        navigation.goBack();
    };

    return (
        <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-6">
            <Text className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
                {editingUser ? t('family_form.title_edit') : t('family_form.title_new')}
            </Text>

            <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-1">{t('family_form.name_label')}</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t('family_form.name_placeholder')}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-base"
                />
            </View>

            <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-1">{t('family_form.username_label')}</Text>
                <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder={t('family_form.username_placeholder')}
                    autoCapitalize="none"
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-base"
                />
            </View>

            <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-1">{t('family_form.password_label')}</Text>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={editingUser ? t('family_form.password_placeholder_edit') : t('family_form.password_placeholder_new')}
                    secureTextEntry
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-base"
                />
            </View>

            <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-1">{t('family_form.role_label')}</Text>
                <View className="flex-row gap-4">
                    <TouchableOpacity
                        onPress={() => setRole('child')}
                        className={`flex-1 p-4 rounded-xl border flex-row items-center justify-center gap-2 ${role === 'child' ? 'bg-indigo-50 border-indigo-500' : 'bg-gray-50 border-gray-200'}`}
                    >
                        <Text className="text-2xl">👶</Text>
                        <Text className={`font-bold ${role === 'child' ? 'text-indigo-700' : 'text-gray-600'}`}>{t('family_form.role_child')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setRole('parent')}
                        className={`flex-1 p-4 rounded-xl border flex-row items-center justify-center gap-2 ${role === 'parent' ? 'bg-indigo-50 border-indigo-500' : 'bg-gray-50 border-gray-200'}`}
                    >
                        <Text className="text-2xl">👮‍♀️</Text>
                        <Text className={`font-bold ${role === 'parent' ? 'text-indigo-700' : 'text-gray-600'}`}>{t('family_form.role_parent')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="mb-8">
                <Text className="text-gray-700 font-medium mb-2">{t('family_form.color_label')}</Text>
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
                <Button title={editingUser ? t('family_form.save_edit') : t('family_form.save_new')} onPress={handleSave} size="lg" />
                <Button title={t('common.cancel')} variant="outline" onPress={() => navigation.goBack()} size="lg" />
            </View>
        </ScrollView>
    );
}
