/**
 * Empty State Component
 * Reusable component for displaying empty states with icon and message
 */

import React from 'react';
import { View, Text } from 'react-native';

interface EmptyStateProps {
    emoji?: string;
    title: string;
    subtitle?: string;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    emoji = '📭',
    title,
    subtitle,
    className = '',
}) => {
    return (
        <View className={`flex-1 justify-center items-center p-8 ${className}`}>
            <Text className="text-6xl mb-4">{emoji}</Text>
            <Text className="text-xl font-bold text-gray-600 text-center mb-2">
                {title}
            </Text>
            {subtitle && (
                <Text className="text-gray-400 text-center">
                    {subtitle}
                </Text>
            )}
        </View>
    );
};

export default EmptyState;
