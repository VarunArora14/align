import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Reminder } from '../types/reminder';

let initialized = false

async function ensureInitialized() {
    if (initialized) return;

    // Configure notification handling
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
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
        const now = new Date();

        // When repeating daily, we only care about hour/minute and we allow scheduling even
        // if the date is in the past; the first fire will be the next matching time.
        if (reminder.repeat !== 'daily' && at <= now) {
            throw new Error('Scheduled time must be in the future');
        }

        const content: Notifications.NotificationContentInput = {
            title: `Reminder: ${reminder.title}`,
            body: reminder.description || 'Time for your reminder!',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: {
                reminderId: reminder.id,
                isDaily: reminder.repeat === 'daily'
            },
        };

        let trigger: Notifications.NotificationTriggerInput;
        if (reminder.repeat === 'daily') {
            // For daily reminders, calculate the next occurrence
            const targetTime = new Date();
            targetTime.setHours(at.getHours(), at.getMinutes(), 0, 0);

            // If the time has already passed today, schedule for tomorrow
            if (targetTime <= now) {
                targetTime.setDate(targetTime.getDate() + 1);
            }

            // Use date trigger for the first occurrence, then rely on rescheduling
            trigger = {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: targetTime,
                channelId: Platform.OS === 'android' ? 'reminders' : undefined,
            } as Notifications.DateTriggerInput;
        } else {
            // One-off date trigger
            trigger = {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: at,
                channelId: Platform.OS === 'android' ? 'reminders' : undefined,
            } as Notifications.DateTriggerInput;
        }

        const id = await Notifications.scheduleNotificationAsync({ content, trigger });
        return id;
    }

    static async rescheduleDailyReminder(reminder: Reminder): Promise<string | null> {
        // Cancel existing notification
        if (reminder.notificationId) {
            await this.cancelNotification(reminder.notificationId);
        }

        // Schedule next occurrence (tomorrow at the same time)
        const nextOccurrence = new Date();
        const scheduledTime = new Date(reminder.scheduledTime);
        nextOccurrence.setHours(scheduledTime.getHours(), scheduledTime.getMinutes(), 0, 0);
        nextOccurrence.setDate(nextOccurrence.getDate() + 1);

        const updatedReminder = {
            ...reminder,
            scheduledTime: nextOccurrence
        };

        return this.scheduleReminderNotification(updatedReminder);
    } static async cancelNotification(notificationId: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    static async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    static async getScheduledNotifications() {
        return Notifications.getAllScheduledNotificationsAsync();
    }
}

// Test-only helpers to manage internal module state
// This is not intended for production use.
export const __testOnly = {
    resetInit: () => {
        initialized = false;
    }
}