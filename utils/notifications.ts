import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        // Get the token (works for Expo Go and bare workflow)
        token = (await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

export async function sendPushNotification(expoPushToken: string, title: string, body: string, data: any = {}) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
}

// Local Notifications Logic
export async function scheduleRemindersForTasks(tasks: any[]) {
    // Cancel all existing to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date(); // Current local time

    for (const task of tasks) {
        if (task.status !== 'pending') continue;

        let dueTimeDate: Date | null = null;

        // Determine due time for TODAY
        let timeString = task.dueTime;
        // Using optional chaining safely: check if timeWindow exists
        if (!timeString && task.timeWindow && task.timeWindow.end) {
            timeString = task.timeWindow.end;
        }

        if (timeString && timeString.length === 5 && timeString.includes(':')) {
            const [hoursStr, minutesStr] = timeString.split(':');
            const hours = parseInt(hoursStr, 10);
            const minutes = parseInt(minutesStr, 10);

            if (!isNaN(hours) && !isNaN(minutes)) {
                const d = new Date();
                d.setHours(hours, minutes, 0, 0);

                // If the time is in the future today
                if (d > now) {
                    dueTimeDate = d;
                }
            }
        }

        if (!dueTimeDate) continue;

        // Triggers in minutes before: 60, 30, 15, 5
        const triggers = [60, 30, 15, 5];

        for (const minutesBefore of triggers) {
            const triggerDate = new Date(dueTimeDate.getTime() - minutesBefore * 60000);
            const seconds = Math.floor((triggerDate.getTime() - Date.now()) / 1000);
            if (seconds > 0) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "¡Recordatorio de Tarea! ⏰",
                        body: `La tarea "${task.title}" vence en ${minutesBefore} minutos.`,
                        sound: true,
                    },
                    trigger: { seconds, repeats: false } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                });
            }
        }

        // Expiration Notification at due time
        const secondsDue = Math.floor((dueTimeDate.getTime() - Date.now()) / 1000);
        if (secondsDue > 0) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Tarea Vencida ⏳",
                    body: `La tarea "${task.title}" ha vencido.`,
                    sound: true,
                },
                trigger: { seconds: secondsDue, repeats: false } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            });
        }
    }
}
