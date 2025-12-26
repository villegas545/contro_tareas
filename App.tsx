import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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

export default function App() {
  return (
    <TaskProvider>
      <NavigationContainer>
        <MainNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </TaskProvider>
  );
}
