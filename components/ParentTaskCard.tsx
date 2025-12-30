import React from 'react';
import { View, Text, Image, Modal, TouchableOpacity } from 'react-native';
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
    onDelete?: (taskId: string) => void;
    onConfirmDeleteMessage?: (index: number) => void; // Not used here but keeping interface clean
    showAssignAction?: boolean;
}

export const ParentTaskCard = ({ task, users, onVerify, onReject, onAssign, onEdit, onDelete, showAssignAction = true }: ParentTaskCardProps) => {
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

                <TaskTags task={task} showTime={true} />

                <View className="flex-row gap-2 mt-3">
                    {showAssignAction && (
                        <Button
                            title="Asignar"
                            variant="primary"
                            size="sm"
                            onPress={() => onAssign(task)}
                            className="flex-1"
                        />
                    )}
                    {onEdit && (
                        <Button
                            title="Editar"
                            variant="outline"
                            size="sm"
                            onPress={() => onEdit(task)}
                            className="flex-1"
                        />
                    )}
                    {onDelete && (
                        <Button
                            title="Eliminar"
                            variant="outline"
                            size="sm"
                            onPress={() => onDelete(task.id)}
                            className="flex-1 border-red-200"
                            textClassName="text-red-600"
                        />
                    )}
                </View>
            </Card>
        );
    }

    const [imageModalVisible, setImageModalVisible] = React.useState(false);

    // Standard Task Card (Monitoring)
    return (
        <>
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

                {task.evidenceUrl && (
                    <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                        <View className="mt-4 mb-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <Image
                                source={{ uri: task.evidenceUrl }}
                                style={{ width: '100%', height: 200, resizeMode: 'cover' }}
                            />
                            <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                                <Text className="text-white text-xs text-center font-medium">📸 Toca para ampliar evidencia</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}

                <View className="flex-row justify-end items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {/* Actions for Parents: Verify if pending OR completed (but not verified) */}
                    {(task.status === 'pending' || awaitingVerification || task.status === 'expired') && !isVerified && (
                        <View className="flex-row gap-2 flex-wrap justify-end">
                            {onDelete && (
                                <Button
                                    title="Desasignar"
                                    size="sm"
                                    variant="outline"
                                    onPress={() => onDelete(task.id)}
                                    className="border-gray-300 mr-auto" // Push to left
                                    textClassName="text-gray-500"
                                />
                            )}

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

            {/* Full Screen Image Modal */}
            <Modal visible={imageModalVisible} transparent={true} onRequestClose={() => setImageModalVisible(false)} animationType="fade">
                <View className="flex-1 bg-black justify-center items-center relative">
                    <TouchableOpacity
                        onPress={() => setImageModalVisible(false)}
                        className="absolute top-12 right-6 z-10 bg-black/50 p-2 rounded-full"
                    >
                        <Text className="text-white text-xl font-bold">✕</Text>
                    </TouchableOpacity>

                    {task.evidenceUrl && (
                        <Image
                            source={{ uri: task.evidenceUrl }}
                            style={{ width: '100%', height: '80%', resizeMode: 'contain' }}
                        />
                    )}
                </View>
            </Modal>
        </>
    );
};
