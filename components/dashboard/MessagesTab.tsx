import React, { useState } from 'react';
import { View, Text, Platform, Alert, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/SearchInput';

export const MessagesTab = () => {
    const { messages, deleteMessage, t } = useTaskContext();
    const navigation = useNavigation<any>();
    const [messagesSearch, setMessagesSearch] = useState('');

    const filteredMessages = messages.filter(m =>
        m.toLowerCase().includes(messagesSearch.toLowerCase())
    );

    // Custom Confirmation Modal State
    const [confirmationAction, setConfirmationAction] = useState<{ type: 'delete', index: number } | null>(null);

    const confirmDeleteMessage = (index: number) => {
        setConfirmationAction({ type: 'delete', index });
    };

    return (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
            <View className="flex-row justify-between items-center mb-6 flex-wrap gap-2">
                <Text className="text-xl font-bold text-gray-800 dark:text-white shrink">{t('messages.title_full')}</Text>
                <Button
                    title={t('messages.new')}
                    onPress={() => navigation.navigate('AddMessage')}
                    size="sm"
                />
            </View>

            <SearchInput
                placeholder={t('messages.search_placeholder')}
                value={messagesSearch}
                onChangeText={setMessagesSearch}
            />

            {filteredMessages.length === 0 ? (
                <View className="py-10 items-center">
                    <Text className="text-gray-400 text-center text-lg">{t('messages.no_messages_title')}</Text>
                    <Text className="text-gray-400 text-center text-sm mt-2">{t('messages.no_messages_subtitle')}</Text>
                </View>
            ) : (
                filteredMessages.map((item, index) => (
                    <View key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm">
                        <Text className="flex-1 text-gray-800 dark:text-gray-100 text-base mr-2" numberOfLines={2}>&quot;{item}&quot;</Text>
                        <View className="flex-row gap-2">
                            <Button
                                title={t('common.edit')}
                                variant="outline"
                                size="sm"
                                onPress={() => navigation.navigate('AddMessage', { messageToEdit: item, indexToEdit: index })}
                            />
                            <Button
                                title={t('common.delete')}
                                variant="outline"
                                size="sm"
                                onPress={() => confirmDeleteMessage(index)}
                                className="border-rose-200"
                                textClassName="text-rose-600"
                            />
                        </View>
                    </View>
                ))
            )}
            {/* Confirmation Modal */}
            <Modal
                visible={!!confirmationAction}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setConfirmationAction(null)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center p-6">
                    <View className="bg-white p-6 rounded-2xl w-full max-w-sm">
                        <Text className="text-xl font-bold mb-4 text-center">
                            {t('messages.confirm_delete_title')}
                        </Text>
                        <Text className="text-gray-600 text-center mb-6">
                            {t('messages.confirm_delete_msg')}
                        </Text>
                        <View className="flex-col gap-3">
                            <Button
                                title={t('common.delete')}
                                onPress={async () => {
                                    if (confirmationAction) {
                                        await deleteMessage(confirmationAction.index);
                                        setConfirmationAction(null);
                                    }
                                }}
                                className="bg-rose-600"
                            />
                            <Button
                                title={t('common.cancel')}
                                variant="outline"
                                onPress={() => setConfirmationAction(null)}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};
