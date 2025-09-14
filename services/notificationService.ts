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

        if (reminder.isRecurring && reminder.recurringDays && reminder.recurringDays.length > 0) {
            // Weekly recurring based on selected weekdays at the scheduled hour/minute
            const when = new Date(reminder.scheduledTime);
            const hour = when.getHours();
            const minute = when.getMinutes();
            const ids = await scheduleWeeklyReminders(
                hour,
                minute,
                reminder.recurringDays,
                `Reminder: ${reminder.title}`,
                reminder.description || 'Time for your reminder!',
                reminder.id,
            );
            return ids[0] ?? null;
        }

        // One-time
        const id = await scheduleOneTimeReminder(
            new Date(reminder.scheduledTime),
            `Reminder: ${reminder.title}`,
            reminder.description || 'Time for your reminder!',
            reminder.id,
        );
        return id;
    }

    static async scheduleRecurringReminder(reminder: Reminder): Promise<string | null> {
        // Backward-compatible: delegate to weekly scheduler
        if (!reminder.isRecurring || !reminder.recurringDays || reminder.recurringDays.length === 0) return null;
        const when = new Date(reminder.scheduledTime);
        const hour = when.getHours();
        const minute = when.getMinutes();
        const ids = await scheduleWeeklyReminders(
            hour,
            minute,
            reminder.recurringDays,
            `Reminder: ${reminder.title}`,
            reminder.description || 'Time for your reminder!',
            reminder.id,
        );
        return ids[0] ?? null;
    }

    static async cancelRecurringNotifications(reminderId: string): Promise<void> {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const recurringNotifications = scheduled.filter(notification =>
            notification.content.data?.reminderId === reminderId &&
            notification.content.data?.isRecurring
        );

        for (const notification of recurringNotifications) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }

    static async cancelNotification(notificationId: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    static async cancelReminderNotifications(reminder: Reminder): Promise<void> {
        if (reminder.isRecurring) {
            await this.cancelRecurringNotifications(reminder.id);
        } else if (reminder.notificationId) {
            await this.cancelNotification(reminder.notificationId);
        }
    }

    static async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    static async getScheduledNotifications() {
        return Notifications.getAllScheduledNotificationsAsync();
    }
}

// ————————————————————————————————————————————————
// Simple helper APIs (exported) for one-time and weekly scheduling
// Aligns with Expo's calendar-based repeating triggers.

export async function scheduleOneTimeReminder(
    date: Date,
    title: string,
    body?: string,
    reminderId?: string,
): Promise<string | null> {
    await ensureInitialized();
    const permitted = await ensurePermissions();
    if (!permitted) return null;

    const at = new Date(date);
    at.setSeconds(0, 0);
    if (at <= new Date()) {
        throw new Error('Scheduled time must be in the future');
    }

    const content: Notifications.NotificationContentInput = {
        title,
        body: body ?? 'Time for your reminder!',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { reminderId, isRecurring: false },
    };

    const trigger: Notifications.DateTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
        channelId: Platform.OS === 'android' ? 'reminders' : undefined,
    };

    return await Notifications.scheduleNotificationAsync({ content, trigger });
}

/**
 * weekdays follow Expo mapping: 1=Sun … 7=Sat
 */
export async function scheduleWeeklyReminders(
    hour: number,
    minute: number,
    weekdays: number[],
    title: string,
    body?: string,
    reminderId?: string,
): Promise<string[]> {
    await ensureInitialized();
    const permitted = await ensurePermissions();
    if (!permitted) return [];

    const ids: string[] = [];
    for (const day of weekdays) {
        // Tag each scheduled notification with its weekday for precise control later
        const content: Notifications.NotificationContentInput = {
            title,
            body: body ?? 'Time for your reminder!',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { reminderId, isRecurring: true, weekday: day },
        };

        console.log("notification content: ", content)
        const trigger: Notifications.CalendarTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            weekday: day as any, // 1 (Sun) .. 7 (Sat)
            hour,
            minute,
            repeats: true,
            channelId: Platform.OS === 'android' ? 'reminders' : undefined,
        };
        const id = await Notifications.scheduleNotificationAsync({ content, trigger });
        ids.push(id);
    }
    return ids;
}

/**
 * Returns all scheduled notification IDs associated with a given reminderId.
 * Useful when you want to show count or debug per-reminder schedules without
 * persisting every ID.
 */
export async function listNotificationIdsForReminder(
    reminderId: string,
    { onlyRecurring = false }: { onlyRecurring?: boolean } = {}
): Promise<string[]> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled
        .filter(n => n.content?.data?.reminderId === reminderId && (!onlyRecurring || n.content?.data?.isRecurring))
        .map(n => n.identifier);
}

/**
 * Cancel only one weekday for a recurring reminder.
 * Example: cancelWeeklyReminderDay(reminder.id, 3) // Tuesday if 1=Sun
 */
export async function cancelWeeklyReminderDay(reminderId: string, weekday: number): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const targets = scheduled.filter(n => n.content?.data?.reminderId === reminderId && n.content?.data?.isRecurring && n.content?.data?.weekday === weekday);
    for (const n of targets) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
}