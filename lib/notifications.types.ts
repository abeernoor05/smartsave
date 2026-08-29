/**
 * The small slice of notification behaviour the reminder scheduler needs.
 * Keeping it behind an interface lets the web build skip `expo-notifications`
 * entirely — that package ships no web implementation for scheduling.
 */

export interface NotificationContent {
  title: string;
  body: string;
  data: Record<string, unknown>;
}

export interface NotificationsAdapter {
  /** False on web, where the operating system offers no scheduler. */
  readonly isSupported: boolean;
  /** Asks for permission once, resolving to whether reminders may be shown. */
  ensurePermission(): Promise<boolean>;
  /** Android notification channel; a no-op elsewhere. */
  ensureChannel(channelId: string, name: string): Promise<void>;
  /** Shows a notification straight away (catch-up for an overdue reminder). */
  present(content: NotificationContent): Promise<void>;
  /** Queues a notification for a future date, returning its identifier. */
  scheduleAt(content: NotificationContent, date: Date, channelId: string): Promise<string>;
  cancel(identifier: string): Promise<void>;
  cancelAll(): Promise<void>;
  /** Payload of the notification that launched the app, if any. */
  lastTappedData(): Promise<unknown>;
  /** Subscribes to taps while the app runs; returns an unsubscribe function. */
  onTap(handler: (data: unknown) => void): () => void;
}
