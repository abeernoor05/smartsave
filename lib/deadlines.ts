import {
  addDays,
  differenceInCalendarDays,
  formatDistanceToNowStrict,
  isBefore,
  parseISO,
} from 'date-fns';

import { COLORS } from '@/lib/colors';
import type { Deadline, Item } from '@/lib/types';
import { genId } from '@/lib/utils';

/** Days before a dated deadline that the first reminder fires. */
export const REMINDER_LEAD_DAYS = 2;
/** Days after saving that an undated deadline (or a plain saved item) resurfaces. */
export const UNDATED_NUDGE_DAYS = 3;
/** Context of the entry added to items that carry no deadline at all. */
export const DEFAULT_DEADLINE_CONTEXT = 'saved item';

export type Urgency = 'overdue' | 'today' | 'soon' | 'upcoming';

/** A deadline the AI (or the user) managed to pin to an actual date. */
export type ScheduledDeadline = Deadline & { date: string };

export function isScheduled(deadline: Deadline): deadline is ScheduledDeadline {
  return typeof deadline.date === 'string' && deadline.date.length > 0;
}

/** The placeholder entry that only exists to resurface an item with no deadline. */
export function isResurfaceDeadline(deadline: Deadline): boolean {
  return (
    !isScheduled(deadline) && deadline.context.trim().toLowerCase() === DEFAULT_DEADLINE_CONTEXT
  );
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

export interface BadgeStyle {
  bgClass: string;
  textClass: string;
  color: string;
}

const RED: BadgeStyle = {
  bgClass: 'bg-urgent-soft',
  textClass: 'text-urgent',
  color: COLORS.urgent,
};
const AMBER: BadgeStyle = { bgClass: 'bg-soon-soft', textClass: 'text-soon', color: COLORS.soon };
const GREY: BadgeStyle = { bgClass: 'bg-calm-soft', textClass: 'text-calm', color: COLORS.calm };

/**
 * Deadline badges: red once a date is overdue, today, or within three days;
 * amber while it is still further out.
 */
export const URGENCY_STYLES: Record<Urgency, BadgeStyle> = {
  overdue: RED,
  today: RED,
  soon: RED,
  upcoming: AMBER,
};

/** A deadline that was mentioned but has no date pinned down yet. */
export const UNCONFIRMED_STYLE = AMBER;

/** An item with no deadline at all — only a gentle resurface nudge. */
export const NO_DEADLINE_STYLE = GREY;

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

/** Reminder date for a dated deadline, clamped so it never lands after the deadline. */
export function reminderDateFor(deadlineISO: string, leadDays = REMINDER_LEAD_DAYS): string {
  const deadline = parseISO(deadlineISO);
  const reminder = addDays(deadline, -Math.max(0, leadDays));
  return (isBefore(reminder, deadline) ? reminder : deadline).toISOString();
}

/** Resurface date for an undated entry: three days after the item was saved. */
export function nudgeDateFrom(savedAtISO: string): string {
  return addDays(parseISO(savedAtISO), UNDATED_NUDGE_DAYS).toISOString();
}

/** Gentle nudge date for an item, from when it was saved. */
export function nudgeDateFor(item: Item): string {
  return nudgeDateFrom(item.saved_at);
}

/** How many days before its date this deadline reminds, defaulting to the standard lead. */
export function leadDaysOf(deadline: Deadline): number {
  if (!deadline.date || !deadline.reminder_date) return REMINDER_LEAD_DAYS;
  return Math.max(
    0,
    differenceInCalendarDays(parseISO(deadline.date), parseISO(deadline.reminder_date)),
  );
}

export function createDeadline(
  date: string | null,
  context: string,
  savedAtISO: string = new Date().toISOString(),
): Deadline {
  return {
    id: genId(),
    date,
    context,
    reminder_date: date ? reminderDateFor(date) : nudgeDateFrom(savedAtISO),
    lead_reminder_sent: false,
    reminder_sent: false,
  };
}

/** The stand-in entry for items where no deadline was mentioned at all. */
export function defaultDeadlineFor(savedAtISO: string): Deadline {
  return createDeadline(null, DEFAULT_DEADLINE_CONTEXT, savedAtISO);
}

export interface NormalizedDeadlines {
  deadlines: Deadline[];
  /** True when the rules had to fill something in, so the row needs writing back. */
  changed: boolean;
}

/**
 * Applies the reminder rules to a whole deadlines array:
 * dated entries get a reminder two days ahead, undated ones resurface three days
 * after saving, and an empty array gains a single "saved item" resurface entry.
 */
export function normalizeDeadlines(deadlines: Deadline[], savedAtISO: string): NormalizedDeadlines {
  if (deadlines.length === 0) {
    return { deadlines: [defaultDeadlineFor(savedAtISO)], changed: true };
  }

  let changed = false;
  const next = deadlines.map((deadline) => {
    if (deadline.reminder_date) return deadline;
    changed = true;
    return {
      ...deadline,
      reminder_date: deadline.date ? reminderDateFor(deadline.date) : nudgeDateFrom(savedAtISO),
    };
  });

  return { deadlines: next, changed };
}

export type DeadlinePatch = Partial<Pick<Deadline, 'date' | 'context' | 'reminder_date'>>;

/**
 * Applies an edit to a single deadline, keeping the reminder anchored to the
 * date (and the user's chosen lead time) unless the reminder is set explicitly.
 * Any change to the timing re-arms the reminders for that entry.
 */
export function applyDeadlinePatch(
  deadline: Deadline,
  patch: DeadlinePatch,
  savedAtISO: string = new Date().toISOString(),
): Deadline {
  const next: Deadline = { ...deadline, ...patch };

  if (patch.date !== undefined && patch.reminder_date === undefined) {
    next.reminder_date = patch.date
      ? reminderDateFor(patch.date, leadDaysOf(deadline))
      : nudgeDateFrom(savedAtISO);
  }

  if (patch.date !== undefined || patch.reminder_date !== undefined) {
    next.lead_reminder_sent = false;
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

/** Everything the AI or the user actually treats as a deadline. */
export function realDeadlines(item: Item): Deadline[] {
  return item.deadlines.filter((deadline) => !isResurfaceDeadline(deadline));
}

/** Deadlines that were mentioned in the post but have no date pinned down yet. */
export function undatedDeadlines(item: Item): Deadline[] {
  return realDeadlines(item).filter((deadline) => !isScheduled(deadline));
}

export function resurfaceDeadline(item: Item): Deadline | null {
  return item.deadlines.find(isResurfaceDeadline) ?? null;
}

/** When an item with no deadline gets resurfaced. */
export function resurfaceDateFor(item: Item): string {
  return resurfaceDeadline(item)?.reminder_date ?? nudgeDateFor(item);
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

/** Every future dated deadline across the library, soonest first. */
export function allUpcomingDeadlines(items: Item[], now: Date = new Date()): UpcomingDeadline[] {
  return items
    .flatMap((item) => {
      const scheduled = realDeadlines(item).filter(isScheduled);
      return scheduled
        .filter((deadline) => daysUntil(deadline.date, now) >= 0)
        .map((deadline) => ({
          item,
          deadline,
          extraCount: Math.max(0, scheduled.length - 1),
        }));
    })
    .sort((a, b) => a.deadline.date.localeCompare(b.deadline.date));
}

/** Nearest deadline per item across the whole library, soonest first. */
export function upcomingDeadlines(items: Item[], now: Date = new Date()): UpcomingDeadline[] {
  return items
    .map((item) => {
      const deadline = nearestDeadline(item, now);
      return deadline
        ? { item, deadline, extraCount: Math.max(0, realDeadlines(item).length - 1) }
        : null;
    })
    .filter((entry): entry is UpcomingDeadline => entry !== null)
    .sort((a, b) => a.deadline.date.localeCompare(b.deadline.date));
}
