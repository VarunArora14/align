import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch, Platform, AppState } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notificationService';
import type { Reminder, ReminderFormData } from '../types/reminder';

export const RemindersPage = () => {
  // Helpers for consistent formatting: DD-MM-YYYY and HH:MM (24h)
const pad2 = (n: number) => n.toString().padStart(2, '0');
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatDateDDMMYYYY = (d: Date) => `${pad2(d.getDate())}-${monthNames[d.getMonth()]}-${d.getFullYear()}`;
const formatTimeHHMM = (d: Date) => {
    const hours = d.getHours();
    const minutes = pad2(d.getMinutes());
    const period = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    return `${formattedHours}:${minutes} ${period}`;
};

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
  });
  const [scheduledAt, setScheduledAt] = useState<Date>(() => {
    const now = new Date();
    now.setSeconds(0,0)
    now.setMinutes(now.getMinutes()+1);
    return now;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    // Load existing reminders from storage (placeholder for now)
    loadReminders();

    // Listener: when a notification is received (app foreground) mark matching reminder inactive
    const receivedSub = Notifications.addNotificationReceivedListener((event) => {
      const idFromData = (event.request.content.data as any)?.reminderId as string | undefined;
      if (!idFromData) return;
      setReminders(prev => prev.map(r => r.id === idFromData ? { ...r, isActive: false } : r));
    });

    // Listener: when user interacts with the notification (tap) ensure reminder is inactive
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const idFromData = (response.notification.request.content.data as any)?.reminderId as string | undefined;
      if (!idFromData) return;
      setReminders(prev => prev.map(r => r.id === idFromData ? { ...r, isActive: false } : r));
    });

    // Also reconcile when app comes to foreground (handles ignored notifications)
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const now = new Date();
        setReminders(prev => prev.map(r => (r.isActive && new Date(r.scheduledTime) <= now) ? { ...r, isActive: false } : r));
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
      appStateSub.remove();
    };
  }, []);

  const loadReminders = async () => {
    // TODO: Load from SQLite database
    // For now, using empty array
    setReminders([]);
  };

  const handleCreateReminder = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    try {
      const scheduledTime = scheduledAt;

      if (scheduledTime <= new Date()) {
        Alert.alert('Error', 'Please select a future date and time');
        return;
      }

      const newReminder: Reminder = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        scheduledTime,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Schedule notification
      const notificationId = await NotificationService.scheduleReminderNotification(newReminder);
      
      if (notificationId) {
        // console.log("notification ID:" + notificationId)
        newReminder.notificationId = notificationId;
        
        // Add to reminders list
        setReminders(prev => [...prev, newReminder]);
        
        // Clear form
        setFormData({ title: '', description: '', date: '', time: '' });
        const now = new Date();
        now.setSeconds(0,0)
        now.setMinutes(now.getMinutes() + 1);
        setScheduledAt(now);

        Alert.alert('Success', 'Reminder created successfully!');
      } else {
        Alert.alert('Error', 'Please enable notifications to add reminders!');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert('Error', 'Failed to create reminder');
    }
  };

  const handleToggleReminder = async (reminder: Reminder, value: boolean) => {
    try {
      if (value) {
        if (reminder.scheduledTime <= new Date()) {
          Alert.alert('Past time', 'This reminder is set in the past. Edit it to a future time before activating.');
          return;
        }
        const id = await NotificationService.scheduleReminderNotification(reminder);
        setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, isActive: true, notificationId: id ?? r.notificationId } : r));
      } else {
        if (reminder.notificationId) {
          await NotificationService.cancelNotification(reminder.notificationId);
        }
        setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, isActive: false } : r));
      }
    } catch (e) {
      console.error('Error toggling reminder', e);
    }
  };

  const handleDeleteReminder = async (reminder: Reminder) => {
    try {
      if (reminder.notificationId) {
        await NotificationService.cancelNotification(reminder.notificationId);
      }
      
      setReminders(prev => prev.filter(r => r.id !== reminder.id));
      Alert.alert('Success', 'Reminder deleted');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      Alert.alert('Error', 'Failed to delete reminder');
    }
  };

  const formatDateTime = (date: Date) => {
    return `${formatDateDDMMYYYY(date)} ${formatTimeHHMM(date)}`;
  };

  const onChangeDate = (_: any, date?: Date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (date) {
      const updated = new Date(scheduledAt);
      updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setScheduledAt(updated);
      setFormData(prev => ({
        ...prev,
        date: formatDateDDMMYYYY(updated),
      }));
    }
  };

  const onChangeTime = (_: any, date?: Date) => {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (date) {
      const updated = new Date(scheduledAt);
      updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setScheduledAt(updated);
      setFormData(prev => ({
        ...prev,
        time: formatTimeHHMM(updated),
      }));
    }
  };

  const formattedDate = formatDateDDMMYYYY(scheduledAt);
  const formattedTime = formatTimeHHMM(scheduledAt);

  // Grouped & sorted (by time descending)
  const activeReminders = reminders
    .filter(r => r.isActive)
    .slice()
    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
  const inactiveReminders = reminders
    .filter(r => !r.isActive)
    .slice()
    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold mb-6 text-center text-slate-800">Reminders</Text>
      
      {/* Create Reminder Form */}
      <View className="bg-white p-4 rounded-2xl mb-6 border border-slate-200 shadow-sm">
        <Text className="text-lg font-semibold mb-4 text-slate-800">Create New Reminder</Text>
        
        <TextInput
          placeholder="Reminder title"
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          className="border border-gray-300 rounded-lg p-3 mb-3 bg-white"
        />
        
        <TextInput
          placeholder="Description (optional)"
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          className="border border-gray-300 rounded-lg p-3 mb-3 bg-white"
          multiline
          numberOfLines={2}
        />
        
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-sm font-medium mb-1 text-slate-600">Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} className="border border-slate-300 rounded-lg p-3 bg-white">
              <Text className="text-slate-800">{formattedDate}</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium mb-1 text-slate-600">Time</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} className="border border-slate-300 rounded-lg p-3 bg-white">
              <Text className="text-slate-800">{formattedTime}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={scheduledAt}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={scheduledAt}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeTime}
            is24Hour={false}
          />
        )}
        
        <TouchableOpacity
          onPress={handleCreateReminder}
          className="bg-blue-500 rounded-lg p-3"
        >
          <Text className="text-white text-center font-semibold">Create Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* Reminders List */}
      <View>
        <Text className="text-lg font-semibold mb-4 text-slate-800">Your Reminders</Text>

        {activeReminders.length === 0 && inactiveReminders.length === 0 ? (
          <Text className="text-gray-500 text-center py-8">
            No reminders yet. Create your first reminder above!
          </Text>
        ) : (
          <>
            {/* Active section */}
            <Text className="text-base font-semibold mb-2 text-emerald-700">Active: {activeReminders.length}</Text>
            {activeReminders.length === 0 ? (
              <Text className="text-slate-500 mb-4">No active reminders</Text>
            ) : (
              activeReminders.map((reminder) => {
                const isActive = true;
                return (
                  <View
                    key={reminder.id}
                    className={`rounded-2xl p-4 mb-3 border shadow-sm bg-white border-emerald-200`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-base font-semibold text-slate-800">{reminder.title}</Text>
                        {reminder.description ? (
                          <Text className="text-slate-600 mt-1">{reminder.description}</Text>
                        ) : null}
                        <View className="flex-row items-center mt-2">
                          <View className={`px-2 py-1 rounded-full bg-emerald-50`}>
                            <Text className={`text-emerald-700 text-xs`}>
                              {formatDateTime(reminder.scheduledTime)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="items-end gap-2">
                        <View className="flex-row items-center">
                          <Text className="mr-2 text-xs text-slate-600">Active</Text>
                          <Switch
                            value={true}
                            onValueChange={(val) => handleToggleReminder(reminder, val)}
                            trackColor={{ false: '#e5e7eb', true: '#34d399' }}
                            thumbColor={'#10b981'}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteReminder(reminder)}
                          className="bg-rose-500 rounded-lg px-3 py-1"
                        >
                          <Text className="text-white text-xs font-medium">Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {/* Inactive section */}
            <Text className="text-base font-semibold mt-4 mb-2 text-slate-700">Inactive: {inactiveReminders.length}</Text>
            {inactiveReminders.length === 0 ? (
              <Text className="text-slate-500">No inactive reminders</Text>
            ) : (
              inactiveReminders.map((reminder) => {
                const isActive = false;
                return (
                  <View
                    key={reminder.id}
                    className={`rounded-2xl p-4 mb-3 border shadow-sm bg-white border-slate-200`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-base font-semibold text-slate-800">{reminder.title}</Text>
                        {reminder.description ? (
                          <Text className="text-slate-600 mt-1">{reminder.description}</Text>
                        ) : null}
                        <View className="flex-row items-center mt-2">
                          <View className={`px-2 py-1 rounded-full bg-slate-100`}>
                            <Text className={`text-slate-600 text-xs`}>
                              {formatDateTime(reminder.scheduledTime)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="items-end gap-2">
                        <View className="flex-row items-center">
                          <Text className="mr-2 text-xs text-slate-600">Inactive</Text>
                          <Switch
                            value={false}
                            onValueChange={(val) => handleToggleReminder(reminder, val)}
                            trackColor={{ false: '#e5e7eb', true: '#34d399' }}
                            thumbColor={'#9ca3af'}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteReminder(reminder)}
                          className="bg-rose-500 rounded-lg px-3 py-1"
                        >
                          <Text className="text-white text-xs font-medium">Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};