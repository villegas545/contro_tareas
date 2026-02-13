import React from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import { Button } from './Button';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'default' | 'danger' | 'success';
    isLoading?: boolean;
    loadingText?: string;
    loadingProgress?: { current: number; total: number };
}

/**
 * Reusable confirmation modal component with loading state support
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    visible,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    variant = 'default',
    isLoading = false,
    loadingText = 'Procesando...',
    loadingProgress
}) => {
    const getButtonClassName = () => {
        switch (variant) {
            case 'danger':
                return 'bg-rose-600';
            case 'success':
                return 'bg-green-600';
            default:
                return 'bg-indigo-600';
        }
    };

    const getLoadingColor = () => {
        switch (variant) {
            case 'danger':
                return '#dc2626';
            case 'success':
                return '#22c55e';
            default:
                return '#4f46e5';
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => !isLoading && onCancel()}
        >
            <View className="flex-1 bg-black/50 justify-center items-center p-6">
                <View className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
                    {isLoading ? (
                        <View className="items-center py-4">
                            <ActivityIndicator size="large" color={getLoadingColor()} />
                            <Text className="text-lg font-bold text-gray-700 mt-4 text-center">
                                {loadingText}
                            </Text>
                            {loadingProgress && (
                                <>
                                    <Text className="text-2xl font-bold text-green-600 mt-2">
                                        {loadingProgress.current} / {loadingProgress.total}
                                    </Text>
                                    <Text className="text-gray-400 text-sm mt-2">
                                        Por favor espera...
                                    </Text>
                                </>
                            )}
                        </View>
                    ) : (
                        <>
                            <Text className="text-xl font-bold mb-4 text-center text-gray-900">
                                {title}
                            </Text>
                            <Text className="text-gray-600 text-center mb-6">
                                {message}
                            </Text>
                            <View className="flex-col gap-3">
                                <Button
                                    title={confirmText}
                                    onPress={onConfirm}
                                    className={getButtonClassName()}
                                />
                                <Button
                                    title={cancelText}
                                    variant="outline"
                                    onPress={onCancel}
                                />
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default ConfirmationModal;
