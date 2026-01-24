/**
 * Confirmation Modal Component
 * Reusable modal for confirmation dialogs
 */

import React from 'react';
import { View, Text, Modal, Platform, StatusBar } from 'react-native';
import { Button } from '../../../components/ui/Button';

interface ConfirmationModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'primary' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    visible,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmVariant = 'primary',
    onConfirm,
    onCancel,
}) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View
                className="flex-1 bg-black/50 justify-center items-center p-6"
                style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}
            >
                <View className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                    <Text className="text-xl font-bold text-gray-800 text-center mb-2">
                        {title}
                    </Text>
                    <Text className="text-gray-500 text-center mb-6">
                        {message}
                    </Text>

                    <View className="gap-3">
                        <Button
                            title={confirmText}
                            onPress={onConfirm}
                            className={confirmVariant === 'danger' ? 'bg-red-600' : 'bg-indigo-600'}
                        />
                        <Button
                            title={cancelText}
                            variant="outline"
                            onPress={onCancel}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ConfirmationModal;
