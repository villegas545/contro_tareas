import React from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { Card } from './ui/Card';
import { Task } from '../types';

interface ChildTaskCardProps {
    item: Task;
    onComplete: (task: Task) => void;
}

export const ChildTaskCard = ({ item, onComplete }: ChildTaskCardProps) => {
    const isPending = item.status === 'pending';

    return (
        <Card className={`mb-4 border-l-4 ${item.status === 'verified' ? 'border-green-500 opacity-60' : 'border-indigo-500'}`}>
            <View className="flex-row items-center">
                <View className="flex-1">
                    <Text className={`text-lg font-bold ${item.status === 'verified' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {item.title}
                    </Text>
                    {item.description && (
                        <Text className="text-gray-500 text-sm mt-1">{item.description}</Text>
                    )}
                    {item.points && (
                        <Text className="text-amber-500 font-bold text-sm mt-1">+{item.points} Pts ⭐️</Text>
                    )}
                </View>
            </View>

            {isPending && (
                <View className="mt-4">
                    <TouchableOpacity
                        onPress={() => onComplete(item)}
                        className="bg-indigo-600 px-4 py-3 rounded-xl items-center justify-center shadow-sm active:opacity-80"
                    >
                        <Text className="text-white font-bold font-semibold">¡Ya lo hice!</Text>
                    </TouchableOpacity>
                </View>
            )}

            {item.status === 'completed' && (
                <View className="mt-4 bg-amber-50 p-2 rounded items-center">
                    <Text className="text-amber-600 font-medium">Esperando revisión de papá/mamá ⏳</Text>
                </View>
            )}

            {item.status === 'verified' && (
                <View className="mt-4 bg-green-50 p-2 rounded items-center">
                    <Text className="text-green-600 font-bold">¡Bien hecho! ✅</Text>
                </View>
            )}
        </Card>
    );
};
