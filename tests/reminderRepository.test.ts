import * as ReminderRepo from '../services/reminderRepository';
import type { Reminder } from '../types/reminder';

describe('ReminderRepository', () => {
    let mockDB: any;

    beforeEach(() => {
        mockDB = global.mockDatabase;
        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    describe('initDB', () => {
        it('should create reminders table with correct schema', async () => {
            await ReminderRepo.initDB();

            expect(mockDB.execAsync).toHaveBeenCalledWith(
                expect.stringContaining('CREATE TABLE IF NOT EXISTS reminders')
            );
            expect(mockDB.execAsync).toHaveBeenCalledWith(
                expect.stringContaining('id TEXT PRIMARY KEY')
            );
            expect(mockDB.execAsync).toHaveBeenCalledWith(
                expect.stringContaining('title TEXT NOT NULL')
            );
            expect(mockDB.execAsync).toHaveBeenCalledWith(
                expect.stringContaining('repeat TEXT DEFAULT \'none\'')
            );
        });

        it('should handle database initialization errors', async () => {
            mockDB.execAsync.mockRejectedValueOnce(new Error('Database error'));

            await expect(ReminderRepo.initDB()).rejects.toThrow('Database error');
        });
    });

    describe('getAllReminders', () => {
        it('should return empty array when no reminders exist', async () => {
            mockDB.getAllAsync.mockResolvedValue([]);

            const result = await ReminderRepo.getAllReminders();

            expect(result).toEqual([]);
            expect(mockDB.getAllAsync).toHaveBeenCalledWith('SELECT * FROM reminders');
        });

        it('should transform database rows to Reminder objects correctly', async () => {
            const mockRows = [
                {
                    id: 'r1',
                    title: 'Test Reminder',
                    description: 'Test Description',
                    scheduledTime: 1726315200000, // timestamp
                    isActive: 1,
                    createdAt: 1726315100000,
                    updatedAt: 1726315150000,
                    notificationId: 'n1',
                    repeat: 'daily',
                },
                {
                    id: 'r2',
                    title: 'Test Reminder 2',
                    description: null,
                    scheduledTime: 1726315300000,
                    isActive: 0,
                    createdAt: 1726315200000,
                    updatedAt: 1726315200000,
                    notificationId: null,
                    repeat: 'none',
                },
            ];

            mockDB.getAllAsync.mockResolvedValue(mockRows);

            const result = await ReminderRepo.getAllReminders();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'r1',
                title: 'Test Reminder',
                description: 'Test Description',
                scheduledTime: new Date(1726315200000),
                isActive: true,
                createdAt: new Date(1726315100000),
                updatedAt: new Date(1726315150000),
                notificationId: 'n1',
                repeat: 'daily',
            });
            expect(result[1]).toEqual({
                id: 'r2',
                title: 'Test Reminder 2',
                description: undefined,
                scheduledTime: new Date(1726315300000),
                isActive: false,
                createdAt: new Date(1726315200000),
                updatedAt: new Date(1726315200000),
                notificationId: undefined,
                repeat: 'none',
            });
        });

        it('should handle database query errors', async () => {
            mockDB.getAllAsync.mockRejectedValue(new Error('Query failed'));

            await expect(ReminderRepo.getAllReminders()).rejects.toThrow('Query failed');
        });
    });

    describe('createReminder', () => {
        it('should insert reminder with all fields correctly', async () => {
            const reminder: Reminder = {
                id: 'test-id',
                title: 'Test Reminder',
                description: 'Test Description',
                scheduledTime: new Date('2025-09-14T15:30:00Z'),
                isActive: true,
                createdAt: new Date('2025-09-14T12:00:00Z'),
                updatedAt: new Date('2025-09-14T12:00:00Z'),
                notificationId: 'notification-id',
                repeat: 'daily',
            };

            await ReminderRepo.createReminder(reminder);

            expect(mockDB.runAsync).toHaveBeenCalledWith(
                'INSERT INTO reminders (id, title, description, scheduledTime, isActive, createdAt, updatedAt, notificationId, repeat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
                [
                    'test-id',
                    'Test Reminder',
                    'Test Description',
                    reminder.scheduledTime.getTime(),
                    1,
                    reminder.createdAt.getTime(),
                    reminder.updatedAt.getTime(),
                    'notification-id',
                    'daily',
                ]
            );
        });

        it('should handle optional fields (description, notificationId) as null', async () => {
            const reminder: Reminder = {
                id: 'test-id',
                title: 'Test Reminder',
                scheduledTime: new Date('2025-09-14T15:30:00Z'),
                isActive: false,
                createdAt: new Date('2025-09-14T12:00:00Z'),
                updatedAt: new Date('2025-09-14T12:00:00Z'),
                repeat: 'none',
            };

            await ReminderRepo.createReminder(reminder);

            expect(mockDB.runAsync).toHaveBeenCalledWith(
                expect.any(String),
                [
                    'test-id',
                    'Test Reminder',
                    null, // description
                    reminder.scheduledTime.getTime(),
                    0, // isActive false
                    reminder.createdAt.getTime(),
                    reminder.updatedAt.getTime(),
                    null, // notificationId
                    'none',
                ]
            );
        });

        it('should handle database insertion errors', async () => {
            const reminder: Reminder = {
                id: 'test-id',
                title: 'Test Reminder',
                scheduledTime: new Date(),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: 'none',
            };

            mockDB.runAsync.mockRejectedValueOnce(new Error('Insert failed'));

            await expect(ReminderRepo.createReminder(reminder)).rejects.toThrow('Insert failed');
        });
    });

    describe('updateReminder', () => {
        it('should update reminder with all fields correctly', async () => {
            const reminder: Reminder = {
                id: 'test-id',
                title: 'Updated Reminder',
                description: 'Updated Description',
                scheduledTime: new Date('2025-09-14T16:30:00Z'),
                isActive: false,
                createdAt: new Date('2025-09-14T12:00:00Z'),
                updatedAt: new Date('2025-09-14T13:00:00Z'),
                notificationId: 'new-notification-id',
                repeat: 'daily',
            };

            await ReminderRepo.updateReminder(reminder);

            expect(mockDB.runAsync).toHaveBeenCalledWith(
                'UPDATE reminders SET title = ?, description = ?, scheduledTime = ?, isActive = ?, updatedAt = ?, notificationId = ?, repeat = ? WHERE id = ?;',
                [
                    'Updated Reminder',
                    'Updated Description',
                    reminder.scheduledTime.getTime(),
                    0, // isActive false
                    reminder.updatedAt.getTime(),
                    'new-notification-id',
                    'daily',
                    'test-id',
                ]
            );
        });

        it('should handle database update errors', async () => {
            const reminder: Reminder = {
                id: 'test-id',
                title: 'Test Reminder',
                scheduledTime: new Date(),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                repeat: 'none',
            };

            mockDB.runAsync.mockRejectedValueOnce(new Error('Update failed'));

            await expect(ReminderRepo.updateReminder(reminder)).rejects.toThrow('Update failed');
        });
    });

    describe('deleteReminder', () => {
        it('should delete reminder by id', async () => {
            await ReminderRepo.deleteReminder('test-id');

            expect(mockDB.runAsync).toHaveBeenCalledWith(
                'DELETE FROM reminders WHERE id = ?;',
                ['test-id']
            );
        });

        it('should handle database deletion errors', async () => {
            mockDB.runAsync.mockRejectedValueOnce(new Error('Delete failed'));

            await expect(ReminderRepo.deleteReminder('test-id')).rejects.toThrow('Delete failed');
        });
    });

    describe('updateReminderNotificationId', () => {
        it('should update notification id and updatedAt timestamp', async () => {
            const fixedTimestamp = 1726315200000;
            Date.now = jest.fn(() => fixedTimestamp);

            await ReminderRepo.updateReminderNotificationId('test-id', 'new-notification-id');

            expect(mockDB.runAsync).toHaveBeenCalledWith(
                'UPDATE reminders SET notificationId = ?, updatedAt = ? WHERE id = ?;',
                ['new-notification-id', fixedTimestamp, 'test-id']
            );
        });

        it('should handle null notification id', async () => {
            const fixedTimestamp = 1726315200000;
            Date.now = jest.fn(() => fixedTimestamp);

            await ReminderRepo.updateReminderNotificationId('test-id', null);

            expect(mockDB.runAsync).toHaveBeenCalledWith(
                expect.any(String),
                [null, fixedTimestamp, 'test-id']
            );
        });

        it('should handle database update errors', async () => {
            mockDB.runAsync.mockRejectedValueOnce(new Error('Update notification id failed'));

            await expect(
                ReminderRepo.updateReminderNotificationId('test-id', 'notification-id')
            ).rejects.toThrow('Update notification id failed');
        });
    });

    describe('default export', () => {
        it('should export all functions as default object', () => {
            const defaultExport = require('../services/reminderRepository').default;

            expect(defaultExport).toHaveProperty('initDB');
            expect(defaultExport).toHaveProperty('getAllReminders');
            expect(defaultExport).toHaveProperty('createReminder');
            expect(defaultExport).toHaveProperty('updateReminder');
            expect(defaultExport).toHaveProperty('deleteReminder');
            expect(defaultExport).toHaveProperty('updateReminderNotificationId');
        });
    });
});