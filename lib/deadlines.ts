import { differenceInCalendarDays, formatDistanceToNowStrict, isBefore, parseISO } from 'date-fns';

import type { Deadline, Item } from '@/lib/types';
import { genId } from '@/lib/utils';

/** Days before a detected deadline that the reminder fires. */
export const REMINDER_LEAD_DAYS = 3;
/** Gentle nudge for items where the AI found no deadline at all. */
export const DEFAULT_NUDGE_DAYS = 7;

export type Urgency = 'overdue' | 'today' | 'soon' | 'upcoming';

/** A deadline the AI (or the user) managed to pin to an actual date. */
export type ScheduledDeadline = Deadline & { date: string };

export function isScheduled(deadline: Deadline): deadline is ScheduledDeadline {
  return typeof deadline.date === 'string' && deadline.date.length > 0;
}

export function daysUntil(iso: string, now: Date = new Date()): number {
  return differenceInCalendarDays(parseISO(iso), now);
}

export function urgencyOf(iso: string, now: Date = new Date()): Urgency {
  const days = daysUntil(iso, now);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 3) return 'soon';
  return 'upcoming';
}

export const URGENCY_STYLES: Record<
  Urgency,
  { bgClass: string; textClass: string; color: string }
> = {
  overdue: { bgClass: 'bg-urgent-soft', textClass: 'text-urgent', color: '#C4382E' },
  today: { bgClass: 'bg-urgent-soft', textClass: 'text-urgent', color: '#C4382E' },
  soon: { bgClass: 'bg-soon-soft', textClass: 'text-soon', color: '#BC7011' },
  upcoming: { bgClass: 'bg-calm-soft', textClass: 'text-calm', color: '#6A7080' },
};

/** "in 4 days", "today", "2 days ago" */
export function relativeDeadlineLabel(iso: string, now: Date = new Date()): string {
  const days = daysUntil(iso, now);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `Due in ${days} days`;
  if (days === -1) return 'Was due yesterday';
  return `Overdue by ${Math.abs(days)} days`;
}

export function formatDate(iso: string): string {
  return parseISO(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  return parseISO(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function savedAgo(iso: string): string {
  return `${formatDistanceToNowStrict(parseISO(iso))} ago`;
}

/** Reminder date for a deadline, clamped so it never lands after the deadline. */
export function reminderDateFor(deadlineISO: string, leadDays = REMINDER_LEAD_DAYS): string {
  const deadline = parseISO(deadlineISO);
  const reminder = new Date(deadline);
  reminder.setDate(reminder.getDate() - Math.max(0, leadDays));
  return (isBefore(reminder, deadline) ? reminder : deadline).toISOString();
}

/** How many days before its date this deadline reminds, defaulting to the standard lead. */
export function leadDaysOf(deadline: Deadline): number {
  if (!deadline.date || !deadline.reminder_date) return REMINDER_LEAD_DAYS;
  return Math.max(
    0,
    differenceInCalendarDays(parseISO(deadline.date), parseISO(deadline.reminder_date)),
  );
}

export function createDeadline(date: string | null, context: string): Deadline {
  return {
    id: genId(),
    date,
    context,
    reminder_date: date ? reminderDateFor(date) : null,
    reminder_sent: false,
  };
}

export type DeadlinePatch = Partial<Pick<Deadline, 'date' | 'context' | 'reminder_date'>>;

/**
 * Applies an edit to a single deadline, keeping the reminder anchored to the
 * date (and the user's chosen lead time) unless the reminder is set explicitly.
 */
export function applyDeadlinePatch(deadline: Deadline, patch: DeadlinePatch): Deadline {
  const next: Deadline = { ...deadline, ...patch };
  if (patch.date !== undefined && patch.reminder_date === undefined) {
    next.reminder_date = patch.date ? reminderDateFor(patch.date, leadDaysOf(deadline)) : null;
    next.reminder_sent = false;
  }
  return next;
}

/** Dated deadlines first, soonest to latest; undated ones last. */
export function sortDeadlines(deadlines: Deadline[]): Deadline[] {
  return [...deadlines].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.context.localeCompare(b.context);
  });
}

/** Nearest dated deadline that has not passed yet; falls back to the latest past one. */
export function nearestDeadline(item: Item, now: Date = new Date()): ScheduledDeadline | null {
  const dated = item.deadlines.filter(isScheduled).sort((a, b) => a.date.localeCompare(b.date));
  if (dated.length === 0) return null;
  return (
    dated.find((deadline) => daysUntil(deadline.date, now) >= 0) ?? dated[dated.length - 1] ?? null
  );
}

export interface UpcomingDeadline {
  item: Item;
  deadline: ScheduledDeadline;
  extraCount: number;
}

/** Gentle nudge date for items with no detected deadline. */
export function nudgeDateFor(item: Item): string {
  const saved = parseISO(item.saved_at);
  const nudge = new Date(saved);
  nudge.setDate(nudge.getDate() + DEFAULT_NUDGE_DAYS);
  return nudge.toISOString();
}

/** Nearest deadline per item across the whole library, soonest first. */
export function upcomingDeadlines(items: Item[], now: Date = new Date()): UpcomingDeadline[] {
  return items
    .map((item) => {
      const deadline = nearestDeadline(item, now);
      return deadline ? { item, deadline, extraCount: item.deadlines.length - 1 } : null;
    })
    .filter((entry): entry is UpcomingDeadline => entry !== null)
    .sort((a, b) => a.deadline.date.localeCompare(b.deadline.date));
}
