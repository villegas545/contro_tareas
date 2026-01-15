import React from 'react';
import { View, Text } from 'react-native';
import { Task } from '../types';
import { useTaskContext } from '../context/TaskContext';

interface TaskTagsProps {
    task: Task;
    showTime?: boolean;
}

export const TaskTags = ({ task, showTime = false }: TaskTagsProps) => {
    const { t } = useTaskContext();
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
                            {t('tags.range').replace('{start}', formatTime(task.timeWindow.start)).replace('{end}', formatTime(task.timeWindow.end))}
                        </Text>
                    ) : task.dueTime ? (
                        <Text className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                            {t('tags.limit').replace('{time}', formatTime(task.dueTime))}
                        </Text>
                    ) : null}
                </>
            )}

            <Text className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                {task.frequency === 'daily' ? t('tags.daily') : task.frequency === 'weekly' ? t('tags.weekly') : t('tags.one_time')}
            </Text>

            {task.shift && task.shift !== 'no-time' && (
                <Text className={`text-xs px-2 py-1 rounded capitalize ${task.shift === 'morning' ? 'bg-amber-100 text-amber-800' :
                    task.shift === 'afternoon' ? 'bg-orange-100 text-orange-800' :
                        task.shift === 'night' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {task.shift === 'morning' ? t('tags.morning') :
                        task.shift === 'afternoon' ? t('tags.afternoon') :
                            task.shift === 'night' ? t('tags.night') : t('tags.no_schedule')}
                </Text>
            )}

            {(task.points || 0) > 0 && (
                <Text className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded">
                    {t('tags.points').replace('{points}', String(task.points))}
                </Text>
            )}

            {task.isSchool && (
                <Text className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded">
                    {t('tags.school')}
                </Text>
            )}

            <Text className={`text-xs px-2 py-1 rounded capitalize ${task.isResponsibility ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                }`}>
                {task.isResponsibility ? t('tags.bonus') : t('tags.extra')}
            </Text>
        </View>
    );
};
