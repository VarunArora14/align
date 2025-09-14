export interface Reminder {
    id: string;
    title: string;
    description?: string;
    scheduledTime: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    notificationId?: string; // Expo notification identifier
    recurringNotificationIds?: string[]; // For recurring reminders - multiple notification IDs

    // Recurring fields
    isRecurring: boolean;
    recurringType?: 'daily';
    recurringEndDate?: Date;
    recurringDays?: number[]; // [1..7] for specific weekdays (1=Sun … 7=Sat)
    lastTriggered?: Date;
    nextScheduled?: Date;
}

export interface ReminderFormData {
    title: string;
    description: string;
    date: string; // YYYY-MM-DD format
    time: string; // HH:MM format
    isRecurring: boolean;
    recurringType?: 'daily';
    recurringDays?: number[]; // [1..7] for specific weekdays (1=Sun … 7=Sat)
}

export interface ParsedReminderData {
    title: string;
    description?: string;
    date?: string; // YYYY-MM-DD format
    time?: string; // HH:MM format (24-hour)
    isRelativeTime?: boolean; // true if time is relative (e.g., "in 30 minutes")
    relativeMinutes?: number; // minutes from now if isRelativeTime is true
    usedFallback?: boolean; // true if the parser used a fallback heuristic

    // Recurring fields
    isRecurring?: boolean;
    recurringType?: 'daily';
    recurringDays?: number[]; // [1..7] for specific weekdays (1=Sun … 7=Sat)
}

export interface RecurringReminderData {
    isRecurring: boolean;
    recurringType?: 'daily';
    recurringEndDate?: Date;
    recurringDays?: number[]; // [1..7] For "weekdays only" functionality
}

export type ReminderStatus = 'active' | 'completed' | 'cancelled';