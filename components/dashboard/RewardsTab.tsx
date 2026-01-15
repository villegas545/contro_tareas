import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { useTaskContext } from '../../context/TaskContext';
import { Button } from '../ui/Button';

export const RewardsTab = () => {
    const { rewards, addReward, deleteReward, redemptions, approveRedemption, rejectRedemption, currentUser, users, t } = useTaskContext();
    const [title, setTitle] = useState('');
    const [cost, setCost] = useState('');
    const [icon, setIcon] = useState('🎁');

    const pendingRedemptions = redemptions.filter(r => r.status === 'pending');

    const [isCreating, setIsCreating] = useState(false);

    // Custom Confirmation Modal State
    const [confirmationAction, setConfirmationAction] = useState<{ type: 'delete' | 'approve', id: string, payload?: any } | null>(null);

    const handleAddReward = () => {
        if (!title.trim() || !cost || isNaN(Number(cost))) {
            if (Platform.OS === 'web') window.alert(t('rewards.alert_invalid_input'));
            else Alert.alert(t('rewards.alert_error'), t('rewards.alert_invalid_input'));
            return;
        }

        addReward({
            title,
            cost: Number(cost),
            icon,
            createdBy: currentUser?.id || '',
        });

        setTitle('');
        setCost('');
        setIsCreating(false);
        if (Platform.OS === 'web') window.alert(t('rewards.alert_added'));
        else Alert.alert(t('rewards.alert_success'), t('rewards.alert_added'));
    };

    const confirmDelete = (id: string) => {
        setConfirmationAction({ type: 'delete', id });
    };

    const confirmApprove = (id: string, cost: number) => {
        setConfirmationAction({ type: 'approve', id, payload: { cost } });
    };

    return (
        <View className="flex-1 p-6 pb-24">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-800 dark:text-white">{t('rewards.title_parents')}</Text>
                {!isCreating && <Button title={t('rewards.new')} size="sm" onPress={() => setIsCreating(true)} />}
            </View>

            {/* Pending Redemptions */}
            {pendingRedemptions.length > 0 && (
                <View className="mb-8">
                    <Text className="text-sm font-bold mb-2 text-brand-primary uppercase">{t('rewards.pending_requests')}</Text>
                    {pendingRedemptions.map(req => {
                        const childName = users.find(u => u.id === req.childId)?.name || 'Hijo';
                        return (
                            <View key={req.id} className="bg-amber-50 dark:bg-gray-800 border border-amber-200 dark:border-amber-900 p-4 rounded-xl mb-3">
                                <View className="flex-row justify-between items-start mb-3">
                                    <View>
                                        <Text className="text-lg font-bold text-gray-900 dark:text-white">{req.rewardTitle}</Text>
                                        <Text className="text-gray-500 dark:text-gray-400">{t('rewards.requested_by')} <Text className="font-bold">{childName}</Text></Text>
                                    </View>
                                    <View className="bg-amber-100 dark:bg-amber-900 px-3 py-1 rounded-full">
                                        <Text className="text-amber-800 dark:text-amber-200 font-bold">-{req.cost} {t('task.points')}</Text>
                                    </View>
                                </View>
                                <View className="flex-row gap-2">
                                    <Button title={t('rewards.approve_btn')} onPress={() => confirmApprove(req.id, req.cost)} className="flex-1 bg-green-600" size="sm" />
                                    <Button title={t('rewards.reject_btn')} onPress={() => rejectRedemption(req.id)} variant="outline" className="flex-1 border-rose-200" textClassName="text-rose-600" size="sm" />
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* Create Reward Form */}
            {isCreating && (
                <View className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 border border-gray-100 dark:border-gray-700">
                    <Text className="text-lg font-bold mb-4 text-brand-text-primary dark:text-brand-text-light">{t('rewards.create_title')}</Text>

                    <View className="flex-row gap-3">
                        <TextInput
                            value={icon}
                            onChangeText={setIcon}
                            placeholder={t('rewards.icon_placeholder')}
                            placeholderTextColor="#9CA3AF"
                            className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 text-center text-xl w-14"
                        />
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder={t('rewards.title_placeholder')}
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3"
                        />
                    </View>

                    <TextInput
                        value={cost}
                        onChangeText={setCost}
                        placeholder={t('rewards.cost_placeholder')}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4"
                    />

                    <View className="flex-row gap-2">
                        <Button title={t('common.cancel')} variant="outline" onPress={() => setIsCreating(false)} className="flex-1" />
                        <Button title={t('rewards.save_btn')} onPress={handleAddReward} className="flex-1" />
                    </View>
                </View>
            )}

            <View className="flex-row flex-wrap gap-3">
                {rewards.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        onLongPress={() => confirmDelete(item.id)}
                        style={{ width: '48%' }}
                        className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-3 relative"
                    >
                        <Text className="text-3xl mb-2 text-center">{item.icon || '🎁'}</Text>
                        <Text className="font-bold text-center text-gray-800 dark:text-white mb-1">{item.title}</Text>
                        <Text className="text-center text-gray-500 text-xs text-brand-primary font-bold">{item.cost} {t('task.points')}</Text>

                        {/* Delete Indicator */}
                        <View className="absolute top-2 right-2">
                            {/* Could add a trash icon here */}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
            {rewards.length === 0 && (
                <Text className="text-center text-gray-400 mt-4">{t('rewards.no_rewards')}</Text>
            )}
            {rewards.length > 0 && (
                <Text className="text-center text-gray-400 mt-8 text-xs">{t('rewards.delete_hint')}</Text>
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
                            {confirmationAction?.type === 'delete'
                                ? t('rewards.confirm_delete_title')
                                : t('rewards.confirm_approve_title')}
                        </Text>
                        <Text className="text-gray-600 text-center mb-6">
                            {confirmationAction?.type === 'delete'
                                ? t('rewards.confirm_delete_msg')
                                : t('rewards.confirm_approve_msg').replace('{cost}', String(confirmationAction?.payload?.cost || 0))}
                        </Text>
                        <View className="flex-col gap-3">
                            <Button
                                title={confirmationAction?.type === 'delete' ? t('common.delete') : t('rewards.approve_btn')}
                                onPress={() => {
                                    if (confirmationAction) {
                                        if (confirmationAction.type === 'delete') deleteReward(confirmationAction.id);
                                        if (confirmationAction.type === 'approve') approveRedemption(confirmationAction.id);
                                        setConfirmationAction(null);
                                    }
                                }}
                                className={confirmationAction?.type === 'delete' ? "bg-rose-600" : "bg-green-600"}
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
        </View>
    );
};
