import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { cssInterop } from "nativewind";

cssInterop(TouchableOpacity, { className: "style" });

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    textClassName?: string;
}

export const Button = ({ title, variant = 'primary', size = 'md', className, textClassName, ...props }: ButtonProps) => {
    const baseStyle = "rounded-xl items-center justify-center flex-row shadow-sm active:opacity-80";

    const variants = {
        primary: "bg-indigo-600 border border-transparent",
        secondary: "bg-teal-500 border border-transparent",
        danger: "bg-rose-500 border border-transparent",
        outline: "bg-transparent border border-gray-300 dark:border-gray-600",
    };

    const sizes = {
        sm: "px-3 py-2",
        md: "px-4 py-3",
        lg: "px-6 py-4",
    };

    const textSizes = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
    };

    const textColors = {
        primary: "text-white",
        secondary: "text-white",
        danger: "text-white",
        outline: "text-gray-700 dark:text-gray-200",
    };

    return (
        <TouchableOpacity
            className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className || ''}`}
            {...props}
        >
            <Text className={`${textColors[variant]} ${textSizes[size]} font-semibold ${textClassName || ''}`}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};
