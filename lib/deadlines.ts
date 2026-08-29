import { differenceInCalendarDays, formatDistanceToNowStrict, isBefore, parseISO } from 'date-fns';

import type { Deadline, Item } from '@/lib/types';

/** Days before a detected deadline that the reminder fires. */
export const REMINDER_LEAD_DAYS = 3;
/** Gentle nudge for items where the AI found no deadline at all. */
export const DEFAULT_NUDGE_DAYS = 7;

export type Urgency = 'overdue' | 'today' | 'soon' | 'upcoming';

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

/** Gentle nudge date for items with no detected deadline. */
export function nudgeDateFor(item: Item): string {
  const saved = parseISO(item.saved_at);
  const nudge = new Date(saved);
  nudge.setDate(nudge.getDate() + DEFAULT_NUDGE_DAYS);
  return nudge.toISOString();
}

export function sortDeadlines(deadlines: Deadline[]): Deadline[] {
  return [...deadlines].sort((a, b) => a.date.localeCompare(b.date));
}

/** Nearest deadline that has not passed yet; falls back to the latest past one. */
export function nearestDeadline(item: Item, now: Date = new Date()): Deadline | null {
  if (item.deadlines.length === 0) return null;
  const sorted = sortDeadlines(item.deadlines);
  return sorted.find((d) => daysUntil(d.date, now) >= 0) ?? sorted[sorted.length - 1] ?? null;
}

export interface UpcomingDeadline {
  item: Item;
  deadline: Deadline;
  extraCount: number;
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
