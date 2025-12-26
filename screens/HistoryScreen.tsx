import React from 'react';
import { View, Text, SafeAreaView, FlatList } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function HistoryScreen({ navigation }: any) {
    const { history, currentUser } = useTaskContext();

    const myHistory = history.filter(h => h.assignedTo === currentUser?.id).reverse();

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
            <View className="p-6 bg-white dark:bg-slate-800 shadow-sm flex-row items-center justify-between">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">Mi Historial 📜</Text>
                <Button title="Volver" size="sm" variant="outline" onPress={() => navigation.goBack()} />
            </View>

            <FlatList
                data={myHistory}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({ item }) => (
                    <Card className={`mb-3 flex-row items-center justify-between border-l-4 ${item.status === 'verified' ? 'border-l-green-500' : 'border-l-rose-500'
                        }`}>
                        <View className="flex-1">
                            <Text className="font-bold text-gray-800 text-lg">{item.taskTitle}</Text>
                            <Text className="text-gray-400 text-xs">{item.date}</Text>
                        </View>

                        {item.status === 'verified' ? (
                            <View className="items-end">
                                <Text className="text-2xl">✅</Text>
                                <Text className="text-green-600 font-bold text-xs">+{item.points} Pts</Text>
                            </View>
                        ) : (
                            <View className="items-end">
                                <Text className="text-2xl">❌</Text>
                                <Text className="text-rose-500 font-bold text-xs">No cumplido</Text>
                            </View>
                        )}
                    </Card>
                )}
                ListEmptyComponent={
                    <Text className="text-center text-gray-400 mt-10">Aún no tienes historial. ¡Completa tareas! 🚀</Text>
                }
            />
        </SafeAreaView>
    );
}
