
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { useTaskContext } from '../context/TaskContext';

export const ManageJustificationsScreen = () => {
    const { justificationReasons, addJustificationReason, deleteJustificationReason } = useTaskContext();
    const [text, setText] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    const handleSave = async () => {
        if (!text.trim()) {
            Alert.alert("Error", "El texto es obligatorio");
            return;
        }
        await addJustificationReason(text);
        setText('');
        setModalVisible(false);
    };

    const handleDelete = (id: string, reasonText: string) => {
        Alert.alert(
            "Eliminar Razón",
            `¿Estás seguro de eliminar "${reasonText}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => await deleteJustificationReason(id)
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-white dark:bg-slate-900">
            <ScrollView className="flex-1 p-4">
                <Text className="text-gray-500 mb-4 dark:text-gray-400">
                    Define las opciones que aparecerán cuando tus hijos necesiten justificar una tarea no realizada.
                </Text>

                {justificationReasons.map((reason) => (
                    <View
                        key={reason.id}
                        className="flex-row items-center justify-between p-4 mb-2 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700"
                    >
                        <Text className="text-lg text-gray-800 dark:text-white flex-1 mr-2">{reason.text}</Text>
                        <TouchableOpacity
                            onPress={() => handleDelete(reason.id, reason.text)}
                            className="bg-red-100 p-2 rounded-lg"
                        >
                            <Text>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {justificationReasons.length === 0 && (
                    <Text className="text-center text-gray-400 mt-10 italic">No hay razones configuradas aún.</Text>
                )}
            </ScrollView>

            <View className="p-4 border-t border-gray-100 dark:border-slate-800">
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    className="bg-indigo-600 p-4 rounded-xl items-center"
                >
                    <Text className="text-white font-bold text-lg">+ Nueva Razón</Text>
                </TouchableOpacity>
            </View>

            {/* Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold dark:text-white">Nueva Justificación</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text className="text-blue-500 text-lg">Cerrar</Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="font-bold mb-2 dark:text-gray-300">Razón</Text>
                        <TextInput
                            className="bg-gray-100 dark:bg-slate-700 p-4 rounded-xl mb-6 text-lg dark:text-white"
                            placeholder="Ej: Tenía mucha tarea escolar..."
                            value={text}
                            onChangeText={setText}
                            autoFocus
                        />

                        <TouchableOpacity
                            onPress={handleSave}
                            className="bg-indigo-600 p-4 rounded-xl items-center mb-4"
                        >
                            <Text className="text-white font-bold text-lg">Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
