import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Task, User } from '../types';

interface ParentTaskCardProps {
    task: Task;
    users: User[];
    onVerify: (taskId: string) => void;
    onReject: (taskId: string) => void;
    onAssign: (task: Task) => void;
    onConfirmDeleteMessage?: (index: number) => void; // Not used here but keeping interface clean
}

export const ParentTaskCard = ({ task, users, onVerify, onReject, onAssign }: ParentTaskCardProps) => {
    const isVerified = task.status === 'verified';
    const isCompleted = task.status === 'completed';
    const awaitingVerification = isCompleted && !isVerified;

    // Different style for Pool Tasks (Templates)
    if (task.assignedTo === 'pool') {
        return (
            <Card className="mb-4 bg-white dark:bg-slate-800 border-l-4 border-gray-400">
                <View className="mb-2">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">{task.title}</Text>
                    <Text className="text-gray-500 text-sm mt-1">{task.description}</Text>
                </View>

                <View className="flex-row flex-wrap gap-2 mb-3">
                    <Text className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                        🔄 {task.frequency === 'daily' ? 'Diario' : task.frequency === 'weekly' ? 'Semanal' : 'Una vez'}
                    </Text>
                    {task.points && (
                        <Text className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                            ⭐️ {task.points} pts
                        </Text>
                    )}
                    <Text className={`text-xs px-2 py-1 rounded capitalize ${task.type === 'obligatory' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                        {task.type === 'obligatory' ? '✋ Obligatoria' : '🎁 Adicional'}
                    </Text>
                </View>

                <Button
                    title="Asignar"
                    variant="primary"
                    size="sm"
                    onPress={() => onAssign(task)}
                />
            </Card>
        );
    }

    // Standard Task Card (Monitoring)
    return (
        <Card className="mb-4 bg-white dark:bg-slate-800 border-l-4 border-l-indigo-500">
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">{task.title}</Text>
                    <Text className="text-gray-500 text-sm mt-1">{task.description}</Text>
                </View>
                <View className={`px-2 py-1 rounded text-xs ${task.status === 'verified' ? 'bg-green-100 text-green-700' :
                    task.status === 'completed' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                    <Text className="text-xs font-semibold capitalize">{task.status}</Text>
                </View>
            </View>

            {/* Details Section */}
            <View className="mt-2 flex-row flex-wrap gap-2">
                <Text className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                    👶 {users.find(u => u.id === task.assignedTo)?.name || 'Sin asignar'}
                </Text>

                {task.timeWindow ? (
                    <Text className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        ⏰ {task.timeWindow.start} - {task.timeWindow.end}
                    </Text>
                ) : task.dueTime ? (
                    <Text className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        ⏰ {task.dueTime}
                    </Text>
                ) : null}

                <Text className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded capitalize">
                    {task.frequency === 'daily' ? '📅 Diario' : task.frequency === 'weekly' ? '🗓 Semanal' : '📌 Una vez'}
                </Text>

                {task.points && (
                    <Text className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                        ⭐️ {task.points} pts
                    </Text>
                )}

                <Text className={`text-xs px-2 py-1 rounded capitalize ${task.type === 'obligatory' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                    {task.type === 'obligatory' ? '✋ Obligatoria' : '🎁 Adicional'}
                </Text>
            </View>

            <View className="flex-row justify-end items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                {awaitingVerification && (
                    <View className="flex-row gap-2">
                        <Button
                            title="Rechazar"
                            size="sm"
                            variant="outline"
                            onPress={() => onReject(task.id)}
                            className="border-rose-200"
                            textClassName="text-rose-600"
                        />
                        <Button
                            title="Verificar"
                            size="sm"
                            variant="primary"
                            onPress={() => onVerify(task.id)}
                        />
                    </View>
                )}
            </View>
        </Card>
    );
};
