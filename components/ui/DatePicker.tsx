import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Button } from './Button';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    label?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Select Date', label }: DatePickerProps) {
    const [showModal, setShowModal] = useState(false);

    const handleDayPress = (day: DateData) => {
        onChange(day.dateString);
        setShowModal(false);
    };

    return (
        <View>
            {label && <Text className="text-gray-700 font-medium mb-1">{label}</Text>}
            <TouchableOpacity
                onPress={() => setShowModal(true)}
                className="bg-white p-3 rounded-xl border border-gray-200"
            >
                <Text className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {value || placeholder}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <Pressable
                    className="flex-1 bg-black/50 justify-center items-center p-4"
                    onPress={() => setShowModal(false)}
                >
                    <Pressable
                        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
                        style={{ elevation: 5 }} // Ensure shadow visible on Android
                        onPress={e => e.stopPropagation()}
                    >
                        <View className="p-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
                            <Text className="text-lg font-bold text-gray-800">Seleccionar Fecha</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Text className="text-gray-500">Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                        <Calendar
                            current={value || undefined}
                            onDayPress={handleDayPress}
                            markedDates={{
                                [value]: { selected: true, selectedColor: '#4f46e5' }
                            }}
                            theme={{
                                selectedDayBackgroundColor: '#4f46e5',
                                todayTextColor: '#4f46e5',
                                arrowColor: '#4f46e5',
                            }}
                        />
                        {value ? (
                            <View className="p-4 border-t border-gray-100">
                                <Button
                                    title="Limpiar Fecha"
                                    variant="outline"
                                    size="sm"
                                    onPress={() => {
                                        onChange('');
                                        setShowModal(false);
                                    }}
                                />
                            </View>
                        ) : null}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
