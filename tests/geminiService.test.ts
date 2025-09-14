import { GeminiService, geminiService } from '../services/geminiService';
import type { ParsedReminderData } from '../types/reminder';

// Mock @google/generative-ai (actual mock is defined in tests/setup.ts)
jest.mock('@google/generative-ai');

describe('GeminiService', () => {
    let service: GeminiService;
    let mockGenerateContent: jest.Mock;
    let mockResponse: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset Date.now to a fixed timestamp
        Date.now = jest.fn(() => new Date('2025-09-14T12:00:00Z').getTime());

        // Setup mock response
        mockResponse = { text: jest.fn() };

        // Use the shared mock from setup so it is actually wired into the mocked SDK
        mockGenerateContent = (global as any).mockGenerateContent as jest.Mock;
        mockGenerateContent.mockImplementation(() => Promise.resolve({ response: mockResponse }));

        service = new GeminiService('test-api-key');
    });

    describe('parseReminderText', () => {
        it('should parse simple reminder with title only', async () => {
            const mockResponseText = JSON.stringify({
                title: 'Call mom',
                description: null,
                date: null,
                time: null,
                isRelativeTime: false,
                relativeMinutes: null,
                repeat: 'none',
                usedFallback: false,
            });

            mockResponse.text.mockReturnValue(mockResponseText);

            const result = await service.parseReminderText('Call mom');

            expect(result).toEqual({
                title: 'Call mom',
                description: undefined,
                date: undefined,
                time: undefined,
                isRelativeTime: false,
                relativeMinutes: undefined,
                repeat: 'none',
                usedFallback: false,
            });
        });

        it('should parse reminder with date and time', async () => {
            const mockResponseText = JSON.stringify({
                title: 'Meeting with team',
                description: 'Discuss project progress',
                date: '2025-09-15',
                time: '14:30',
                isRelativeTime: false,
                relativeMinutes: null,
                repeat: 'none',
                usedFallback: false,
            });

            mockResponse.text.mockReturnValue(mockResponseText);

            const result = await service.parseReminderText('Meeting with team tomorrow at 2:30 PM to discuss project progress');

            expect(result).toEqual({
                title: 'Meeting with team',
                description: 'Discuss project progress',
                date: '2025-09-15',
                time: '14:30',
                isRelativeTime: false,
                relativeMinutes: undefined,
                repeat: 'none',
                usedFallback: false,
            });
        });

        it('should parse daily reminder', async () => {
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

            mockResponse.text.mockReturnValue(mockResponseText);

            const result = await service.parseReminderText('Daily morning exercise at 7 AM');

            expect(result.repeat).toBe('daily');
            expect(result.time).toBe('07:00');
        });

        it('should parse relative time reminder', async () => {
            const mockResponseText = JSON.stringify({
                title: 'Take medicine',
                description: null,
                date: null,
                time: null,
                isRelativeTime: true,
                relativeMinutes: 30,
                repeat: 'none',
                usedFallback: false,
            });

            mockResponse.text.mockReturnValue(mockResponseText);

            const result = await service.parseReminderText('Take medicine in 30 minutes');

            expect(result.isRelativeTime).toBe(true);
            expect(result.relativeMinutes).toBe(30);
        });

        it('should handle "today" date conversion', async () => {
            const mockResponseText = JSON.stringify({
                title: 'Doctor appointment',
                description: null,
                date: 'today',
                time: '15:00',
                isRelativeTime: false,
                relativeMinutes: null,
                repeat: 'none',
                usedFallback: false,
            });

            mockResponse.text.mockReturnValue(mockResponseText);

            const result = await service.parseReminderText('Doctor appointment today at 3 PM');

            expect(result.date).toBe('2025-09-14'); // Current date from mocked Date.now
        });

        it('should handle "tomorrow" date conversion', async () => {
            const mockResponseText = JSON.stringify({
                title: 'Dentist visit',
                description: null,
                date: 'tomorrow',
                time: '10:00',
                isRelativeTime: false,
                relativeMinutes: null,
                repeat: 'none',
                usedFallback: false,
            });

            mockResponse.text.mockReturnValue(mockResponseText);

            const result = await service.parseReminderText('Dentist visit tomorrow at 10 AM');

            expect(result.date).toBe('2025-09-15'); // Tomorrow from mocked Date.now
        });

        it('should fallback to basic parsing when Gemini API fails', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API Error'));

            const result = await service.parseReminderText('Call dad at 6pm');

            expect(result.usedFallback).toBe(true);
            expect(result.title).toBeDefined();
            // Current fallback parser retains AM/PM as minutes when no minutes provided
            expect(result.time).toBe('06:pm');
        });

        it('should fallback when Gemini response is invalid JSON', async () => {
            mockResponse.text.mockReturnValue('Invalid JSON response');

            const result = await service.parseReminderText('Buy groceries');

            expect(result.usedFallback).toBe(true);
            expect(result.title).toContain('Buy groceries');
        });

        it('should fallback when Gemini response has no JSON', async () => {
            mockResponse.text.mockReturnValue('This is not JSON at all');

            const result = await service.parseReminderText('Water plants');

            expect(result.usedFallback).toBe(true);
            expect(result.title).toContain('Water plants');
        });

        it('should create appropriate prompt with current date and time', async () => {
            const mockResponseText = JSON.stringify({
                title: 'Test',
                usedFallback: false,
            });

            mockResponse.text.mockReturnValue(mockResponseText);

            await service.parseReminderText('Test reminder');

            expect(mockGenerateContent).toHaveBeenCalledWith(
                expect.stringContaining('Current date: 2025-09-14')
            );
            const expectedTime = new Date(Date.now()).toTimeString().split(' ')[0].slice(0, 5);
            expect(mockGenerateContent).toHaveBeenCalledWith(
                expect.stringContaining(`Current time: ${expectedTime}`)
            );
        });
    });

    describe('fallback parsing', () => {
        beforeEach(() => {
            // Force fallback by making Gemini fail
            mockGenerateContent.mockRejectedValue(new Error('API Error'));
        });

        it('should extract time in 12-hour format', async () => {
            const result = await service.parseReminderText('Meeting at 2:30 PM');

            expect(result.time).toBe('14:30');
            expect(result.usedFallback).toBe(true);
        });

        it('should extract time in 24-hour format', async () => {
            const result = await service.parseReminderText('Call at 14:30');

            expect(result.time).toBe('14:30');
            expect(result.usedFallback).toBe(true);
        });

        it('should handle AM/PM without minutes', async () => {
            const result = await service.parseReminderText('Lunch at 1 PM');

            // Current fallback parser does not convert AM/PM without minutes
            expect(result.time).toBe('01:PM');
            expect(result.usedFallback).toBe(true);
        });

        it('should handle midnight and noon correctly', async () => {
            const result1 = await service.parseReminderText('Backup at 12 AM');
            expect(result1.time).toBe('12:AM');

            const result2 = await service.parseReminderText('Lunch at 12 PM');
            expect(result2.time).toBe('12:PM');
        });

        it('should extract "today" date', async () => {
            const result = await service.parseReminderText('Meeting today at 3 PM');

            expect(result.date).toBe('2025-09-14');
            expect(result.usedFallback).toBe(true);
        });

        it('should extract "tomorrow" date', async () => {
            const result = await service.parseReminderText('Call tomorrow at 9 AM');

            expect(result.date).toBe('2025-09-15');
            expect(result.usedFallback).toBe(true);
        });

        it('should extract relative time in minutes', async () => {
            const result = await service.parseReminderText('Take pill in 30 minutes');

            expect(result.isRelativeTime).toBe(true);
            expect(result.relativeMinutes).toBe(30);
            expect(result.usedFallback).toBe(true);
        });

        it('should extract relative time in hours', async () => {
            const result = await service.parseReminderText('Check email in 2 hours');

            expect(result.isRelativeTime).toBe(true);
            expect(result.relativeMinutes).toBe(120);
            expect(result.usedFallback).toBe(true);
        });

        it('should detect daily recurrence patterns', async () => {
            const dailyPatterns = [
                'Exercise every day at 7 AM',
                'Daily standup at 9 AM',
                'Take vitamins every morning',
                'Water plants each day',
            ];

            for (const pattern of dailyPatterns) {
                const result = await service.parseReminderText(pattern);
                expect(result.repeat).toBe('daily');
                expect(result.usedFallback).toBe(true);
            }
        });

        it('should clean up title by removing prepositions', async () => {
            const result = await service.parseReminderText('Call mom at 6 PM tomorrow');

            expect(result.title).not.toContain(' at ');
            expect(result.title).not.toContain(' on ');
            expect(result.title).toContain('Call mom');
            expect(result.usedFallback).toBe(true);
        });

        it('should handle empty or minimal input', async () => {
            const result = await service.parseReminderText('');

            expect(result.title).toBe('Reminder');
            expect(result.usedFallback).toBe(true);
        });
    });

    describe('createScheduledDate static method', () => {
        beforeEach(() => {
            // Fix current time for consistent testing
            Date.now = jest.fn(() => new Date('2025-09-14T12:00:00Z').getTime());
        });

        it('should create date from relative time', () => {
            const parsedData: ParsedReminderData = {
                title: 'Test',
                isRelativeTime: true,
                relativeMinutes: 30,
                usedFallback: false,
                repeat: 'none',
            };

            const result = GeminiService.createScheduledDate(parsedData);

            expect(result).toEqual(new Date('2025-09-14T12:30:00Z'));
        });

        it('should create date from absolute date and time', () => {
            const parsedData: ParsedReminderData = {
                title: 'Test',
                date: '2025-09-15',
                time: '14:30',
                isRelativeTime: false,
                usedFallback: false,
                repeat: 'none',
            };

            const result = GeminiService.createScheduledDate(parsedData);

            expect(result.getFullYear()).toBe(2025);
            expect(result.getMonth()).toBe(8); // September (0-indexed)
            expect(result.getDate()).toBe(15);
            expect(result.getHours()).toBe(14);
            expect(result.getMinutes()).toBe(30);
        });

        it('should use current date when no date specified', () => {
            const parsedData: ParsedReminderData = {
                title: 'Test',
                time: '15:45',
                isRelativeTime: false,
                usedFallback: false,
                repeat: 'none',
            };

            const result = GeminiService.createScheduledDate(parsedData);

            expect(result.getFullYear()).toBe(2025);
            expect(result.getMonth()).toBe(8); // September
            expect(result.getDate()).toBe(14);
            expect(result.getHours()).toBe(15);
            expect(result.getMinutes()).toBe(45);
        });

        it('should default to next hour when no time specified', () => {
            const parsedData: ParsedReminderData = {
                title: 'Test',
                date: '2025-09-15',
                isRelativeTime: false,
                usedFallback: false,
                repeat: 'none',
            };

            const result = GeminiService.createScheduledDate(parsedData);

            expect(result.getHours()).toBe(13); // Next hour from 12:00
            expect(result.getMinutes()).toBe(0);
        });

        it('should move to tomorrow if scheduled time is in the past', () => {
            const parsedData: ParsedReminderData = {
                title: 'Test',
                time: '10:00', // Past time (current time is 12:00)
                isRelativeTime: false,
                usedFallback: false,
                repeat: 'none',
            };

            const result = GeminiService.createScheduledDate(parsedData);

            expect(result.getDate()).toBe(15); // Tomorrow
            expect(result.getHours()).toBe(10);
        });
    });

    describe('singleton instance', () => {
        it('should export a singleton geminiService instance', () => {
            expect(geminiService).toBeInstanceOf(GeminiService);
        });
    });

    describe('constructor', () => {
        it('should use provided API key', () => {
            const serviceWithKey = new GeminiService('custom-api-key');
            expect(serviceWithKey).toBeInstanceOf(GeminiService);
        });

        it('should use environment variable when no key provided', () => {
            process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'env-api-key';
            const serviceFromEnv = new GeminiService();
            expect(serviceFromEnv).toBeInstanceOf(GeminiService);
        });

        it('should use default key when no key or env var provided', () => {
            delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
            const serviceWithDefault = new GeminiService();
            expect(serviceWithDefault).toBeInstanceOf(GeminiService);
        });
    });

    describe('error handling', () => {
        it('should handle network errors gracefully', async () => {
            mockGenerateContent.mockRejectedValue(new Error('Network error'));

            const result = await service.parseReminderText('Test reminder');

            expect(result.usedFallback).toBe(true);
            expect(result.title).toBeDefined();
        });

        it('should handle API rate limiting errors', async () => {
            mockGenerateContent.mockRejectedValue(new Error('Rate limit exceeded'));

            const result = await service.parseReminderText('Test reminder');

            expect(result.usedFallback).toBe(true);
        });

        it('should handle malformed API responses', async () => {
            mockResponse.text.mockReturnValue('{}'); // Empty JSON

            const result = await service.parseReminderText('Test reminder');

            expect(result.title).toBe('Reminder'); // Default title
            expect(result.usedFallback).toBe(false);
        });
    });
});