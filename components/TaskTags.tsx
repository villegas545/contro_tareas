import React from 'react';
import { View, Text } from 'react-native';
import { Task } from '../types';

interface TaskTagsProps {
    task: Task;
    showTime?: boolean;
}

export const TaskTags = ({ task, showTime = false }: TaskTagsProps) => {
    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    return (
        <View className="flex-row flex-wrap gap-2 mb-3">
            {showTime && (
                <>
                    {task.timeWindow ? (
                        <Text className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                            ⏰ Rango: {formatTime(task.timeWindow.start)} - {formatTime(task.timeWindow.end)}
                        </Text>
                    ) : task.dueTime ? (
                        <Text className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                            ⏰ Límite: {formatTime(task.dueTime)}
                        </Text>
                    ) : null}
                </>
            )}

            <Text className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                {task.frequency === 'daily' ? '🔄 Diario' : task.frequency === 'weekly' ? '🔄 Semanal' : '📌 Una vez'}
            </Text>

            {(task.points || 0) > 0 && (
                <Text className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                    ⭐️ {task.points} pts
                </Text>
            )}

            {task.isSchool && (
                <Text className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded">
                    🎓 Escolar
                </Text>
            )}

            <Text className={`text-xs px-2 py-1 rounded capitalize ${task.type === 'obligatory' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                }`}>
                {task.type === 'obligatory' ? '🎁 Bono' : '💵 Extra'}
            </Text>
        </View>
    );
};
