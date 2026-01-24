import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { useTaskContext } from '../../context/TaskContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { User } from '../../types';

export const WalletTab = () => {
    const { users, currentUser, transactions, addTransaction, t } = useTaskContext();
    const children = users.filter(u => u.role === 'child');

    const [selectedChild, setSelectedChild] = useState<User | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const openTransactionModal = (child: User, type: 'deposit' | 'withdrawal') => {
        setSelectedChild(child);
        setTransactionType(type);
        setAmount('');
        setDescription('');
        setModalVisible(true);
    };

    const handleTransaction = () => {
        if (!selectedChild || !amount) return;
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        addTransaction(selectedChild.id, numAmount, transactionType, description || (transactionType === 'deposit' ? 'Depósito' : 'Retiro'));
        setModalVisible(false);
    };

    // Helper to format currency
    const formatCurrency = (val: number | undefined) => {
        return (val || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-slate-900 p-4">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                💰 {t('wallet.title') || 'Billetera Electrónica'}
            </Text>

            <View className="flex-row flex-wrap gap-4 justify-center">
                {children.map(child => (
                    <Card key={child.id} className="bg-white dark:bg-slate-800 p-6 w-full md:w-5/12 border-t-4 border-t-emerald-500 shadow-md">
                        <View className="items-center mb-4">
                            <View className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-2 overflow-hidden border-2 border-indigo-200">
                                {child.avatar ? (
                                    <Text className="text-2xl">{child.avatar}</Text>
                                ) : (
                                    <Text className="text-2xl font-bold text-indigo-600">{child.name[0]}</Text>
                                )}
                            </View>
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">{child.name}</Text>
                            <Text className="text-sm text-gray-500">Saldo Actual</Text>
                            <Text className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                                {formatCurrency(child.walletBalance)}
                            </Text>
                        </View>

                        <View className="flex-row gap-3 mt-2">
                            <TouchableOpacity
                                onPress={() => openTransactionModal(child, 'deposit')}
                                className="flex-1 bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg items-center border border-emerald-200 dark:border-emerald-800 active:bg-emerald-200"
                            >
                                <Text className="text-2xl mb-1">📈</Text>
                                <Text className="font-bold text-emerald-700 dark:text-emerald-300">Ingresar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => openTransactionModal(child, 'withdrawal')}
                                className="flex-1 bg-rose-100 dark:bg-rose-900/30 p-3 rounded-lg items-center border border-rose-200 dark:border-rose-800 active:bg-rose-200"
                            >
                                <Text className="text-2xl mb-1">📉</Text>
                                <Text className="font-bold text-rose-700 dark:text-rose-300">Retirar</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Mini Recent History */}
                        <View className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <Text className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Recientes</Text>
                            {transactions
                                .filter(t => t.childId === child.id)
                                .slice(0, 3)
                                .map(tx => (
                                    <View key={tx.id} className="flex-row justify-between items-center py-1">
                                        <Text className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate pr-2">
                                            {tx.description}
                                        </Text>
                                        <Text className={`text-xs font-bold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </Text>
                                    </View>
                                ))}
                            {transactions.filter(t => t.childId === child.id).length === 0 && (
                                <Text className="text-xs text-gray-400 italic">Sin movimientos recientes</Text>
                            )}
                        </View>
                    </Card>
                ))}
            </View>

            {/* Transaction Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/60 justify-center items-center p-4">
                    <View className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-xl">
                        <Text className="text-xl font-bold text-center mb-1 dark:text-white">
                            {transactionType === 'deposit' ? 'Ingresar Dinero' : 'Retirar Dinero'}
                        </Text>
                        <Text className="text-sm text-gray-500 text-center mb-6 dark:text-gray-400">
                            {selectedChild?.name}
                        </Text>

                        <View className="mb-4">
                            <Text className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Monto ($)</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-2xl font-bold text-center text-gray-900 dark:text-white"
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                autoFocus
                            />
                        </View>

                        <View className="mb-6">
                            <Text className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Descripción</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-base text-gray-900 dark:text-white"
                                placeholder={transactionType === 'deposit' ? "Ej. Domingo, Regalo..." : "Ej. Compra de dulces, Multa..."}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        <View className="flex-row gap-3">
                            <Button
                                title="Cancelar"
                                onPress={() => setModalVisible(false)}
                                variant="outline"
                                className="flex-1"
                            />
                            <Button
                                title="Confirmar"
                                onPress={handleTransaction}
                                variant={transactionType === 'deposit' ? 'primary' : 'danger'}
                                className={`flex-1 ${transactionType === 'deposit' ? 'bg-emerald-600' : 'bg-rose-600'}`}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};
