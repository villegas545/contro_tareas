import React from 'react';
import { TextInput } from 'react-native';

interface SearchInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export const SearchInput = ({ value, onChangeText, placeholder }: SearchInputProps) => {
    return (
        <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            className="bg-white p-3 rounded-lg border border-gray-200 mb-4 font-medium text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700"
            placeholderTextColor="#9ca3af"
        />
    );
};
