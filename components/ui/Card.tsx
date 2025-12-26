import { View, ViewProps } from 'react-native';

export const Card = ({ children, className, ...props }: ViewProps) => {
    return (
        <View
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 ${className || ''}`}
            {...props}
        >
            {children}
        </View>
    );
};
