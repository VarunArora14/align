// Test setup file for React Native and Expo
import '@testing-library/jest-native/extend-expect';

// Mock expo-sqlite first
const mockDatabase = {
    execAsync: jest.fn(() => Promise.resolve()),
    getAllAsync: jest.fn(() => Promise.resolve([])),
    runAsync: jest.fn(() => Promise.resolve()),
};

jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn(() => Promise.resolve(mockDatabase)),
}));

// Mock @google/generative-ai
const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
    generateContent: mockGenerateContent,
}));

jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn(() => ({
        getGenerativeModel: mockGetGenerativeModel,
    })),
}));

// Make mocks available globally for tests
(global as any).mockDatabase = mockDatabase;
(global as any).mockGenerateContent = mockGenerateContent;
(global as any).mockGetGenerativeModel = mockGetGenerativeModel;

// Setup fixed date for consistent testing
beforeEach(() => {
    // Reset to a fixed timestamp for each test
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-09-14T12:00:00Z'));
});

afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
});