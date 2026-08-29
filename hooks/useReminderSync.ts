import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';
import { useEffect, useMemo } from 'react';

import { itemIdFromNotification, syncReminders } from '@/lib/reminders';
import { useSmartSaveStore } from '@/lib/store';
import type { Item } from '@/lib/types';

/** Everything that can change which reminders are still owed. */
function reminderSignature(items: Item[]): string {
  return items
    .map((item) =>
      [
        item.id,
        ...item.deadlines.map((deadline) =>
          [
            deadline.id,
            deadline.date ?? '',
            deadline.reminder_date ?? '',
            deadline.lead_reminder_sent ? 1 : 0,
            deadline.reminder_sent ? 1 : 0,
          ].join('|'),
        ),
      ].join(','),
    )
    .join(';');
}

let isRunning = false;

/**
 * Runs the reminder scan: fires anything overdue and unsent, queues the rest
 * with the operating system, then flags the exact entries that went out.
 */
async function runSync(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    const { items, markRemindersSent } = useSmartSaveStore.getState();
    if (items.length === 0) return;
    const result = await syncReminders(items);
    if (result.sent.length > 0) await markRemindersSent(result.sent);
  } finally {
    isRunning = false;
  }
}

function openItem(itemId: string): void {
  router.push({ pathname: '/item/[id]', params: { id: itemId } });
}

/**
 * Keeps every deadline entry's reminders in sync while the user is signed in,
 * and opens the matching item when a reminder is tapped.
 */
export function useReminderSync(enabled: boolean): void {
  const status = useSmartSaveStore((state) => state.status);
  const items = useSmartSaveStore((state) => state.items);
  const signature = useMemo(() => reminderSignature(items), [items]);

  useEffect(() => {
    if (!enabled || status !== 'ready' || signature.length === 0) return;
    void runSync();
  }, [enabled, status, signature]);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return undefined;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void runSync();
    });
    return () => subscription.remove();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return undefined;

    // Cold start from a tapped reminder.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      const itemId = itemIdFromNotification(response?.notification.request.content.data);
      if (itemId) openItem(itemId);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const itemId = itemIdFromNotification(response.notification.request.content.data);
      if (itemId) openItem(itemId);
    });
    return () => subscription.remove();
  }, [enabled]);
}
