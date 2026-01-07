import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Platform, Alert, Modal, FlatList } from 'react-native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Category } from '../../types';

export const CategoriesTab = () => {
    const { categories, addCategory, deleteCategory } = useTaskContext();
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('📝');
    const [showIconPicker, setShowIconPicker] = useState(false);

    const icons = [
        '🌅', '☀️', '🌙', // Morning, Afternoon, Night (Requested)
        '🏠', '🧹', '🍽️', '🐶', '📚', '🎮', '⚽', '🤸', '🦷', '🧺',
        '💵', '🛒', '🛌', '🕰️', '🚗', '🎨', '🎹', '🏃', '🚿', '🪴',
        '💊', '🔧', '💻', '👕', '👠', '🧸', '📝', '✉️', '📞', '🎉'
    ];

    const handleCreate = () => {
        if (!newCategoryName.trim()) {
            if (Platform.OS === 'web') window.alert("Ingresa un nombre");
            else Alert.alert("Error", "Ingresa un nombre");
            return;
        }

        addCategory({
            name: newCategoryName,
            icon: selectedIcon,
            color: '#4338ca' // Default color for now 
        });

        setIsAdding(false);
        setNewCategoryName('');
        setSelectedIcon('📝');
    };

    const handleDelete = (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Eliminar categoría?")) deleteCategory(id);
        } else {
            Alert.alert(
                "Eliminar",
                "¿Estás seguro?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: () => deleteCategory(id) }
                ]
            );
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">Categorías</Text>
                    <Text className="text-gray-500 dark:text-gray-400">Organiza las tareas por temas</Text>
                </View>
                <Button
                    title="+ Crear"
                    onPress={() => setIsAdding(true)}
                />
            </View>

            {/* List */}
            <View className="flex-row flex-wrap gap-4">
                {categories.map(cat => (
                    <Card key={cat.id} className="w-[45%] aspect-square items-center justify-center p-4 relative">
                        <TouchableOpacity
                            onPress={() => handleDelete(cat.id)}
                            className="absolute top-2 right-2 bg-red-100 rounded-full w-6 h-6 items-center justify-center"
                        >
                            <Text className="text-red-500 font-bold">×</Text>
                        </TouchableOpacity>

                        <Text className="text-4xl mb-2">{cat.icon}</Text>
                        <Text className="font-bold text-center text-gray-800 dark:text-gray-200">{cat.name}</Text>
                    </Card>
                ))}

                {categories.length === 0 && (
                    <View className="w-full py-10 items-center">
                        <Text className="text-gray-400 text-center">No hay categorías.{'\n'}Crea una para comenzar.</Text>
                    </View>
                )}
            </View>

            {/* Modal */}
            <Modal visible={isAdding} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-center items-center p-4">
                    <View className="bg-white dark:bg-slate-800 w-full max-w-md p-6 rounded-2xl">
                        <Text className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Nueva Categoría</Text>

                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Nombre</Text>
                        <TextInput
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                            className="bg-gray-100 dark:bg-slate-700 p-3 rounded-xl mb-4 text-gray-900 dark:text-white"
                            placeholder="Ej. Tareas del Hogar"
                            placeholderTextColor="#9ca3af"
                        />

                        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Icono</Text>
                        <View className="mb-6">
                            <TouchableOpacity
                                onPress={() => setShowIconPicker(!showIconPicker)}
                                className="bg-gray-100 dark:bg-slate-700 p-4 rounded-xl items-center flex-row justify-between"
                            >
                                <Text className="text-3xl">{selectedIcon}</Text>
                                <Text className="text-gray-500">▼</Text>
                            </TouchableOpacity>

                            {showIconPicker && (
                                <View className="mt-2 bg-gray-50 dark:bg-slate-700 p-2 rounded-xl h-48">
                                    <ScrollView>
                                        <View className="flex-row flex-wrap justify-between">
                                            {icons.map(icon => (
                                                <TouchableOpacity
                                                    key={icon}
                                                    onPress={() => {
                                                        setSelectedIcon(icon);
                                                        setShowIconPicker(false);
                                                    }}
                                                    className="p-3 bg-white dark:bg-slate-600 rounded-lg mb-2"
                                                >
                                                    <Text className="text-2xl">{icon}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        <View className="flex-row gap-4">
                            <Button
                                title="Cancelar"
                                variant="outline"
                                onPress={() => setIsAdding(false)}
                                className="flex-1"
                            />
                            <Button
                                title="Guardar"
                                onPress={handleCreate}
                                className="flex-1"
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};
