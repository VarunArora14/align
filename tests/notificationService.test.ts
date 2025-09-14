// Mock expo-notifications BEFORE importing the module under test
jest.mock('expo-notifications', () => {
    return {
        __esModule: true,
        setNotificationHandler: jest.fn(),
        setNotificationChannelAsync: jest.fn(),
        getPermissionsAsync: jest.fn(),
        requestPermissionsAsync: jest.fn(),
        scheduleNotificationAsync: jest.fn(),
        cancelScheduledNotificationAsync: jest.fn(),
        cancelAllScheduledNotificationsAsync: jest.fn(),
        getAllScheduledNotificationsAsync: jest.fn(),
        AndroidImportance: {
            HIGH: 'high',
        },
        AndroidNotificationPriority: {
            HIGH: 'high',
        },
        SchedulableTriggerInputTypes: {
            DATE: 'date',
        },
    };
});

import { NotificationService, __testOnly } from '../services/notificationService';
import type { Reminder } from '../types/reminder';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

describe('NotificationService', () => {
    let mockReminder: Reminder;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset Platform.OS to android for each test
        (Platform as any).OS = 'android';

        // Setup default mock implementations
        (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
        (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-123');
        (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);
        (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(undefined);
        (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(undefined);
        (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([]);

        // Create a mock reminder for testing
        mockReminder = {
            id: 'reminder-1',
            title: 'Test Reminder',
            description: 'This is a test reminder',
            scheduledTime: new Date('2025-09-15T10:00:00Z'), // Tomorrow at 10 AM
            isActive: true,
            createdAt: new Date('2025-09-14T12:00:00Z'),
            updatedAt: new Date('2025-09-14T12:00:00Z'),
            repeat: 'none',
        };
    });

    describe('scheduleReminderNotification', () => {
        it('should schedule a one-off notification successfully', async () => {
            const notificationId = await NotificationService.scheduleReminderNotification(mockReminder);

            expect(notificationId).toBe('notification-id-123');
            expect((Notifications.setNotificationHandler as jest.Mock)).toHaveBeenCalledWith({
                handleNotification: expect.any(Function),
            });
            expect((Notifications.setNotificationChannelAsync as jest.Mock)).toHaveBeenCalledWith('reminders', {
                name: 'Reminders',
                importance: 'high',
                sound: 'default',
                enableVibrate: true,
                vibrationPattern: [0, 250, 250, 250],
            });
            expect((Notifications.getPermissionsAsync as jest.Mock)).toHaveBeenCalled();
            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalledWith({
                content: {
                    title: 'Reminder: Test Reminder',
                    body: 'This is a test reminder',
                    sound: 'default',
                    priority: 'high',
                    data: {
                        reminderId: 'reminder-1',
                        isDaily: false,
                    },
                },
                trigger: {
                    type: 'date',
                    date: new Date('2025-09-15T10:00:00.000Z'),
                    channelId: 'reminders',
                },
            });
        });

        it('should schedule a daily notification successfully', async () => {
            const dailyReminder = {
                ...mockReminder,
                repeat: 'daily' as const,
                scheduledTime: new Date('2025-09-14T08:00:00Z'), // Today at 8 AM (past time)
            };

            const notificationId = await NotificationService.scheduleReminderNotification(dailyReminder);

            expect(notificationId).toBe('notification-id-123');
            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalledWith({
                content: {
                    title: 'Reminder: Test Reminder',
                    body: 'This is a test reminder',
                    sound: 'default',
                    priority: 'high',
                    data: {
                        reminderId: 'reminder-1',
                        isDaily: true,
                    },
                },
                trigger: {
                    type: 'date',
                    date: new Date('2025-09-15T08:00:00.000Z'), // Tomorrow at 8 AM
                    channelId: 'reminders',
                },
            });
        });

        it('should schedule daily notification for same day if time is in future', async () => {
            const dailyReminder = {
                ...mockReminder,
                repeat: 'daily' as const,
                scheduledTime: new Date('2025-09-14T16:00:00Z'), // Today at 4 PM (future time)
            };

            const notificationId = await NotificationService.scheduleReminderNotification(dailyReminder);

            expect(notificationId).toBe('notification-id-123');
            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalledWith({
                content: {
                    title: 'Reminder: Test Reminder',
                    body: 'This is a test reminder',
                    sound: 'default',
                    priority: 'high',
                    data: {
                        reminderId: 'reminder-1',
                        isDaily: true,
                    },
                },
                trigger: {
                    type: 'date',
                    date: new Date('2025-09-14T16:00:00.000Z'), // Today at 4 PM
                    channelId: 'reminders',
                },
            });
        });

        it('should use default body when description is not provided', async () => {
            const reminderWithoutDescription = {
                ...mockReminder,
                description: undefined,
            };

            await NotificationService.scheduleReminderNotification(reminderWithoutDescription);

            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalledWith({
                content: {
                    title: 'Reminder: Test Reminder',
                    body: 'Time for your reminder!',
                    sound: 'default',
                    priority: 'high',
                    data: {
                        reminderId: 'reminder-1',
                        isDaily: false,
                    },
                },
                trigger: {
                    type: 'date',
                    date: new Date('2025-09-15T10:00:00.000Z'),
                    channelId: 'reminders',
                },
            });
        });

        it('should handle iOS platform without channel ID', async () => {
            (Platform as any).OS = 'ios';

            await NotificationService.scheduleReminderNotification(mockReminder);

            expect((Notifications.setNotificationChannelAsync as jest.Mock)).not.toHaveBeenCalled();
            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalledWith({
                content: {
                    title: 'Reminder: Test Reminder',
                    body: 'This is a test reminder',
                    sound: 'default',
                    priority: 'high',
                    data: {
                        reminderId: 'reminder-1',
                        isDaily: false,
                    },
                },
                trigger: {
                    type: 'date',
                    date: new Date('2025-09-15T10:00:00.000Z'),
                    channelId: undefined,
                },
            });
        });

        it('should return null when permissions are denied', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

            const notificationId = await NotificationService.scheduleReminderNotification(mockReminder);

            expect(notificationId).toBeNull();
            expect((Notifications.scheduleNotificationAsync as jest.Mock)).not.toHaveBeenCalled();
        });

        it('should throw error for one-off reminders scheduled in the past', async () => {
            const pastReminder = {
                ...mockReminder,
                scheduledTime: new Date('2025-09-14T08:00:00Z'), // Today at 8 AM (past time)
            };

            await expect(
                NotificationService.scheduleReminderNotification(pastReminder)
            ).rejects.toThrow('Scheduled time must be in the future');
        });

        it('should normalize seconds and milliseconds to zero', async () => {
            const reminderWithSeconds = {
                ...mockReminder,
                scheduledTime: new Date('2025-09-15T10:30:45.123Z'), // With seconds and milliseconds
            };

            await NotificationService.scheduleReminderNotification(reminderWithSeconds);

            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalledWith({
                content: expect.any(Object),
                trigger: {
                    type: 'date',
                    date: new Date('2025-09-15T10:30:00.000Z'), // Seconds and ms should be 0
                    channelId: 'reminders',
                },
            });
        });

        it('should request permissions if not already granted', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
            (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });

            const notificationId = await NotificationService.scheduleReminderNotification(mockReminder);

            expect(notificationId).toBe('notification-id-123');
            expect((Notifications.getPermissionsAsync as jest.Mock)).toHaveBeenCalled();
            expect((Notifications.requestPermissionsAsync as jest.Mock)).toHaveBeenCalled();
            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalled();
        });
    });

    describe('rescheduleDailyReminder', () => {
        it('should cancel existing notification and schedule next occurrence', async () => {
            const dailyReminder = {
                ...mockReminder,
                repeat: 'daily' as const,
                notificationId: 'existing-notification-123',
                scheduledTime: new Date('2025-09-14T10:00:00Z'), // Today at 10 AM
            };

            const newNotificationId = await NotificationService.rescheduleDailyReminder(dailyReminder);

            expect(newNotificationId).toBe('notification-id-123');
            expect((Notifications.cancelScheduledNotificationAsync as jest.Mock)).toHaveBeenCalledWith('existing-notification-123');
            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalledWith({
                content: {
                    title: 'Reminder: Test Reminder',
                    body: 'This is a test reminder',
                    sound: 'default',
                    priority: 'high',
                    data: {
                        reminderId: 'reminder-1',
                        isDaily: true,
                    },
                },
                trigger: {
                    type: 'date',
                    date: new Date('2025-09-15T10:00:00.000Z'), // Tomorrow at 10 AM
                    channelId: 'reminders',
                },
            });
        });

        it('should handle reminder without existing notification ID', async () => {
            const dailyReminder = {
                ...mockReminder,
                repeat: 'daily' as const,
                notificationId: undefined,
                scheduledTime: new Date('2025-09-14T10:00:00Z'),
            };

            const newNotificationId = await NotificationService.rescheduleDailyReminder(dailyReminder);

            expect(newNotificationId).toBe('notification-id-123');
            expect((Notifications.cancelScheduledNotificationAsync as jest.Mock)).not.toHaveBeenCalled();
            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalled();
        });
    });

    describe('cancelNotification', () => {
        it('should cancel a specific notification', async () => {
            await NotificationService.cancelNotification('notification-id-123');

            expect((Notifications.cancelScheduledNotificationAsync as jest.Mock)).toHaveBeenCalledWith('notification-id-123');
        });
    });

    describe('cancelAllNotifications', () => {
        it('should cancel all scheduled notifications', async () => {
            await NotificationService.cancelAllNotifications();

            expect((Notifications.cancelAllScheduledNotificationsAsync as jest.Mock)).toHaveBeenCalled();
        });
    });

    describe('getScheduledNotifications', () => {
        it('should return all scheduled notifications', async () => {
            const mockNotifications = [
                { id: 'notification-1', content: { title: 'Test 1' } },
                { id: 'notification-2', content: { title: 'Test 2' } },
            ];
            (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(mockNotifications);

            const result = await NotificationService.getScheduledNotifications();

            expect(result).toEqual(mockNotifications);
            expect((Notifications.getAllScheduledNotificationsAsync as jest.Mock)).toHaveBeenCalled();
        });
    });

    describe('initialization and permissions', () => {
        it('should initialize notification handler only once', async () => {
            // ensure fresh init per test
            __testOnly.resetInit();
            (Notifications.setNotificationHandler as jest.Mock).mockClear();
            // Call multiple times to test singleton behavior
            await NotificationService.scheduleReminderNotification(mockReminder);
            await NotificationService.scheduleReminderNotification(mockReminder);

            // setNotificationHandler should only be called once due to initialization check
            expect((Notifications.setNotificationHandler as jest.Mock)).toHaveBeenCalledTimes(1);
        });

        it('should handle permission request failures gracefully', async () => {
            (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
            (Notifications.requestPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Permission request failed'));

            await expect(
                NotificationService.scheduleReminderNotification(mockReminder)
            ).rejects.toThrow('Permission request failed');
        });

        it('should handle notification scheduling failures', async () => {
            (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(new Error('Scheduling failed'));

            await expect(
                NotificationService.scheduleReminderNotification(mockReminder)
            ).rejects.toThrow('Scheduling failed');
        });
    });

    describe('edge cases', () => {
        it('should handle empty reminder title', async () => {
            const reminderWithEmptyTitle = {
                ...mockReminder,
                title: '',
            };

            await NotificationService.scheduleReminderNotification(reminderWithEmptyTitle);

            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalledWith({
                content: {
                    title: 'Reminder: ',
                    body: 'This is a test reminder',
                    sound: 'default',
                    priority: 'high',
                    data: {
                        reminderId: 'reminder-1',
                        isDaily: false,
                    },
                },
                trigger: expect.any(Object),
            });
        });

        it('should handle very long reminder descriptions', async () => {
            const longDescription = 'A'.repeat(1000);
            const reminderWithLongDescription = {
                ...mockReminder,
                description: longDescription,
            };

            await NotificationService.scheduleReminderNotification(reminderWithLongDescription);

            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalledWith({
                content: {
                    title: 'Reminder: Test Reminder',
                    body: longDescription,
                    sound: 'default',
                    priority: 'high',
                    data: {
                        reminderId: 'reminder-1',
                        isDaily: false,
                    },
                },
                trigger: expect.any(Object),
            });
        });

        it('should handle undefined repeat field', async () => {
            const reminderWithUndefinedRepeat = {
                ...mockReminder,
                repeat: undefined,
            };

            await NotificationService.scheduleReminderNotification(reminderWithUndefinedRepeat);

            expect((Notifications.scheduleNotificationAsync as jest.Mock)).toHaveBeenCalledWith({
                content: expect.objectContaining({
                    data: {
                        reminderId: 'reminder-1',
                        isDaily: false,
                    },
                }),
                trigger: expect.any(Object),
            });
        });
    });
});