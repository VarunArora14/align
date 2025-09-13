import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Reminder } from '../types/reminder';

let initialized = false

async function ensureInitialized() {
    if (initialized) return;

    // Configure notification handling
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowList: true,
            shouldShowBanner: true
        }),
    });

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
            enableVibrate: true,
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    initialized = true;
}

async function ensurePermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
}

export class NotificationService {
    static async scheduleReminderNotification(reminder: Reminder): Promise<string | null> {
        await ensureInitialized();

        const permitted = await ensurePermissions();
        if (!permitted) return null;

        const at = new Date(reminder.scheduledTime);
        at.setSeconds(0, 0);
        if (at <= new Date()) {
            throw new Error('Scheduled time must be in the future');
        }

        const content: Notifications.NotificationContentInput = {
            title: `Reminder: ${reminder.title}`,
            body: reminder.description || 'Time for your reminder!',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
        };

        // Use a Date trigger with explicit type compatible with SDK 53 types
        const trigger: Notifications.DateTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: at,
            channelId: Platform.OS === 'android' ? 'reminders' : undefined,
        };

        const id = await Notifications.scheduleNotificationAsync({ content, trigger });
        return id;
    }

    static async cancelNotification(notificationId: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    static async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    static async getScheduledNotifications() {
        return Notifications.getAllScheduledNotificationsAsync();
    }
}