import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch, Platform, AppState, Modal, Keyboard, TouchableWithoutFeedback, ToastAndroid } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notificationService';
import { geminiService, GeminiService } from '../services/geminiService';
import * as ReminderRepo from '../services/reminderRepository';
import type { Reminder, ReminderFormData, ParsedReminderData } from '../types/reminder';

export const RemindersPage = () => {
  // NOTE: We intentionally use a single popup (Alert/modal) UX for fallback so the user
  // isn't shown both a toast and a popup. The popup will let the user manually add the reminder.

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

    const now = new Date();
    const mockReminders: Reminder[] = [
      {
        id: 'r1',
        title: 'Morning run',
        description: '5km run in the park',
        scheduledTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        isActive: false,
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'r2',
        title: 'Team sync',
        description: 'Weekly engineering sync',
        scheduledTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        isActive: false,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        id: 'r3',
        title: 'Pay bills',
        description: 'Electricity and internet',
        scheduledTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        isActive: false,
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        id: 'r4',
        title: 'Prepare presentation',
        description: 'Slides for product demo',
        scheduledTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        isActive: false,
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
      {
        id: 'r5',
        title: 'Call with mentor',
        description: 'Monthly career catch-up',
        scheduledTime: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes from now
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        notificationId: 'n5',
      },
      {
        id: 'r6',
        title: 'Lunch with Sara',
        description: 'Try the new cafe',
        scheduledTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        notificationId: 'n6',
      },
      {
        id: 'r7',
        title: 'Doctor appointment',
        description: 'Annual check-up',
        scheduledTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        notificationId: 'n7',
      },
      {
        id: 'r8',
        title: 'Buy groceries',
        description: 'Milk, eggs, bread',
        scheduledTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day from now
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'r9',
        title: 'Anniversary dinner',
        description: 'Reserve a table',
        scheduledTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'r10',
        title: 'Project milestone',
        description: 'Finalize release notes',
        scheduledTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'r11',
        title: 'Gym session',
        description: 'Leg day',
        scheduledTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'r12',
        title: 'Renew subscription',
        description: 'Streaming service',
        scheduledTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        isActive: false,
        createdAt: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'r13',
        title: 'Call mom',
        description: 'Weekly check-in',
        scheduledTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'r14',
        title: 'Read a chapter',
        description: 'Book: Clean Code',
        scheduledTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'r15',
        title: 'Plan weekend trip',
        description: 'Find a cabin',
        scheduledTime: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000), // 12 days
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    repeatDaily: false,
  });
  const [scheduledAt, setScheduledAt] = useState<Date>(() => {
    const now = new Date();
    now.setSeconds(0,0)
    now.setMinutes(now.getMinutes()+1);
    return now;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ReminderFormData>({ title: '', description: '', date: '', time: '', repeatDaily: false });
  const [editScheduledAt, setEditScheduledAt] = useState<Date | null>(null);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

  // Keyboard and safe area handling
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Init DB and load existing reminders from SQLite
    (async () => {
      try {
        await ReminderRepo.initDB();
        const rows = await ReminderRepo.getAllReminders();
        setReminders(rows);
      } catch (e) {
        console.error('Failed to init/load reminders', e);
        // fallback to mock data
        setReminders(mockReminders);
      }
    })();

    // Listener: when a notification is received (app foreground) mark matching reminder inactive
    const receivedSub = Notifications.addNotificationReceivedListener(async (event) => {
      const idFromData = (event.request.content.data as any)?.reminderId as string | undefined;
      const isDaily = (event.request.content.data as any)?.isDaily as boolean;
      if (!idFromData) return;
      
      setReminders(prev => prev.map(r => {
        if (r.id !== idFromData) return r;
        // ALWAYS mark non-daily reminders as inactive when notification fires
        if (r.repeat !== 'daily') {
          const updated = { ...r, isActive: false, updatedAt: new Date() };
          // Persist inactive state to DB
          ReminderRepo.updateReminder(updated).catch(err => 
            console.error('Failed to persist inactive state:', err)
          );
          return updated;
        }
        // Daily repeats stay active and reschedule for tomorrow
        handleRescheduleDailyReminder(r);
        return r;
      }));
    });

    // Listener: when user interacts with the notification (tap) ensure reminder is inactive
    const responseSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const idFromData = (response.notification.request.content.data as any)?.reminderId as string | undefined;
      const isDaily = (response.notification.request.content.data as any)?.isDaily as boolean;
      if (!idFromData) return;
      
      setReminders(prev => prev.map(r => {
        if (r.id !== idFromData) return r;
        // ALWAYS mark non-daily reminders as inactive when user taps notification
        if (r.repeat !== 'daily') {
          const updated = { ...r, isActive: false, updatedAt: new Date() };
          // Persist inactive state to DB
          ReminderRepo.updateReminder(updated).catch(err => 
            console.error('Failed to persist inactive state:', err)
          );
          return updated;
        }
        // Daily repeats stay active and reschedule for tomorrow
        handleRescheduleDailyReminder(r);
        return r;
      }));
    });

    // Also reconcile when app comes to foreground (handles ignored notifications)
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const now = new Date();
        setReminders(prev => prev.map(r => {
          if (!r.isActive) return r;
          if (r.repeat === 'daily') return r; // keep daily active
          if (new Date(r.scheduledTime) <= now) {
            const updated = { ...r, isActive: false, updatedAt: new Date() };
            // Persist inactive state to DB for past reminders
            ReminderRepo.updateReminder(updated).catch(err => 
              console.error('Failed to persist inactive state for past reminder:', err)
            );
            return updated;
          }
          return r;
        }));
      }
    });

    // Keyboard event listeners
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
      appStateSub.remove();
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);



  const handleRescheduleDailyReminder = async (reminder: Reminder) => {
    try {
      if (reminder.repeat === 'daily' && reminder.notificationId) {
        const newNotificationId = await NotificationService.rescheduleDailyReminder(reminder);
        if (newNotificationId) {
          // Persist updated notificationId so app restarts still know the current scheduled id
          await ReminderRepo.updateReminderNotificationId(reminder.id, newNotificationId);
          setReminders(prev => prev.map(r => 
            r.id === reminder.id 
              ? { ...r, notificationId: newNotificationId }
              : r
          ));
        }
      }
    } catch (error) {
      console.error('Error rescheduling daily reminder:', error);
    }
  };

  const handleCreateReminder = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    try {
      const scheduledTime = scheduledAt;

      if (!formData.repeatDaily && scheduledTime <= new Date()) {
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
        repeat: formData.repeatDaily ? 'daily' : 'none',
      };

      // Schedule notification
      const notificationId = await NotificationService.scheduleReminderNotification(newReminder);

      if (!notificationId) {
        Alert.alert('Error', 'Please enable notifications to add reminders!');
        return;
      }

      newReminder.notificationId = notificationId;

      // Persist to DB and update UI (single call, no N+1)
      await ReminderRepo.createReminder(newReminder);
      setReminders(prev => [...prev, newReminder]);

      // Clear form
      setFormData({ title: '', description: '', date: '', time: '', repeatDaily: false });
      const now = new Date();
      now.setSeconds(0,0)
      now.setMinutes(now.getMinutes() + 1);
      setScheduledAt(now);

      Alert.alert('Success', 'Reminder created successfully!');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert('Error', 'Failed to create reminder');
    }
  };

  // Open the create modal and pre-fill with provided title (used by Manual Add flow)
  const handleOpenManualAdd = (titleText: string) => {
    // Pre-fill title and clear description/date/time so user can adjust
    setFormData({ title: titleText, description: '', date: '', time: '', repeatDaily: false });
    const now = new Date();
    now.setSeconds(0,0);
    now.setMinutes(now.getMinutes() + 1);
    setScheduledAt(now);
    setShowCreateModal(true);
  };

  // Cancel create modal and clear any entered data
  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setFormData({ title: '', description: '', date: '', time: '', repeatDaily: false });
    const now = new Date();
    now.setSeconds(0,0)
    now.setMinutes(now.getMinutes()+1);
    setScheduledAt(now);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handleToggleReminder = async (reminder: Reminder, value: boolean) => {
    try {
      if (value) {
        if ((!reminder.repeat || reminder.repeat === 'none') && reminder.scheduledTime <= new Date()) {
          Alert.alert('Past time', 'This reminder is set in the past. Edit it to a future time before activating.');
          return;
        }
        const id = await NotificationService.scheduleReminderNotification(reminder);
        // Persist activation + notificationId
        const updated = { ...reminder, isActive: true, notificationId: id ?? reminder.notificationId, updatedAt: new Date() };
        await ReminderRepo.updateReminder(updated);
        setReminders(prev => prev.map(r => r.id === reminder.id ? updated : r));
      } else {
        if (reminder.notificationId) {
          await NotificationService.cancelNotification(reminder.notificationId);
        }
  const updated = { ...reminder, isActive: false, notificationId: undefined, updatedAt: new Date() };
        await ReminderRepo.updateReminder(updated);
        setReminders(prev => prev.map(r => r.id === reminder.id ? updated : r));
      }
    } catch (e) {
      console.error('Error toggling reminder', e);
    }
  };

  const handleDeleteReminder = async (reminder: Reminder) => {
    Alert.alert(
      'Delete reminder?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (reminder.notificationId) {
                await NotificationService.cancelNotification(reminder.notificationId);
              }
              await ReminderRepo.deleteReminder(reminder.id);
              setReminders(prev => prev.filter(r => r.id !== reminder.id));
              if (editingId === reminder.id) {
                setEditingId(null);
                setEditScheduledAt(null);
              }
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (date: Date, repeat?: Reminder['repeat']) => {
    if (repeat === 'daily') {
      return `Daily at ${formatTimeHHMM(date)}`;
    }
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

  // Chat input state for natural language reminder text
  const [chatText, setChatText] = useState('');
  const [isProcessingChat, setIsProcessingChat] = useState(false);

  const handleSendChat = async () => {
    const text = chatText.trim();
    if (!text) {
      // Cross-platform small prompt: Toast on Android, Alert on iOS
      if (Platform.OS === 'android') {
        ToastAndroid.show('Please enter a reminder before sending', ToastAndroid.SHORT);
      } else {
        Alert.alert('Enter reminder', 'Please enter a reminder before sending');
      }
      return;
    }
    
    if (isProcessingChat) return; // Prevent multiple simultaneous requests

    setIsProcessingChat(true);
    setChatText(''); // Clear input immediately for better UX

    try {
      // Parse the natural language text using Gemini
      const parsedData: ParsedReminderData = await geminiService.parseReminderText(text);
      
      // If fallback parsing was used but it detected a repeat value, allow manual confirm
      if (parsedData.usedFallback && parsedData.repeat !== 'daily') {
        // Use a single popup/modal flow: ask the user to manually add or retry
        Alert.alert(
          'Could not understand your reminder',
          'Please try rephrasing or add the reminder manually.',
          [
            { text: 'Retry', style: 'cancel', onPress: () => setChatText(text) },
            { text: 'Manual Add', onPress: () => handleOpenManualAdd(text) }
          ]
        );

        return;
      }
      
      // Prefill the create modal with parsed fields (let user confirm)
      // Only set fields that are present in parsedData
      const prefill: any = {};
  if (parsedData.title) prefill.title = parsedData.title;
  if (parsedData.description) prefill.description = parsedData.description;
  if (parsedData.date) prefill.date = parsedData.date;
  if (parsedData.time) prefill.time = parsedData.time;
  if (parsedData.repeat === 'daily') prefill.repeatDaily = true;

      console.log("prefill data: ", prefill)

      // If relative time is present, compute scheduledAt accordingly
      try {
        const computedDate = GeminiService.createScheduledDate(parsedData);
        setScheduledAt(computedDate);
      } catch (e) {
        // fallback: leave scheduledAt unchanged
      }
      // If parse provided only a time with no date and repeatDaily is set, compute next occurrence today/tomorrow
      if (prefill.repeatDaily && parsedData.time && !parsedData.date) {
        // compute next occurrence at provided time
        const [h, m] = parsedData.time.split(':').map(Number);
        const next = new Date();
        next.setHours(h, m, 0, 0);
        if (next <= new Date()) next.setDate(next.getDate() + 1);
        setScheduledAt(next);
      }

      setFormData(prev => ({ ...prev, ...prefill }));
      setShowCreateModal(true);
    } catch (error) {
      console.error('Error processing chat reminder:', error);
      
      // Show a popup with retry option
      Alert.alert(
        'Failed to process reminder',
        'An error occurred while processing your reminder. Would you like to retry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => setChatText(text) }
        ]
      );
    } finally {
      setIsProcessingChat(false);
    }
  };

  // Edit helpers
  const startEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    const when = new Date(reminder.scheduledTime);
    when.setSeconds(0, 0);
    setEditScheduledAt(when);
    setEditData({
      title: reminder.title,
      description: reminder.description ?? '',
      date: formatDateDDMMYYYY(when),
      time: formatTimeHHMM(when),
      repeatDaily: reminder.repeat === 'daily',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditScheduledAt(null);
    setShowEditDatePicker(false);
    setShowEditTimePicker(false);
  };

  const onChangeEditDate = (_: any, date?: Date) => {
    if (Platform.OS !== 'ios') setShowEditDatePicker(false);
    if (!date || !editScheduledAt) return;
    const updated = new Date(editScheduledAt);
    updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    updated.setSeconds(0, 0);
    setEditScheduledAt(updated);
    setEditData(prev => ({ ...prev, date: formatDateDDMMYYYY(updated) }));
  };

  const onChangeEditTime = (_: any, date?: Date) => {
    if (Platform.OS !== 'ios') setShowEditTimePicker(false);
    if (!date || !editScheduledAt) return;
    const updated = new Date(editScheduledAt);
    updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setEditScheduledAt(updated);
    setEditData(prev => ({ ...prev, time: formatTimeHHMM(updated) }));
  };

  const saveEdit = async (reminder: Reminder) => {
    if (!editingId || !editScheduledAt) return;
    if (!editData.title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }
    if ((!editData.repeatDaily) && editScheduledAt <= new Date()) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    try {
      // Cancel old schedule if any
      if (reminder.notificationId) {
        await NotificationService.cancelNotification(reminder.notificationId);
      }

      const updatedReminder: Reminder = {
        ...reminder,
        title: editData.title,
        description: editData.description,
        scheduledTime: editScheduledAt,
        updatedAt: new Date(),
        repeat: editData.repeatDaily ? 'daily' : 'none',
      };

      // Auto-deactivate non-daily reminders if they're edited to a past time
      if (!editData.repeatDaily && editScheduledAt <= new Date() && updatedReminder.isActive) {
        updatedReminder.isActive = false;
        updatedReminder.notificationId = undefined;
      }

      let newNotificationId: string | null = null;
      if (updatedReminder.isActive) {
        newNotificationId = await NotificationService.scheduleReminderNotification(updatedReminder);
        if (!newNotificationId) {
          Alert.alert('Error', 'Please enable notifications to update reminders!');
          return;
        }
        updatedReminder.notificationId = newNotificationId;
      } else {
  updatedReminder.notificationId = undefined;
      }

      // Persist update in a single call
      await ReminderRepo.updateReminder(updatedReminder);
      setReminders(prev => prev.map(r => r.id === reminder.id ? updatedReminder : r));
      cancelEdit();
      Alert.alert('Saved', 'Reminder updated successfully');
    } catch (e) {
      console.error('Error saving reminder', e);
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  // Search filter (case-insensitive on title + description)
  const q = searchQuery.trim().toLowerCase();
  const filteredReminders = q.length === 0
    ? reminders
    : reminders.filter(r =>
        r.title.toLowerCase().includes(q) || (r.description?.toLowerCase().includes(q) ?? false)
      );

  // Custom sorting function: daily reminders first, then by scheduledTime descending
  const sortReminders = (a: Reminder, b: Reminder) => {
    // If one is daily and the other isn't, daily comes first
    if (a.repeat === 'daily' && b.repeat !== 'daily') return -1;
    if (a.repeat !== 'daily' && b.repeat === 'daily') return 1;
    
    // If both are daily or both are not daily, sort by scheduledTime descending (latest first)
    return new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime();
  };

  // Grouped & sorted (daily first, then by time descending)
  const activeReminders = filteredReminders
    .filter(r => r.isActive)
    .slice()
    .sort(sortReminders);
  const inactiveReminders = filteredReminders
    .filter(r => !r.isActive)
    .slice()
    .sort(sortReminders);

  return (
    <View className="flex-1 bg-slate-50">
      <KeyboardAwareScrollView 
        className="flex-1 p-4" 
        keyboardShouldPersistTaps="handled" 
        contentContainerStyle={{ paddingBottom: 20 }}
        enableOnAndroid={true}
        extraScrollHeight={20}
        keyboardOpeningTime={250}
        showsVerticalScrollIndicator={false}
      >
      {/* Header with title and Add button */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-slate-800">All Reminders</Text>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          className="bg-emerald-600 rounded-xl px-5 py-3 shadow-md active:opacity-90"
        >
          <Text className="text-white font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View className="mb-6">
        <TextInput
          placeholder="Search reminders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="border border-slate-300 rounded-2xl px-4 py-3 bg-white text-slate-800"
        />
      </View>

      {/* Create Reminder Modal */}
  <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={handleCancelCreate}>
        <View className="flex-1 bg-black/40 items-center justify-center p-4">
          <View className="w-full rounded-2xl bg-white p-4 border border-slate-200">
            <Text className="text-xl font-semibold mb-4 text-slate-800">Create New Reminder</Text>
            <TextInput
              placeholder="Reminder title"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              className="border border-slate-300 rounded-lg p-3 mb-3 bg-white"
            />
            <TextInput
              placeholder="Description (optional)"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              className="border border-slate-300 rounded-lg p-3 mb-3 bg-white"
              multiline
              numberOfLines={2}
            />
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-medium text-slate-700">Repeat daily</Text>
              <Switch
                value={formData.repeatDaily ?? false}
                onValueChange={(val) => {
                  setFormData(prev => ({ ...prev, repeatDaily: val }));
                }}
                trackColor={{ false: '#e5e7eb', true: '#34d399' }}
                thumbColor={formData.repeatDaily ? '#10b981' : '#9ca3af'}
              />
            </View>
            {!formData.repeatDaily && (
              <View className="flex-row gap-3 mb-3">
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
            )}
            {formData.repeatDaily && (
              <View className="mb-3">
                <Text className="text-sm font-medium mb-1 text-slate-600">Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(true)} className="border border-slate-300 rounded-lg p-3 bg-white">
                  <Text className="text-slate-800">{formattedTime}</Text>
                </TouchableOpacity>
              </View>
            )}
            {showDatePicker && !formData.repeatDaily && (
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
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity onPress={handleCancelCreate} className="flex-1 bg-slate-200 rounded-lg p-3">
                <Text className="text-slate-800 text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateReminder} className="flex-1 bg-emerald-600 rounded-lg p-3">
                <Text className="text-white text-center font-semibold">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </Modal>

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
                              {formatDateTime(reminder.scheduledTime, reminder.repeat)}
                            </Text>
                          </View>
                          {reminder.repeat === 'daily' && (
                            <View className="ml-2 px-2 py-1 rounded-full bg-amber-100 border border-amber-200">
                              <Text className="text-amber-700 text-xs">Daily</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View className="items-end gap-2">
                        {editingId === reminder.id ? (
                          <View className="flex-row gap-2">
                            <TouchableOpacity onPress={() => saveEdit(reminder)} className="bg-emerald-600 rounded-lg px-3 py-1">
                              <Text className="text-white text-xs font-medium">Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={cancelEdit} className="bg-slate-400 rounded-lg px-3 py-1">
                              <Text className="text-white text-xs font-medium">Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View className="flex-row items-center">
                            <Text className="mr-2 text-xs text-slate-600">Active</Text>
                            <Switch
                              value={true}
                              onValueChange={(val) => handleToggleReminder(reminder, val)}
                              trackColor={{ false: '#e5e7eb', true: '#34d399' }}
                              thumbColor={'#10b981'}
                            />
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => handleDeleteReminder(reminder)}
                          className="bg-rose-500 rounded-lg px-3 py-1"
                        >
                          <Text className="text-white text-xs font-medium">Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {/* Edit UI (inline) */}
                    {editingId === reminder.id ? (
                      <View className="mt-3 gap-2">
                        <TextInput
                          placeholder="Title"
                          value={editData.title}
                          onChangeText={(t) => setEditData(prev => ({ ...prev, title: t }))}
                          className="border border-slate-300 rounded-lg p-2"
                        />
                        <TextInput
                          placeholder="Description (optional)"
                          value={editData.description}
                          onChangeText={(t) => setEditData(prev => ({ ...prev, description: t }))}
                          className="border border-slate-300 rounded-lg p-2"
                          multiline
                          numberOfLines={2}
                        />
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs font-medium text-slate-700">Repeat daily</Text>
                          <Switch
                            value={editData.repeatDaily ?? false}
                            onValueChange={(val) => setEditData(prev => ({ ...prev, repeatDaily: val }))}
                            trackColor={{ false: '#e5e7eb', true: '#34d399' }}
                            thumbColor={editData.repeatDaily ? '#10b981' : '#9ca3af'}
                          />
                        </View>
                        <View className="flex-row gap-3">
                          <View className="flex-1">
                            <Text className="text-xs font-medium mb-1 text-slate-600">Date</Text>
                            {editData.repeatDaily ? (
                              <View className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                                <Text className="text-slate-500">Every day</Text>
                              </View>
                            ) : (
                              <TouchableOpacity onPress={() => setShowEditDatePicker(true)} className="border border-slate-300 rounded-lg p-2 bg-white">
                                <Text className="text-slate-800">{editScheduledAt ? formatDateDDMMYYYY(editScheduledAt) : ''}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-medium mb-1 text-slate-600">Time</Text>
                            <TouchableOpacity onPress={() => setShowEditTimePicker(true)} className="border border-slate-300 rounded-lg p-2 bg-white">
                              <Text className="text-slate-800">{editScheduledAt ? formatTimeHHMM(editScheduledAt) : ''}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        {showEditDatePicker && editScheduledAt && !editData.repeatDaily && (
                          <DateTimePicker
                            value={editScheduledAt}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeEditDate}
                          />
                        )}
                        {showEditTimePicker && editScheduledAt && (
                          <DateTimePicker
                            value={editScheduledAt}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeEditTime}
                            is24Hour={false}
                          />
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => startEdit(reminder)} className="mt-3 self-start bg-sky-600 rounded-lg px-3 py-1">
                        <Text className="text-white text-xs font-medium">Edit</Text>
                      </TouchableOpacity>
                    )}
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
                          <View className="px-2 py-1 rounded-full bg-slate-100">
                            <Text className="text-slate-600 text-xs">
                              {formatDateTime(reminder.scheduledTime, reminder.repeat)}
                            </Text>
                          </View>
                          {reminder.repeat === 'daily' && (
                            <View className="ml-2 px-2 py-1 rounded-full bg-amber-100 border border-amber-200">
                              <Text className="text-amber-700 text-xs">Daily</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View className="items-end gap-2">
                        {editingId === reminder.id ? (
                          <View className="flex-row gap-2">
                            <TouchableOpacity onPress={() => saveEdit(reminder)} className="bg-emerald-600 rounded-lg px-3 py-1">
                              <Text className="text-white text-xs font-medium">Save</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={cancelEdit} className="bg-slate-400 rounded-lg px-3 py-1">
                              <Text className="text-white text-xs font-medium">Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View className="flex-row items-center">
                            <Text className="mr-2 text-xs text-slate-600">Inactive</Text>
                            <Switch
                              value={false}
                              onValueChange={(val) => handleToggleReminder(reminder, val)}
                              trackColor={{ false: '#e5e7eb', true: '#34d399' }}
                              thumbColor={'#9ca3af'}
                            />
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => handleDeleteReminder(reminder)}
                          className="bg-rose-500 rounded-lg px-3 py-1"
                        >
                          <Text className="text-white text-xs font-medium">Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Edit UI (inline) */}
                    {editingId === reminder.id ? (
                      <View className="mt-3 gap-2">
                        <TextInput
                          placeholder="Title"
                          value={editData.title}
                          onChangeText={(t) => setEditData(prev => ({ ...prev, title: t }))}
                          className="border border-slate-300 rounded-lg p-2"
                        />
                        <TextInput
                          placeholder="Description (optional)"
                          value={editData.description}
                          onChangeText={(t) => setEditData(prev => ({ ...prev, description: t }))}
                          className="border border-slate-300 rounded-lg p-2"
                          multiline
                          numberOfLines={2}
                        />
                        <View className="flex-row gap-3">
                          <View className="flex-1">
                            <Text className="text-xs font-medium mb-1 text-slate-600">Date</Text>
                            <TouchableOpacity onPress={() => setShowEditDatePicker(true)} className="border border-slate-300 rounded-lg p-2 bg-white">
                              <Text className="text-slate-800">{editScheduledAt ? formatDateDDMMYYYY(editScheduledAt) : ''}</Text>
                            </TouchableOpacity>
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-medium mb-1 text-slate-600">Time</Text>
                            <TouchableOpacity onPress={() => setShowEditTimePicker(true)} className="border border-slate-300 rounded-lg p-2 bg-white">
                              <Text className="text-slate-800">{editScheduledAt ? formatTimeHHMM(editScheduledAt) : ''}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        {showEditDatePicker && editScheduledAt && (
                          <DateTimePicker
                            value={editScheduledAt}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeEditDate}
                          />
                        )}
                        {showEditTimePicker && editScheduledAt && (
                          <DateTimePicker
                            value={editScheduledAt}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onChangeEditTime}
                            is24Hour={false}
                          />
                        )}
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => startEdit(reminder)} className="mt-3 self-start bg-sky-600 rounded-lg px-3 py-1">
                        <Text className="text-white text-xs font-medium">Edit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </View>
      </KeyboardAwareScrollView>

      {/* Chat input area pinned to bottom */}
      <View 
        className="border-t border-slate-200 bg-white p-4"
        style={{ 
          paddingBottom: Math.max(insets.bottom, keyboardHeight > 0 ? 16 : insets.bottom),
          marginBottom: keyboardHeight > 0 ? keyboardHeight + insets.bottom : 0 
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-row items-center">
            <TextInput
              placeholder={isProcessingChat ? "Processing..." : "What do you want to be reminded of?"}
              value={chatText}
              onChangeText={setChatText}
              className={`flex-1 border border-slate-300 rounded-full px-4 py-3 mr-3 text-slate-800 ${
                isProcessingChat ? 'bg-slate-100' : 'bg-slate-50'
              }`}
              returnKeyType="send"
              onSubmitEditing={handleSendChat}
              editable={!isProcessingChat}
            />
            <TouchableOpacity 
              onPress={handleSendChat} 
              className={`p-3 rounded-full ${
                isProcessingChat ? 'bg-slate-400' : 'bg-emerald-600'
              }`}
              disabled={isProcessingChat}
            >
              <Text className="text-white font-bold">
                {isProcessingChat ? '⋯' : '➤'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};