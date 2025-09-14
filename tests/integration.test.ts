import { GeminiService } from '../services/geminiService';
import { NotificationService } from '../services/notificationService';
import * as ReminderRepo from '../services/reminderRepository';
import type { Reminder } from '../types/reminder';

// Integration tests for service interactions
describe('Service Integration Tests', () => {
    let geminiService: GeminiService;
    let mockDB: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDB = global.mockDatabase;
        geminiService = new GeminiService('test-key');

        // Fixed timestamp for consistent testing
        Date.now = jest.fn(() => new Date('2025-09-14T12:00:00Z').getTime());
    });

    describe('Complete Reminder Creation Flow', () => {
        it('should create reminder from natural language to database', async () => {
            // Mock Gemini parsing response
            const mockResponseText = JSON.stringify({
                title: 'Team meeting',
                description: 'Discuss project updates',
                date: '2025-09-15',
                time: '14:30',
                isRelativeTime: false,
                relativeMinutes: null,
                repeat: 'none',
                usedFallback: false,
            });

            global.mockGenerateContent.mockResolvedValue({
                response: { text: () => mockResponseText }
            });

            // Step 1: Parse natural language
            const parsedData = await geminiService.parseReminderText('Team meeting tomorrow at 2:30 PM to discuss project updates');

            // Step 2: Create scheduled date
            const scheduledDate = GeminiService.createScheduledDate(parsedData);

            // Step 3: Create reminder object
            const reminder: Reminder = {
                id: 'test-reminder-id',
                title: parsedData.title,
                description: parsedData.description,
                scheduledTime: scheduledDate,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: parsedData.repeat || 'none',
            };

            // Step 4: Schedule notification
            const notificationId = await NotificationService.scheduleReminderNotification(reminder);
            reminder.notificationId = notificationId;

            // Step 5: Save to database
            await ReminderRepo.createReminder(reminder);

            // Verify the complete flow
            expect(parsedData.title).toBe('Team meeting');
            expect(parsedData.description).toBe('Discuss project updates');
            expect(scheduledDate.getDate()).toBe(15);
            expect(scheduledDate.getHours()).toBe(14);
            expect(scheduledDate.getMinutes()).toBe(30);
            expect(notificationId).toBe('mock-notification-id');
            expect(mockDB.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO reminders'),
                expect.arrayContaining([
                    'test-reminder-id',
                    'Team meeting',
                    'Discuss project updates',
                    scheduledDate.getTime(),
                    1, // isActive
                    expect.any(Number),
                    expect.any(Number),
                    'mock-notification-id',
                    'none'
                ])
            );
        });

        it('should handle daily reminder creation flow', async () => {
            // Mock Gemini parsing for daily reminder
            const mockResponseText = JSON.stringify({
                title: 'Morning exercise',
                description: null,
                date: null,
                time: '07:00',
                isRelativeTime: false,
                relativeMinutes: null,
                repeat: 'daily',
                usedFallback: false,
            });

            global.mockGenerateContent.mockResolvedValue({
                response: { text: () => mockResponseText }
            });

            const parsedData = await geminiService.parseReminderText('Daily morning exercise at 7 AM');
            const scheduledDate = GeminiService.createScheduledDate(parsedData);

            const reminder: Reminder = {
                id: 'daily-reminder-id',
                title: parsedData.title,
                scheduledTime: scheduledDate,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: 'daily',
            };

            const notificationId = await NotificationService.scheduleReminderNotification(reminder);
            reminder.notificationId = notificationId;
            await ReminderRepo.createReminder(reminder);

            expect(parsedData.repeat).toBe('daily');
            expect(scheduledDate.getHours()).toBe(7);
            expect(mockDB.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO reminders'),
                expect.arrayContaining([
                    'daily-reminder-id',
                    'Morning exercise',
                    null,
                    scheduledDate.getTime(),
                    1,
                    expect.any(Number),
                    expect.any(Number),
                    'mock-notification-id',
                    'daily'
                ])
            );
        });

        it('should handle fallback parsing when Gemini fails', async () => {
            // Mock Gemini failure
            global.mockGenerateContent.mockRejectedValue(new Error('API Error'));

            const parsedData = await geminiService.parseReminderText('Call doctor at 3 PM tomorrow');
            const scheduledDate = GeminiService.createScheduledDate(parsedData);

            const reminder: Reminder = {
                id: 'fallback-reminder-id',
                title: parsedData.title,
                scheduledTime: scheduledDate,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: 'none',
            };

            const notificationId = await NotificationService.scheduleReminderNotification(reminder);
            reminder.notificationId = notificationId;
            await ReminderRepo.createReminder(reminder);

            expect(parsedData.usedFallback).toBe(true);
            expect(parsedData.title).toContain('Call doctor');
            expect(notificationId).toBe('mock-notification-id');
            expect(mockDB.runAsync).toHaveBeenCalled();
        });
    });

    describe('Reminder Update Flow', () => {
        it('should update reminder and reschedule notification', async () => {
            const existingReminder: Reminder = {
                id: 'existing-id',
                title: 'Old title',
                scheduledTime: new Date('2025-09-15T10:00:00Z'),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: 'none',
                notificationId: 'old-notification-id',
            };

            // Step 1: Cancel old notification
            await NotificationService.cancelNotification('old-notification-id');

            // Step 2: Update reminder details
            const updatedReminder = {
                ...existingReminder,
                title: 'Updated title',
                scheduledTime: new Date('2025-09-15T15:00:00Z'),
                updatedAt: new Date(),
            };

            // Step 3: Schedule new notification
            const newNotificationId = await NotificationService.scheduleReminderNotification(updatedReminder);
            updatedReminder.notificationId = newNotificationId;

            // Step 4: Update in database
            await ReminderRepo.updateReminder(updatedReminder);

            // Verify flow
            expect(require('expo-notifications').cancelScheduledNotificationAsync)
                .toHaveBeenCalledWith('old-notification-id');
            expect(newNotificationId).toBe('mock-notification-id');
            expect(mockDB.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE reminders'),
                expect.arrayContaining([
                    'Updated title',
                    null,
                    updatedReminder.scheduledTime.getTime(),
                    1,
                    expect.any(Number),
                    'mock-notification-id',
                    'none',
                    'existing-id'
                ])
            );
        });
    });

    describe('Daily Reminder Rescheduling Flow', () => {
        it('should reschedule daily reminder and update database', async () => {
            const dailyReminder: Reminder = {
                id: 'daily-id',
                title: 'Daily reminder',
                scheduledTime: new Date('2025-09-14T09:00:00Z'),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: 'daily',
                notificationId: 'daily-notification-id',
            };

            // Step 1: Reschedule daily reminder (simulates notification firing)
            const newNotificationId = await NotificationService.rescheduleDailyReminder(dailyReminder);

            // Step 2: Update notification ID in database
            await ReminderRepo.updateReminderNotificationId(dailyReminder.id, newNotificationId);

            // Verify flow
            expect(require('expo-notifications').cancelScheduledNotificationAsync)
                .toHaveBeenCalledWith('daily-notification-id');
            expect(newNotificationId).toBe('mock-notification-id');
            expect(mockDB.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE reminders SET notificationId = ?, updatedAt = ? WHERE id = ?'),
                ['mock-notification-id', expect.any(Number), 'daily-id']
            );
        });
    });

    describe('Reminder Deletion Flow', () => {
        it('should cancel notification and delete from database', async () => {
            const reminderToDelete: Reminder = {
                id: 'delete-id',
                title: 'To be deleted',
                scheduledTime: new Date(),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: 'none',
                notificationId: 'delete-notification-id',
            };

            // Step 1: Cancel notification
            await NotificationService.cancelNotification('delete-notification-id');

            // Step 2: Delete from database
            await ReminderRepo.deleteReminder('delete-id');

            // Verify flow
            expect(require('expo-notifications').cancelScheduledNotificationAsync)
                .toHaveBeenCalledWith('delete-notification-id');
            expect(mockDB.runAsync).toHaveBeenCalledWith(
                'DELETE FROM reminders WHERE id = ?;',
                ['delete-id']
            );
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle notification scheduling failure gracefully', async () => {
            // Mock notification scheduling failure
            require('expo-notifications').scheduleNotificationAsync
                .mockRejectedValue(new Error('Notification error'));

            const reminder: Reminder = {
                id: 'error-test-id',
                title: 'Test reminder',
                scheduledTime: new Date('2025-09-15T12:00:00Z'),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: 'none',
            };

            // Should propagate the error
            await expect(
                NotificationService.scheduleReminderNotification(reminder)
            ).rejects.toThrow('Notification error');

            // Database should not be called if notification fails
            expect(mockDB.runAsync).not.toHaveBeenCalled();
        });

        it('should handle database creation failure gracefully', async () => {
            mockDB.runAsync.mockRejectedValue(new Error('Database error'));

            const reminder: Reminder = {
                id: 'db-error-test-id',
                title: 'Test reminder',
                scheduledTime: new Date(),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: 'none',
            };

            await expect(
                ReminderRepo.createReminder(reminder)
            ).rejects.toThrow('Database error');
        });

        it('should handle permission denied scenario', async () => {
            // Mock permission denied
            require('expo-notifications').getPermissionsAsync
                .mockResolvedValue({ status: 'denied' });
            require('expo-notifications').requestPermissionsAsync
                .mockResolvedValue({ status: 'denied' });

            const reminder: Reminder = {
                id: 'permission-test-id',
                title: 'Test reminder',
                scheduledTime: new Date('2025-09-15T12:00:00Z'),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: 'none',
            };

            const result = await NotificationService.scheduleReminderNotification(reminder);

            expect(result).toBeNull();
            expect(require('expo-notifications').scheduleNotificationAsync).not.toHaveBeenCalled();
        });
    });

    describe('Data Flow Validation', () => {
        it('should maintain data consistency across services', async () => {
            const testDate = new Date('2025-09-15T14:30:00Z');

            // Create reminder with specific data
            const reminder: Reminder = {
                id: 'consistency-test-id',
                title: 'Consistency Test',
                description: 'Test description',
                scheduledTime: testDate,
                isActive: true,
                createdAt: new Date('2025-09-14T12:00:00Z'),
                updatedAt: new Date('2025-09-14T12:00:00Z'),
                repeat: 'daily',
            };

            // Schedule notification
            const notificationId = await NotificationService.scheduleReminderNotification(reminder);
            reminder.notificationId = notificationId;

            // Save to database
            await ReminderRepo.createReminder(reminder);

            // Retrieve from database
            mockDB.getAllAsync.mockResolvedValue([{
                id: 'consistency-test-id',
                title: 'Consistency Test',
                description: 'Test description',
                scheduledTime: testDate.getTime(),
                isActive: 1,
                createdAt: new Date('2025-09-14T12:00:00Z').getTime(),
                updatedAt: new Date('2025-09-14T12:00:00Z').getTime(),
                repeat: 'daily',
                notificationId: 'mock-notification-id',
            }]);

            const retrievedReminders = await ReminderRepo.getAllReminders();
            const retrievedReminder = retrievedReminders[0];

            // Verify data consistency
            expect(retrievedReminder.id).toBe(reminder.id);
            expect(retrievedReminder.title).toBe(reminder.title);
            expect(retrievedReminder.description).toBe(reminder.description);
            expect(retrievedReminder.scheduledTime).toEqual(reminder.scheduledTime);
            expect(retrievedReminder.isActive).toBe(reminder.isActive);
            expect(retrievedReminder.repeat).toBe(reminder.repeat);
            expect(retrievedReminder.notificationId).toBe(notificationId);
        });
    });
});