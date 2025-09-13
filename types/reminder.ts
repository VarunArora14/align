export interface Reminder {
    id: string;
    title: string;
    description?: string;
    scheduledTime: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    notificationId?: string; // Expo notification identifier
}

export interface ReminderFormData {
    title: string;
    description: string;
    date: string; // YYYY-MM-DD format
    time: string; // HH:MM format
}

export type ReminderStatus = 'active' | 'completed' | 'cancelled';