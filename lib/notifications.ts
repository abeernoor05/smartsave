import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { NotificationsAdapter } from '@/lib/notifications.types';

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
});

export const notifications: NotificationsAdapter = {
  isSupported: true,

  async ensurePermission() {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  },

  async ensureChannel(channelId, name) {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(channelId, {
      name,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  },

  async present(content) {
    await Notifications.scheduleNotificationAsync({ content, trigger: null });
  },

  async scheduleAt(content, date, channelId) {
    return await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId,
      },
    });
  },

  async cancel(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {
      // Already delivered or cancelled — nothing left to do.
    }
  },

  async cancelAll() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // Nothing was queued.
    }
  },

  async lastTappedData() {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response?.notification.request.content.data ?? null;
  },

  onTap(handler) {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handler(response.notification.request.content.data);
    });
    return () => subscription.remove();
  },
};
