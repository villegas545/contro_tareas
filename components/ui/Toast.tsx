import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, TouchableOpacity, Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    visible: boolean;
    message: string;
    type: ToastType;
    onDismiss: () => void;
    duration?: number;
}

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
    success: { bg: '#ecfdf5', border: '#10b981', text: '#065f46', icon: '✅' },
    error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '❌' },
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: 'ℹ️' },
};

export const Toast: React.FC<ToastProps> = ({ visible, message, type, onDismiss, duration = 3000 }) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (visible) {
            // Slide in
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 10,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                handleDismiss();
            }, duration);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visible, message]);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss();
        });
    };

    if (!visible) return null;

    const colors = TOAST_COLORS[type];

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: Platform.OS === 'web' ? 20 : 50,
                left: 16,
                right: 16,
                zIndex: 9999,
                transform: [{ translateY }],
                opacity,
            }}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleDismiss}
                style={{
                    backgroundColor: colors.bg,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.border,
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 8,
                }}
            >
                <Text style={{ fontSize: 18, marginRight: 10 }}>{colors.icon}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', lineHeight: 20 }}>
                        {message}
                    </Text>
                </View>
                <Text style={{ color: colors.text, fontSize: 16, opacity: 0.5, marginLeft: 8 }}>✕</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default Toast;
