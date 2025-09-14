export interface Reminder {
    id: string;
    title: string;
    description?: string;
    scheduledTime: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    notificationId?: string; // Expo notification identifier
    repeat?: 'none' | 'daily'; // recurrence pattern (currently only daily supported)
}

export interface ReminderFormData {
    title: string;
    description: string;
    date: string; // YYYY-MM-DD format
    time: string; // HH:MM format
    repeatDaily?: boolean; // UI flag for daily recurrence
}

export interface ParsedReminderData {
    title: string;
    description?: string;
    date?: string; // YYYY-MM-DD format
    time?: string; // HH:MM format (24-hour)
    isRelativeTime?: boolean; // true if time is relative (e.g., "in 30 minutes")
    relativeMinutes?: number; // minutes from now if isRelativeTime is true
    usedFallback?: boolean; // true if the parser used a fallback heuristic
    repeat?: 'none' | 'daily'; // parsed recurrence if present
}

export type ReminderStatus = 'active' | 'completed' | 'cancelled';