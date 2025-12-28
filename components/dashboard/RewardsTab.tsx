import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, FlatList } from 'react-native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';

export const RewardsTab = () => {
    const { rewards, addReward, deleteReward, redemptions, approveRedemption, rejectRedemption, currentUser, users } = useTaskContext();
    const [title, setTitle] = useState('');
    const [cost, setCost] = useState('');
    const [icon, setIcon] = useState('🎁');

    const pendingRedemptions = redemptions.filter(r => r.status === 'pending');

    const handleAddReward = () => {
        if (!title.trim() || !cost || isNaN(Number(cost))) {
            if (Platform.OS === 'web') window.alert("Ingresa un título válido y costo en puntos.");
            else Alert.alert("Error", "Ingresa un título válido y costo en puntos.");
            return;
        }

        addReward({
            title,
            cost: Number(cost),
            icon,
            createdBy: currentUser?.id || '',
        });

        setTitle('');
        setCost('');
        if (Platform.OS === 'web') window.alert("Premio agregado");
        else Alert.alert("Éxito", "Premio agregado");
    };

    const confirmDelete = (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Eliminar este premio?")) deleteReward(id);
        } else {
            Alert.alert("Eliminar", "¿Eliminar este premio?", [
                { text: "Cancelar" },
                { text: "Eliminar", style: 'destructive', onPress: () => deleteReward(id) }
            ]);
        }
    };

    const confirmApprove = (id: string, cost: number) => {
        if (Platform.OS === 'web') {
            if (window.confirm(`¿Aprobar canje y restar ${cost} puntos?`)) approveRedemption(id);
        } else {
            Alert.alert("Aprobar Canje", `¿Aprobar canje y restar ${cost} puntos?`, [
                { text: "Cancelar" },
                { text: "Aprobar", onPress: () => approveRedemption(id) }
            ]);
        }
    };

    return (
        <View className="flex-1 p-6 pb-24">
            {/* Pending Redemptions */}
            {pendingRedemptions.length > 0 && (
                <View className="mb-8">
                    <Text className="text-lg font-bold mb-4 text-brand-text-primary dark:text-brand-text-light">⏳ Solicitudes de Canje</Text>
                    {pendingRedemptions.map(req => {
                        const childName = users.find(u => u.id === req.childId)?.name || 'Hijo';
                        return (
                            <View key={req.id} className="bg-amber-50 dark:bg-gray-800 border border-amber-200 dark:border-amber-900 p-4 rounded-xl mb-3">
                                <View className="flex-row justify-between items-start mb-3">
                                    <View>
                                        <Text className="text-lg font-bold text-gray-900 dark:text-white">{req.rewardTitle}</Text>
                                        <Text className="text-gray-500 dark:text-gray-400">Solicitado por: <Text className="font-bold">{childName}</Text></Text>
                                    </View>
                                    <View className="bg-amber-100 dark:bg-amber-900 px-3 py-1 rounded-full">
                                        <Text className="text-amber-800 dark:text-amber-200 font-bold">-{req.cost} pts</Text>
                                    </View>
                                </View>
                                <View className="flex-row gap-2">
                                    <Button title="✅ Aprobar" onPress={() => confirmApprove(req.id, req.cost)} className="flex-1 bg-green-600" size="sm" />
                                    <Button title="❌ Rechazar" onPress={() => rejectRedemption(req.id)} variant="outline" className="flex-1 border-rose-200" textClassName="text-rose-600" size="sm" />
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Create Reward */}
            <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
                <Text className="text-lg font-bold mb-4 text-brand-text-primary dark:text-brand-text-light">Nuevo Premio</Text>

                <View className="flex-row gap-3">
                    <TextInput
                        value={icon}
                        onChangeText={setIcon}
                        placeholder="🎁"
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 text-center text-xl w-14"
                    />
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Título del premio (ej. 1hr Videojuegos)"
                        className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3"
                    />
                </View>

                <TextInput
                    value={cost}
                    onChangeText={setCost}
                    placeholder="Costo en Puntos (ej. 50)"
                    keyboardType="numeric"
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3"
                />

                <Button title="Agregar Premio a la Tienda" onPress={handleAddReward} />
            </View>

            <Text className="text-lg font-bold mb-4 text-brand-text-primary dark:text-brand-text-light">Premios Activos</Text>

            <View className="flex-row flex-wrap gap-3">
                {rewards.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        onLongPress={() => confirmDelete(item.id)}
                        style={{ width: '48%' }}
                        className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-3 relative"
                    >
                        <Text className="text-3xl mb-2 text-center">{item.icon || '🎁'}</Text>
                        <Text className="font-bold text-center text-gray-800 dark:text-white mb-1">{item.title}</Text>
                        <Text className="text-center text-gray-500 text-xs text-brand-primary font-bold">{item.cost} Pts</Text>

                        {/* Delete Indicator */}
                        <View className="absolute top-2 right-2">
                            {/* Could add a trash icon here */}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
            {rewards.length === 0 && (
                <Text className="text-center text-gray-400 mt-4">No hay premios configurados.</Text>
            )}
            {rewards.length > 0 && (
                <Text className="text-center text-gray-400 mt-8 text-xs">Mantén presionado un premio para eliminarlo.</Text>
            )}
        </View>
    );
};
