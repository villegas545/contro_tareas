/**
 * Loading Spinner Component
 * Reusable loading indicator with optional message
 */

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { BRAND_COLORS } from '../../constants/colors';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'small' | 'large';
    color?: string;
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message,
    size = 'large',
    color = BRAND_COLORS.primary,
    fullScreen = false,
}) => {
    const containerClass = fullScreen
        ? 'flex-1 justify-center items-center'
        : 'p-4 justify-center items-center';

    return (
        <View className={containerClass}>
            <ActivityIndicator size={size} color={color} />
            {message && (
                <Text className="text-gray-500 mt-3 text-center">
                    {message}
                </Text>
            )}
        </View>
    );
};

export default LoadingSpinner;
