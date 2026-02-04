import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Modal } from 'react-native';

interface GlobalLoadingOverlayProps {
    visible: boolean;
    message?: string;
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({ visible, message }) => {
    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={visible}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color="#FF7043" />
                    {message && <Text style={styles.message}>{message}</Text>}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerContainer: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        minWidth: 150,
    },
    message: {
        marginTop: 16,
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
});

export default GlobalLoadingOverlay;
