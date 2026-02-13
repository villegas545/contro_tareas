/**
 * Badge Component
 * Small badge/chip for displaying status, counts, or labels
 */

import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
    text: string | number;
    variant?: BadgeVariant;
    emoji?: string;
    size?: 'sm' | 'md';
    className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
    default: { bg: 'bg-gray-100', text: 'text-gray-600' },
    primary: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    success: { bg: 'bg-green-100', text: 'text-green-800' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-800' },
    danger: { bg: 'bg-red-100', text: 'text-red-800' },
    info: { bg: 'bg-sky-100', text: 'text-sky-800' },
};

export const Badge: React.FC<BadgeProps> = ({
    text,
    variant = 'default',
    emoji,
    size = 'sm',
    className = '',
}) => {
    const styles = variantStyles[variant];
    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

    return (
        <View className={`flex-row items-center rounded-full ${styles.bg} ${sizeClass} ${className}`}>
            {emoji && <Text className="mr-1">{emoji}</Text>}
            <Text className={`font-bold ${styles.text}`}>{text}</Text>
        </View>
    );
};

export default Badge;
