import React, { useState } from 'react';
import { View, Text, Platform, Alert, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';

export const FamilyTab = () => {
    const { users, deleteUser, t } = useTaskContext();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigation = useNavigation<any>();
    const children = users.filter(u => u.role === 'child');
    const parents = users.filter(u => u.role !== 'child');

    const [confirmationAction, setConfirmationAction] = useState<{ type: 'delete', userId: string } | null>(null);

    const confirmDeleteUser = (userId: string) => {
        setConfirmationAction({ type: 'delete', userId });
    };

    const renderUserList = (list: typeof users, title: string, emptyMsg: string) => (
        <View className="mb-6">
            <Text className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">{title}</Text>
            {list.length === 0 ? (
                <View className="py-4 items-center bg-gray-50 rounded-xl border-dashed border border-gray-200">
                    <Text className="text-gray-400 italic">{emptyMsg}</Text>
                </View>
            ) : (
                list.map(item => (
                    <View key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm">
                        <View className="flex-row items-center gap-3">
                            <View style={{ backgroundColor: item.color || '#4338ca' }} className="w-10 h-10 rounded-full items-center justify-center">
                                <Text className="text-white font-bold text-lg">{item.name.charAt(0)}</Text>
                            </View>
                            <View>
                                <Text className="text-lg font-bold text-gray-800 dark:text-gray-100">{item.name}</Text>
                                <Text className="text-gray-500 dark:text-gray-400 text-sm">@{item.username}</Text>
                            </View>
                        </View>
                        <View className="flex-row gap-2">
                            <Button
                                title={t('common.edit')}
                                variant="outline"
                                size="sm"
                                onPress={() => navigation.navigate('AddFamilyMember', { userToEdit: item })}
                            />
                            <Button
                                title={t('common.delete')}
                                variant="outline"
                                size="sm"
                                onPress={() => confirmDeleteUser(item.id)}
                                className="border-rose-200"
                                textClassName="text-rose-600"
                            />
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    return (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800 dark:text-white">{t('family.title_full')}</Text>
                <Button
                    title={t('family.add_member')}
                    onPress={() => navigation.navigate('AddFamilyMember')}
                    size="sm"
                />
            </View>

            {renderUserList(parents, t('family.parents_title'), t('family.no_parents'))}

            {renderUserList(children, t('family.children_title'), t('family.no_children'))}

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
                            {t('family.confirm_delete_title')}
                        </Text>
                        <Text className="text-gray-600 text-center mb-6">
                            {t('family.confirm_delete_msg')}
                        </Text>
                        <View className="flex-col gap-3">
                            <Button
                                title={t('common.delete')}
                                onPress={() => {
                                    if (confirmationAction) {
                                        deleteUser(confirmationAction.userId);
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
