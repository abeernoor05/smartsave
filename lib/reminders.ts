import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import {
  formatShortDate,
  isResurfaceDeadline,
  isScheduled,
  leadDaysOf,
  relativeDeadlineLabel,
} from '@/lib/deadlines';
import type { Deadline, Item } from '@/lib/types';

const STORAGE_KEY = 'smartsave.scheduled-reminders.v1';
const CHANNEL_ID = 'deadline-reminders';
/** Reminders older than this are quietly closed off instead of firing very late. */
const STALE_AFTER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const isSupported = Platform.OS !== 'web';

if (isSupported) {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
  });
}

/**
 * Each deadline entry can fire more than once:
 * - `lead`  — the "two days before" reminder of a dated entry
 * - `day`   — the same-day reminder of a dated entry
 * - `nudge` — the resurface reminder of an undated entry
 */
export type ReminderStage = 'lead' | 'day' | 'nudge';

export interface Reminder {
  /** Stable identity of this one reminder: item + deadline entry + stage. */
  key: string;
  itemId: string;
  deadlineId: string;
  stage: ReminderStage;
  /** ISO timestamp when this reminder should reach the user. */
  fireAt: string;
  title: string;
  body: string;
}

/** What the store needs to flip on a single deadline entry after a reminder went out. */
export type ReminderMark = Pick<Reminder, 'itemId' | 'deadlineId' | 'stage'>;

export interface ReminderSyncResult {
  supported: boolean;
  permitted: boolean;
  /** Entries to mark as sent, one per deadline entry and stage. */
  sent: ReminderMark[];
  /** How many notifications were actually presented right now. */
  notified: number;
  /** How many future reminders are queued with the operating system. */
  scheduled: number;
}

interface ScheduledEntry {
  fireAt: string;
  identifier: string;
}

type ScheduledMap = Record<string, ScheduledEntry>;

function reminderKey(itemId: string, deadlineId: string, stage: ReminderStage): string {
  return `${itemId}:${deadlineId}:${stage}`;
}

function itemLabel(item: Item): string {
  const summary = item.ai_summary.trim().replace(/\s+/g, ' ');
  const label = summary.length > 0 ? summary : item.original_url;
  return label.length > 72 ? `${label.slice(0, 71)}…` : label;
}

function contextLabel(deadline: Deadline): string {
  const context = deadline.context.trim() || 'Deadline';
  return context.charAt(0).toUpperCase() + context.slice(1);
}

function dayLabel(days: number): string {
  return days === 1 ? '1 day' : `${days} days`;
}

/** Every reminder still owed for one item, dated entries and undated ones alike. */
export function remindersForItem(item: Item): Reminder[] {
  const reminders: Reminder[] = [];
  const label = itemLabel(item);

  for (const deadline of item.deadlines) {
    const context = contextLabel(deadline);

    if (isScheduled(deadline)) {
      const lead = leadDaysOf(deadline);
      const leadDate = deadline.reminder_date;

      // Skipped when the lead reminder would land on the deadline itself.
      if (!deadline.lead_reminder_sent && leadDate && lead > 0) {
        reminders.push({
          key: reminderKey(item.id, deadline.id, 'lead'),
          itemId: item.id,
          deadlineId: deadline.id,
          stage: 'lead',
          fireAt: leadDate,
          title: `${context} in ${dayLabel(lead)}`,
          body: `${label} · ${formatShortDate(deadline.date)}`,
        });
      }

      if (!deadline.reminder_sent) {
        reminders.push({
          key: reminderKey(item.id, deadline.id, 'day'),
          itemId: item.id,
          deadlineId: deadline.id,
          stage: 'day',
          fireAt: deadline.date,
          title: `${context} is today`,
          body: `${label} · ${formatShortDate(deadline.date)}`,
        });
      }
      continue;
    }

    if (deadline.reminder_sent || !deadline.reminder_date) continue;

    reminders.push({
      key: reminderKey(item.id, deadline.id, 'nudge'),
      itemId: item.id,
      deadlineId: deadline.id,
      stage: 'nudge',
      fireAt: deadline.reminder_date,
      title: isResurfaceDeadline(deadline) ? 'Still saved for later' : `${context} — no date yet`,
      body: isResurfaceDeadline(deadline)
        ? label
        : `${label} · add a date so you get a proper reminder`,
    });
  }

  return reminders;
}

/** Everything still owed across the whole library, soonest first. */
export function pendingReminders(items: Item[]): Reminder[] {
  return items
    .flatMap((item) => remindersForItem(item))
    .sort((a, b) => a.fireAt.localeCompare(b.fireAt));
}

/** Human-readable line for a reminder, used by the item screen. */
export function reminderSummary(reminder: Reminder, now: Date = new Date()): string {
  if (reminder.stage === 'nudge') return `Resurfaces ${formatShortDate(reminder.fireAt)}`;
  return `${relativeDeadlineLabel(reminder.fireAt, now)} · ${formatShortDate(reminder.fireAt)}`;
}

/** Deep-link target carried on the notification payload. */
export function itemIdFromNotification(data: unknown): string | null {
  if (!isRecord(data)) return null;
  const itemId = data.itemId;
  return typeof itemId === 'string' && itemId.length > 0 ? itemId : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function readScheduled(): Promise<ScheduledMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};
    const map: ScheduledMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!isRecord(value)) continue;
      const { fireAt, identifier } = value;
      if (typeof fireAt === 'string' && typeof identifier === 'string') {
        map[key] = { fireAt, identifier };
      }
    }
    return map;
  } catch {
    return {};
  }
}

async function writeScheduled(map: ScheduledMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // A failed cache write only means a reminder gets re-checked later.
  }
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Deadline reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

function contentOf(reminder: Reminder): Notifications.NotificationContentInput {
  return {
    title: reminder.title,
    body: reminder.body,
    data: {
      itemId: reminder.itemId,
      deadlineId: reminder.deadlineId,
      stage: reminder.stage,
      url: `/item/${reminder.itemId}`,
    },
  };
}

async function presentNow(reminder: Reminder): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: contentOf(reminder),
    trigger: null,
  });
}

async function scheduleAt(reminder: Reminder): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: contentOf(reminder),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(reminder.fireAt),
      channelId: CHANNEL_ID,
    },
  });
}

async function cancel(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Already delivered or cancelled — nothing left to do.
  }
}

/**
 * Walks every deadline entry of every item:
 * - fires the reminders whose date has passed and that were never sent,
 * - hands the future ones to the operating system so they arrive with the app closed,
 * - returns which entry + stage pairs should now be flagged as sent.
 *
 * Reminders the operating system already delivered while the app was closed are
 * recognised through the local schedule cache, so they get flagged without a
 * second notification.
 */
export async function syncReminders(
  items: Item[],
  now: Date = new Date(),
): Promise<ReminderSyncResult> {
  if (!isSupported) {
    return { supported: false, permitted: false, sent: [], notified: 0, scheduled: 0 };
  }

  const permitted = await ensurePermission();
  if (!permitted) {
    return { supported: true, permitted: false, sent: [], notified: 0, scheduled: 0 };
  }

  await ensureChannel();

  const cache = await readScheduled();
  const pending = pendingReminders(items);
  const sent: ReminderMark[] = [];
  let notified = 0;
  let scheduled = 0;

  const liveKeys = new Set(pending.map((reminder) => reminder.key));

  for (const reminder of pending) {
    const mark: ReminderMark = {
      itemId: reminder.itemId,
      deadlineId: reminder.deadlineId,
      stage: reminder.stage,
    };
    const fireAt = new Date(reminder.fireAt).getTime();
    const cached = cache[reminder.key];

    if (fireAt <= now.getTime()) {
      const alreadyDelivered = cached ? new Date(cached.fireAt).getTime() <= now.getTime() : false;
      const isStale = now.getTime() - fireAt > STALE_AFTER_DAYS * DAY_MS;

      if (!alreadyDelivered && !isStale) {
        await presentNow(reminder);
        notified += 1;
      }
      if (cached) delete cache[reminder.key];
      sent.push(mark);
      continue;
    }

    if (cached && cached.fireAt === reminder.fireAt) {
      scheduled += 1;
      continue;
    }

    if (cached) await cancel(cached.identifier);
    const identifier = await scheduleAt(reminder);
    cache[reminder.key] = { fireAt: reminder.fireAt, identifier };
    scheduled += 1;
  }

  // Deadlines that were edited away or removed leave orphaned OS notifications.
  for (const [key, entry] of Object.entries(cache)) {
    if (liveKeys.has(key)) continue;
    await cancel(entry.identifier);
    delete cache[key];
  }

  await writeScheduled(cache);

  return { supported: true, permitted: true, sent, notified, scheduled };
}

/** Drops every queued reminder, e.g. when the user signs out. */
export async function clearScheduledReminders(): Promise<void> {
  if (!isSupported) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled.
  }
  await writeScheduled({});
}
