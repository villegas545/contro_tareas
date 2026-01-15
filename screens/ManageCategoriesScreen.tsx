
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Category } from '../types';

export const ManageCategoriesScreen = () => {
    const { categories, addCategory, updateCategory, deleteCategory, reorderCategories } = useTaskContext();
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📂');
    const [color, setColor] = useState('#4f46e5');

    const openAddModal = () => {
        setEditingCategory(null);
        setName('');
        setIcon('📂');
        setColor('#4f46e5');
        setModalVisible(true);
    };

    const openEditModal = (cat: Category) => {
        setEditingCategory(cat);
        setName(cat.name);
        setIcon(cat.icon);
        setColor(cat.color || '#4f46e5');
        setModalVisible(true);
    };

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert("Error", "El nombre es obligatorio");
            return;
        }

        if (editingCategory) {
            updateCategory(editingCategory.id, { name, icon, color });
        } else {
            addCategory({ name, icon, color, order: 999 });
        }
        setModalVisible(false);
    };

    const handleDelete = (cat: Category) => {
        Alert.alert(
            "Eliminar Categoría",
            `¿Estás seguro de eliminar "${cat.name}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: () => deleteCategory(cat.id)
                }
            ]
        );
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === categories.length - 1) return;

        const newOrder = [...categories];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];

        reorderCategories(newOrder);
    };

    const renderColorOption = (c: string) => (
        <TouchableOpacity
            onPress={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={`w-8 h-8 rounded-full ${color === c ? 'border-4 border-gray-300' : ''}`}
        />
    );

    return (
        <View className="flex-1 bg-white dark:bg-slate-900">
            <ScrollView className="flex-1 p-4">
                <Text className="text-gray-500 mb-4 dark:text-gray-400">
                    Ordena las categorías usando las flechas. El orden aquí será el mismo que verán tus hijos.
                </Text>

                {categories.map((cat, index) => (
                    <View
                        key={cat.id}
                        className="flex-row items-center justify-between p-4 mb-2 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700"
                    >
                        <View className="flex-row items-center gap-3 flex-1">
                            <View className="w-10 h-10 rounded-full items-center justify-center bg-white dark:bg-slate-700">
                                <Text className="text-2xl">{cat.icon}</Text>
                            </View>
                            <View>
                                <Text className="text-lg font-bold text-gray-800 dark:text-white">{cat.name}</Text>
                                {/* Color dot */}
                                <View style={{ backgroundColor: cat.color }} className="w-3 h-3 rounded-full mt-1" />
                            </View>
                        </View>

                        <View className="flex-row items-center gap-1">
                            {/* Reorder Controls */}
                            <View className="flex-col mr-2 bg-gray-200 dark:bg-slate-700 rounded-lg p-1">
                                <TouchableOpacity
                                    onPress={() => handleMove(index, 'up')}
                                    disabled={index === 0}
                                    className={`p-1 ${index === 0 ? 'opacity-30' : ''}`}
                                >
                                    <Text className="text-xs">▲</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleMove(index, 'down')}
                                    disabled={index === categories.length - 1}
                                    className={`p-1 ${index === categories.length - 1 ? 'opacity-30' : ''}`}
                                >
                                    <Text className="text-xs">▼</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={() => openEditModal(cat)}
                                className="bg-blue-100 p-2 rounded-lg"
                            >
                                <Text>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleDelete(cat)}
                                className="bg-red-100 p-2 rounded-lg ml-1"
                            >
                                <Text>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View className="p-4 border-t border-gray-100 dark:border-slate-800">
                <TouchableOpacity
                    onPress={openAddModal}
                    className="bg-indigo-600 p-4 rounded-xl items-center"
                >
                    <Text className="text-white font-bold text-lg">+ Nueva Categoría</Text>
                </TouchableOpacity>
            </View>

            {/* Modal for Add/Edit */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6 h-[70%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold dark:text-white">
                                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text className="text-blue-500 text-lg">Cerrar</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text className="font-bold mb-2 dark:text-gray-300">Nombre</Text>
                            <TextInput
                                className="bg-gray-100 dark:bg-slate-700 p-4 rounded-xl mb-6 text-lg dark:text-white"
                                placeholder="Ej: Escuela, Hogar..."
                                value={name}
                                onChangeText={setName}
                            />

                            <Text className="font-bold mb-2 dark:text-gray-300">Icono (Emoji)</Text>
                            <TextInput
                                className="bg-gray-100 dark:bg-slate-700 p-4 rounded-xl mb-6 text-lg dark:text-white"
                                placeholder="Ej: 📚"
                                value={icon}
                                onChangeText={setIcon}
                                maxLength={2}
                            />

                            <Text className="font-bold mb-2 dark:text-gray-300">Color</Text>
                            <View className="flex-row flex-wrap gap-2 mb-8">
                                {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', '#ec4899', '#64748b'].map(renderColorOption)}
                            </View>

                            <TouchableOpacity
                                onPress={handleSave}
                                className="bg-indigo-600 p-4 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold text-lg">Guardar</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
