import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { TaskTags } from './TaskTags';
import { Task, User } from '../types';

interface ParentTaskCardProps {
    task: Task;
    users: User[];
    onVerify: (taskId: string) => void;
    onReject: (taskId: string) => void;
    onAssign: (task: Task) => void;
    onEdit?: (task: Task) => void;
    onConfirmDeleteMessage?: (index: number) => void; // Not used here but keeping interface clean
}

export const ParentTaskCard = ({ task, users, onVerify, onReject, onAssign, onEdit }: ParentTaskCardProps) => {
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

                <TaskTags task={task} />

                <View className="flex-row gap-2">
                    <Button
                        title="Asignar"
                        variant="primary"
                        size="sm"
                        onPress={() => onAssign(task)}
                        className="flex-1"
                    />
                    {onEdit && (
                        <Button
                            title="Editar"
                            variant="outline"
                            size="sm"
                            onPress={() => onEdit(task)}
                            className="flex-1"
                        />
                    )}
                </View>
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
                {(() => {
                    const assignedUser = users.find(u => u.id === task.assignedTo);
                    const userColor = assignedUser?.color || '#4338ca'; // Default indigo-700

                    return (
                        <View
                            style={{ backgroundColor: userColor + '20', borderColor: userColor + '50', borderWidth: 1 }}
                            className="px-2 py-1 rounded flex-row items-center"
                        >
                            <View style={{ backgroundColor: userColor }} className="w-2 h-2 rounded-full mr-1.5" />
                            <Text style={{ color: userColor }} className="text-xs font-semibold">
                                {assignedUser?.name || 'Sin asignar'}
                            </Text>
                        </View>
                    );
                })()}

                <TaskTags task={task} showTime={true} />
            </View>

            <View className="flex-row justify-end items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                {/* Actions for Parents: Verify if pending OR completed (but not verified) */}
                {(task.status === 'pending' || awaitingVerification) && !isVerified && (
                    <View className="flex-row gap-2">
                        {/* Only show Reject if it was marked completed (awaiting verification) or if we want to cancel a pending task? 
                            Let's keep Reject mainly for "You did it wrong" after completion. 
                            But for pending, maybe "Delete"? The user asked to "validate without child saying I did it".
                            So "Force Verify" is the key.
                        */}

                        {awaitingVerification && (
                            <Button
                                title="Rechazar"
                                size="sm"
                                variant="outline"
                                onPress={() => onReject(task.id)}
                                className="border-rose-200"
                                textClassName="text-rose-600"
                            />
                        )}

                        <Button
                            title={awaitingVerification ? "Verificar" : "Marcar Hecho y Verificar"}
                            size="sm"
                            variant={awaitingVerification ? "primary" : "secondary"}
                            onPress={() => onVerify(task.id)}
                            className={awaitingVerification ? "bg-green-600" : "bg-indigo-600"}
                        />
                    </View>
                )}
            </View>
        </Card>
    );
};
