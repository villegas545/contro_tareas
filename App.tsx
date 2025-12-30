
import './global.css';
import React from 'react';
import { View, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TaskProvider, useTaskContext } from './context/TaskContext';
import LoginScreen from './screens/LoginScreen';
import ParentDashboard from './screens/ParentDashboard';
import ChildDashboard from './screens/ChildDashboard';
import CreateTaskScreen from './screens/CreateTaskScreen';
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const { currentUser } = useTaskContext();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!currentUser ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : currentUser.role === 'parent' ? (
        <>
          <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
          <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Statistics" component={require('./screens/StatisticsScreen').default} options={{ presentation: 'modal' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="ChildDashboard" component={ChildDashboard} />
          <Stack.Screen name="History" component={require('./screens/HistoryScreen').default} options={{ presentation: 'modal' }} />
        </>
      )}
    </Stack.Navigator>
  );
};

import { useColorScheme } from 'nativewind';

export default function App() {
  const { setColorScheme } = useColorScheme();

  React.useEffect(() => {
    setColorScheme('light');
  }, []);

  return (
    <TaskProvider>
      <View className={`flex-1 items-center justify-center ${Platform.OS === 'web' ? 'bg-[#333]' : 'bg-white'}`}>
        <View
          className="flex-1 w-full h-full bg-white overflow-hidden shadow-xl"
          style={Platform.OS === 'web' ? { maxWidth: 480, maxHeight: 900 } : {}}
        >
          <SafeAreaProvider>
            <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
              <NavigationContainer theme={DefaultTheme}>
                <MainNavigator />
                <StatusBar style="dark" />
              </NavigationContainer>
            </SafeAreaView>
          </SafeAreaProvider>
        </View>
      </View>
    </TaskProvider>
  );
}
