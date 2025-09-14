import * as SQLite from 'expo-sqlite';
import type { Reminder } from '../types/reminder';

const DB_NAME = 'align_reminders.db';
const TABLE = 'reminders';

// Use the modern async opener
let db: SQLite.SQLiteDatabase | null = null;

async function getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!db) {
        db = await SQLite.openDatabaseAsync(DB_NAME);
    }
    return db;
}

export async function initDB() {

    // shows mock data if uncomment below
    // throw Error("mock data error!")
    const database = await getDB();
    await database.execAsync(`CREATE TABLE IF NOT EXISTS ${TABLE} (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        scheduledTime INTEGER NOT NULL,
        isActive INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        notificationId TEXT,
        repeat TEXT DEFAULT 'none'
    );`);
}

export async function getAllReminders(): Promise<Reminder[]> {
    const database = await getDB();
    const rows = await database.getAllAsync(`SELECT * FROM ${TABLE}`);

    return rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? undefined,
        scheduledTime: new Date(r.scheduledTime),
        isActive: !!r.isActive,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
        notificationId: r.notificationId ?? undefined,
        repeat: (r.repeat as 'none' | 'daily') ?? 'none',
    }));
}

export async function createReminder(reminder: Reminder): Promise<void> {
    const database = await getDB();
    await database.runAsync(
        `INSERT INTO ${TABLE} (id, title, description, scheduledTime, isActive, createdAt, updatedAt, notificationId, repeat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
            reminder.id,
            reminder.title,
            reminder.description ?? null,
            reminder.scheduledTime.getTime(),
            reminder.isActive ? 1 : 0,
            reminder.createdAt.getTime(),
            reminder.updatedAt.getTime(),
            reminder.notificationId ?? null,
            reminder.repeat ?? 'none',
        ]
    );
}

export async function updateReminder(reminder: Reminder): Promise<void> {
    const database = await getDB();
    await database.runAsync(
        `UPDATE ${TABLE} SET title = ?, description = ?, scheduledTime = ?, isActive = ?, updatedAt = ?, notificationId = ?, repeat = ? WHERE id = ?;`,
        [
            reminder.title,
            reminder.description ?? null,
            reminder.scheduledTime.getTime(),
            reminder.isActive ? 1 : 0,
            reminder.updatedAt.getTime(),
            reminder.notificationId ?? null,
            reminder.repeat ?? 'none',
            reminder.id,
        ]
    );
}

export async function deleteReminder(id: string): Promise<void> {
    const database = await getDB();
    await database.runAsync(`DELETE FROM ${TABLE} WHERE id = ?;`, [id]);
}

export async function updateReminderNotificationId(id: string, notificationId: string | null): Promise<void> {
    const database = await getDB();
    await database.runAsync(`UPDATE ${TABLE} SET notificationId = ?, updatedAt = ? WHERE id = ?;`, [notificationId ?? null, Date.now(), id]);
}

export default {
    initDB,
    getAllReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    updateReminderNotificationId,
};
