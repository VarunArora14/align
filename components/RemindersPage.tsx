import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { NotificationService } from '../services/notificationService';
import type { Reminder, ReminderFormData } from '../types/reminder';

export const RemindersPage = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
  });

  useEffect(() => {
    // Load existing reminders from storage (placeholder for now)
    loadReminders();
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

    if (!formData.date || !formData.time) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    try {
      // Combine date and time
      const scheduledTime = new Date(`${formData.date}T${formData.time}`);
      
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
        newReminder.notificationId = notificationId;
        
        // Add to reminders list
        setReminders(prev => [...prev, newReminder]);
        
        // Clear form
        setFormData({
          title: '',
          description: '',
          date: '',
          time: '',
        });

        Alert.alert('Success', 'Reminder created successfully!');
      } else {
        Alert.alert('Error', 'Please enable notifications to add reminders!');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert('Error', 'Failed to create reminder');
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
    return date.toLocaleString();
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6 text-center">Reminders</Text>
      
      {/* Create Reminder Form */}
      <View className="bg-gray-50 p-4 rounded-lg mb-6">
        <Text className="text-lg font-semibold mb-4">Create New Reminder</Text>
        
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
            <Text className="text-sm font-medium mb-1">Date</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
              className="border border-gray-300 rounded-lg p-3 bg-white"
            />
          </View>
          
          <View className="flex-1">
            <Text className="text-sm font-medium mb-1">Time</Text>
            <TextInput
              placeholder="HH:MM"
              value={formData.time}
              onChangeText={(text) => setFormData(prev => ({ ...prev, time: text }))}
              className="border border-gray-300 rounded-lg p-3 bg-white"
            />
          </View>
        </View>
        
        <TouchableOpacity
          onPress={handleCreateReminder}
          className="bg-blue-500 rounded-lg p-3"
        >
          <Text className="text-white text-center font-semibold">Create Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* Reminders List */}
      <View>
        <Text className="text-lg font-semibold mb-4">Your Reminders</Text>
        
        {reminders.length === 0 ? (
          <Text className="text-gray-500 text-center py-8">
            No reminders yet. Create your first reminder above!
          </Text>
        ) : (
          reminders.map((reminder) => (
            <View key={reminder.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-semibold">{reminder.title}</Text>
                  {reminder.description && (
                    <Text className="text-gray-600 mt-1">{reminder.description}</Text>
                  )}
                  <Text className="text-sm text-gray-500 mt-2">
                    {formatDateTime(reminder.scheduledTime)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  onPress={() => handleDeleteReminder(reminder)}
                  className="bg-red-500 rounded-lg px-3 py-1"
                >
                  <Text className="text-white text-sm">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};