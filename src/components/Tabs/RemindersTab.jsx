// src/components/Tabs/RemindersTab.jsx
import React, { useState, useEffect } from 'react';
import { Bell, Clock, Save } from 'lucide-react';

const RemindersTab = ({ user }) => {
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderMessage, setReminderMessage] = useState('Time for your daily reflection!');
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);

  // Load saved reminder settings
  useEffect(() => {
    const savedReminder = localStorage.getItem(`reminder_${user.uid}`);
    if (savedReminder) {
      const { time, message, enabled } = JSON.parse(savedReminder);
      setReminderTime(time);
      setReminderMessage(message);
      setIsEnabled(enabled);
    }
  }, [user.uid]);

  // Check for notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Set up reminder checking
  useEffect(() => {
    if (!isEnabled) return;

    const checkReminder = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime === reminderTime && lastNotification !== now.toDateString()) {
        sendNotification();
        setLastNotification(now.toDateString());
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkReminder);
  }, [isEnabled, reminderTime, lastNotification]);

  const sendNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('MindfulMe Reminder', {
        body: reminderMessage,
        icon: '/icon.png', // You'd add an icon to your public folder
        badge: '/badge.png'
      });
    }
  };

  const saveReminder = () => {
    const reminderData = {
      time: reminderTime,
      message: reminderMessage,
      enabled: isEnabled
    };
    
    localStorage.setItem(`reminder_${user.uid}`, JSON.stringify(reminderData));
    alert('Reminder saved successfully!');
  };

  const testNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        sendNotification();
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            sendNotification();
          }
        });
      } else {
        alert('Please enable notifications in your browser settings.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Reminder Settings */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-rose-600 mb-4">Daily Reminder Settings</h2>
        
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <label className="font-medium">Enable Daily Reminder</label>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isEnabled ? 'bg-rose-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block font-medium mb-2">Reminder Time</label>
            <div className="flex items-center gap-2">
              <Clock className="text-rose-500" size={20} />
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-4 py-2 border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block font-medium mb-2">Reminder Message</label>
            <textarea
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              placeholder="Enter your reminder message"
              className="w-full px-4 py-2 border border-rose-200 rounded-lg focus:outline-none focus:border-rose-400 resize-none h-20"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={saveReminder}
            className="w-full px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Save Reminder Settings
          </button>

          {/* Test Notification */}
          <button
            onClick={testNotification}
            className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <Bell size={20} />
            Test Notification
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-rose-600 mb-4">How Reminders Work</h2>
        <div className="space-y-3 text-gray-600">
          <p>• Set a daily time for your mindfulness reminder</p>
          <p>• Keep this browser tab open to receive notifications</p>
          <p>• Make sure notifications are enabled in your browser</p>
          <p>• You'll receive a gentle reminder at your chosen time</p>
          <p>• Perfect for building a consistent journaling habit</p>
        </div>
      </div>

      {/* Notification Status */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="font-semibold text-gray-700 mb-2">Notification Status</h3>
        <p className="text-sm text-gray-600">
          {typeof Notification !== 'undefined' ? (
            Notification.permission === 'granted' ? (
              <span className="text-green-600">✓ Notifications are enabled</span>
            ) : Notification.permission === 'denied' ? (
              <span className="text-red-600">✗ Notifications are blocked. Please enable in browser settings.</span>
            ) : (
              <span className="text-yellow-600">⚠ Click "Test Notification" to enable</span>
            )
          ) : (
            <span className="text-red-600">✗ Your browser doesn't support notifications</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default RemindersTab;