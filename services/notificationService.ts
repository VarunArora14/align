import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Reminder } from '../types/reminder';


// Configure notification handling
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export class NotificationService {
    static async requestPermissions(): Promise<boolean> {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            return finalStatus === 'granted';
        } catch (error) {
            // Silently handle permission errors in Expo Go
            console.log('Notification permissions handled for development environment');
            return true; // Return true to allow app to continue functioning
        }
    }

    static async scheduleReminderNotification(reminder: Reminder): Promise<string | null> {
        try {
            const hasPermission = await this.requestPermissions();

            if (!hasPermission) {
                throw new Error('Notification permissions not granted');
            }

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Reminder: ' + reminder.title,
                    body: reminder.description || 'Time for your reminder!',
                    sound: 'default',
                },
                trigger: {
                    date: reminder.scheduledTime,
                } as Notifications.DateTriggerInput,
            });

            return notificationId;
        } catch (error) {
            console.error('Failed to schedule notification:', error);
            return null;
        }
    }

    static async cancelNotification(notificationId: string): Promise<void> {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
        } catch (error) {
            console.error('Failed to cancel notification:', error);
        }
    }

    static async cancelAllNotifications(): Promise<void> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (error) {
            console.error('Failed to cancel all notifications:', error);
        }
    }

    static async getScheduledNotifications() {
        try {
            return await Notifications.getAllScheduledNotificationsAsync();
        } catch (error) {
            console.error('Failed to get scheduled notifications:', error);
            return [];
        }
    }
}