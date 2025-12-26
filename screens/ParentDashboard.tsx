import React from 'react';
import { View, Text, SafeAreaView, ScrollView, FlatList, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useTaskContext } from '../context/TaskContext';
import { Card } from '../components/ui/Card';
import { Task } from '../types';
import { Button } from '../components/ui/Button';
import { ParentTaskCard } from '../components/ParentTaskCard';

export default function ParentDashboard({ navigation }: any) {
    const { currentUser, tasks, users, verifyTask, rejectTask, logout, addTask, messages, addMessage, deleteMessage, addUser, deleteUser } = useTaskContext();
    const children = users.filter(u => u.role === 'child');
    const [selectedChildId, setSelectedChildId] = React.useState<string | null>(null);
    const [currentTab, setCurrentTab] = React.useState<'monitoring' | 'assignment' | 'messages' | 'family'>('monitoring');
    const [newMessageText, setNewMessageText] = React.useState('');

    // User Management State
    const [newChildName, setNewChildName] = React.useState('');
    const [newChildUsername, setNewChildUsername] = React.useState('');
    const [newChildPassword, setNewChildPassword] = React.useState('');

    // Assignment Mode State
    const [taskLikelyToAssign, setTaskLikelyToAssign] = React.useState<Task | null>(null);
    const [assignmentSelection, setAssignmentSelection] = React.useState<string[]>([]);

    const activeTasks = selectedChildId
        ? tasks.filter(t => t.assignedTo === selectedChildId && t.assignedTo !== 'pool')
        : tasks.filter(t => t.assignedTo !== 'pool');

    // In assignment mode, we only show 'pool' tasks (templates)
    const poolTasks = tasks.filter(t => t.assignedTo === 'pool');

    const handleAddUser = () => {
        if (!newChildName || !newChildUsername || !newChildPassword) {
            if (Platform.OS === 'web') window.alert("Todos los campos son obligatorios");
            else Alert.alert("Error", "Todos los campos son obligatorios");
            return;
        }

        const usernameExists = users.some(u => u.username === newChildUsername);
        if (usernameExists) {
            if (Platform.OS === 'web') window.alert("Este nombre de usuario ya existe");
            else Alert.alert("Error", "Este nombre de usuario ya existe");
            return;
        }

        addUser({
            name: newChildName,
            username: newChildUsername,
            password: newChildPassword,
            role: 'child',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + newChildUsername
        });

        setNewChildName('');
        setNewChildUsername('');
        setNewChildPassword('');

        if (Platform.OS === 'web') window.alert("Hijo agregado correctamente");
        else Alert.alert("Éxito", "Hijo agregado correctamente");
    };

    const confirmDeleteUser = (userId: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de eliminar a este usuario? Se perderá su historial.")) {
                deleteUser(userId);
            }
        } else {
            Alert.alert(
                "Confirmar Eliminación",
                "¿Estás seguro de eliminar a este usuario? Se perderá su historial.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: 'destructive', onPress: () => deleteUser(userId) }
                ]
            );
        }
    };

    const handleAddMessage = () => {
        if (!newMessageText.trim()) {
            if (Platform.OS === 'web') window.alert("El mensaje no puede estar vacío");
            else Alert.alert("Error", "El mensaje no puede estar vacío");
            return;
        }

        if (Platform.OS === 'web') {
            if (window.confirm("¿Deseas agregar este mensaje?")) {
                addMessage(newMessageText);
                setNewMessageText('');
                window.alert("Mensaje agregado");
            }
        } else {
            Alert.alert(
                "Confirmar",
                "¿Deseas agregar este mensaje?",
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Agregar",
                        onPress: () => {
                            addMessage(newMessageText);
                            setNewMessageText('');
                            Alert.alert("Éxito", "Mensaje agregado");
                        }
                    }
                ]
            );
        }
    };

    const confirmVerify = (taskId: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de que esta tarea se completó correctamente?")) verifyTask(taskId);
        } else {
            Alert.alert(
                "Confirmar Verificación",
                "¿Estás seguro de que esta tarea se completó correctamente?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Sí, Verificar", onPress: () => verifyTask(taskId) }
                ]
            );
        }
    };

    const confirmReject = (taskId: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de rechazar esta tarea? Volverá a estar pendiente.")) rejectTask(taskId);
        } else {
            Alert.alert(
                "Confirmar Rechazo",
                "¿Estás seguro de rechazar esta tarea? Volverá a estar pendiente.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Sí, Rechazar", onPress: () => rejectTask(taskId) }
                ]
            );
        }
    };

    const confirmDeleteMessage = (index: number) => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de eliminar este mensaje?")) deleteMessage(index);
        } else {
            Alert.alert(
                "Confirmar Eliminación",
                "¿Estás seguro de eliminar este mensaje?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: 'destructive', onPress: () => deleteMessage(index) }
                ]
            );
        }
    };

    const handleAssignTask = () => {
        if (!taskLikelyToAssign || assignmentSelection.length === 0) return;

        const assignLogic = () => {
            assignmentSelection.forEach(childId => {
                const newTask: Omit<Task, 'id' | 'createdAt'> = {
                    title: taskLikelyToAssign.title,
                    description: taskLikelyToAssign.description,
                    assignedTo: childId,
                    createdBy: currentUser?.id || '',
                    status: 'pending',
                    type: taskLikelyToAssign.type,
                    frequency: taskLikelyToAssign.frequency,
                    points: taskLikelyToAssign.points,
                    timeWindow: taskLikelyToAssign.timeWindow,
                    dueTime: taskLikelyToAssign.dueTime,
                };
                addTask(newTask);
            });

            setTaskLikelyToAssign(null);
            setAssignmentSelection([]);
            if (Platform.OS === 'web') window.alert("Tareas asignadas correctamente");
            else Alert.alert("Éxito", "Tareas asignadas correctamente");
        }

        if (Platform.OS === 'web') {
            if (window.confirm(`¿Asignar "${taskLikelyToAssign.title}" a los hijos seleccionados?`)) {
                assignLogic();
            }
        } else {
            Alert.alert(
                "Confirmar Asignación",
                `¿Asignar "${taskLikelyToAssign.title}" a los hijos seleccionados?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Asignar",
                        onPress: assignLogic
                    }
                ]
            );
        }
    };

    const handlePoolAssign = (item: Task) => {
        setTaskLikelyToAssign(item);
        setAssignmentSelection(children.length > 0 ? [children[0].id] : []);
    };

    const renderTask = ({ item }: { item: Task }) => (
        <ParentTaskCard
            task={item}
            users={users}
            onVerify={confirmVerify}
            onReject={confirmReject}
            onAssign={handlePoolAssign}
        />
    );

    const confirmLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de que quieres salir?")) {
                logout();
            }
        } else {
            Alert.alert(
                "Cerrar Sesión",
                "¿Estás seguro de que quieres salir?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Salir", onPress: logout }
                ]
            );
        }
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <View className="p-6 flex-row justify-between items-center bg-white dark:bg-slate-800 shadow-sm z-10 pt-12">
                <View>
                    <Text className="text-sm text-gray-500 font-medium">Hola,</Text>
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">{currentUser?.name}</Text>
                </View>
                <View className="flex-row gap-2">
                    <Button title="📊 Stats" variant="secondary" size="sm" onPress={() => navigation.navigate('Statistics')} />
                    <Button title="Salir" variant="outline" size="sm" onPress={confirmLogout} />
                </View>
            </View>

            {/* Tab Switcher */}
            <View className="px-6 py-4 flex-row gap-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => setCurrentTab('monitoring')}>
                    <Text className={`text-lg font-bold ${currentTab === 'monitoring' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>
                        Seguimiento
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCurrentTab('assignment')}>
                    <Text className={`text-lg font-bold ${currentTab === 'assignment' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>
                        Banco
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCurrentTab('family')}>
                    <Text className={`text-lg font-bold ${currentTab === 'family' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>
                        Familia
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCurrentTab('messages')}>
                    <Text className={`text-lg font-bold ${currentTab === 'messages' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>
                        Mensajes
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            {currentTab === 'monitoring' ? (
                <>
                    <View className="px-6 py-4">
                        <Text className="text-gray-500 text-xs font-bold uppercase mb-2">Filtrar por hijo:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => setSelectedChildId(null)}
                                className={`px-4 py-2 rounded-full border ${selectedChildId === null
                                    ? 'bg-gray-800 border-gray-800'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <Text className={selectedChildId === null ? 'text-white font-medium' : 'text-gray-700'}>Todos</Text>
                            </TouchableOpacity>

                            {children.map(child => (
                                <TouchableOpacity
                                    key={child.id}
                                    onPress={() => setSelectedChildId(child.id)}
                                    className={`px-4 py-2 rounded-full border ${selectedChildId === child.id
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'bg-white border-gray-300'
                                        }`}
                                >
                                    <Text className={selectedChildId === child.id ? 'text-white font-medium' : 'text-gray-700'}>{child.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <FlatList
                        className="flex-1"
                        data={activeTasks}
                        keyExtractor={(item) => item.id}
                        renderItem={renderTask}
                        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                        ListHeaderComponent={
                            <Text className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4">Tareas Activas</Text>
                        }
                    />
                </>
            ) : currentTab === 'assignment' ? (
                <FlatList
                    className="flex-1"
                    data={poolTasks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTask}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListHeaderComponent={
                        <View className="mb-4 flex-row justify-between items-center">
                            <Text className="text-lg font-bold text-gray-700 dark:text-gray-200">Plantillas Disponibles</Text>
                            <Button
                                title="+ Crear Plantilla"
                                size="sm"
                                onPress={() => navigation.navigate('CreateTask')}
                            />
                        </View>
                    }
                />
            ) : currentTab === 'family' ? (
                // Family Management View
                <View className="flex-1 p-6">
                    <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
                        <Text className="text-lg font-bold mb-4">Agregar Nuevo Hijo</Text>
                        <TextInput
                            value={newChildName}
                            onChangeText={setNewChildName}
                            placeholder="Nombre del hijo"
                            className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 text-base"
                        />
                        <TextInput
                            value={newChildUsername}
                            onChangeText={setNewChildUsername}
                            placeholder="Nombre de usuario (Login)"
                            autoCapitalize="none"
                            className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 text-base"
                        />
                        <TextInput
                            value={newChildPassword}
                            onChangeText={setNewChildPassword}
                            placeholder="Contraseña"
                            secureTextEntry
                            className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 text-base"
                        />
                        <Button title="Agregar Hijo" onPress={handleAddUser} />
                    </View>

                    <Text className="text-lg font-bold mb-4 text-gray-700">Lista de Hijos</Text>
                    <FlatList
                        data={children}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View className="bg-white p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm">
                                <View>
                                    <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
                                    <Text className="text-gray-500 text-sm">@{item.username}</Text>
                                </View>
                                <Button
                                    title="Eliminar"
                                    variant="outline"
                                    size="sm"
                                    onPress={() => confirmDeleteUser(item.id)}
                                    className="border-rose-200"
                                    textClassName="text-rose-600"
                                />
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                </View>
            ) : (
                // Messages View
                <View className="flex-1 p-6">
                    <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
                        <Text className="text-lg font-bold mb-2">Nuevo Mensaje / Recordatorio</Text>
                        <TextInput
                            value={newMessageText}
                            onChangeText={setNewMessageText}
                            placeholder="Escribe un mensaje aquí..."
                            className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3 text-base"
                            multiline
                        />
                        <Button title="Agregar Mensaje" onPress={handleAddMessage} />
                    </View>

                    <Text className="text-lg font-bold mb-4 text-gray-700">Mensajes Actuales</Text>
                    <FlatList
                        data={messages}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <View className="bg-white p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm">
                                <Text className="flex-1 text-gray-800 text-base mr-2">"{item}"</Text>
                                <Button
                                    title="Eliminar"
                                    variant="outline"
                                    size="sm"
                                    onPress={() => confirmDeleteMessage(index)}
                                    className="border-rose-200"
                                    textClassName="text-rose-600"
                                />
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                </View>
            )}

            {/* Assignment Modal (Overlay) */}
            {taskLikelyToAssign && (
                <View className="absolute inset-0 bg-black/50 z-50 justify-center items-center p-6">
                    <View className="bg-white p-6 rounded-2xl w-full max-w-sm">
                        <Text className="text-xl font-bold mb-4">Asignar "{taskLikelyToAssign.title}" a:</Text>

                        <View className="flex-row flex-wrap gap-2 mb-6">
                            {children.map(child => {
                                const isSelected = assignmentSelection.includes(child.id);
                                return (
                                    <TouchableOpacity
                                        key={child.id}
                                        onPress={() => {
                                            if (isSelected) {
                                                setAssignmentSelection(prev => prev.filter(id => id !== child.id));
                                            } else {
                                                setAssignmentSelection(prev => [...prev, child.id]);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-full border ${isSelected
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'bg-gray-100 border-gray-200'
                                            }`}
                                    >
                                        <Text className={isSelected ? 'text-white font-medium' : 'text-gray-700'}>
                                            {child.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View className="gap-3">
                            <Button title="Confirmar Asignación" onPress={handleAssignTask} />
                            <Button title="Cancelar" variant="outline" onPress={() => setTaskLikelyToAssign(null)} />
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}
