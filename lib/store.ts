import { create } from 'zustand';

import { backendErrorMessage, bilt } from '@/lib/backend';
import {
  applyDeadlinePatch,
  createDeadline,
  type DeadlinePatch,
  isResurfaceDeadline,
  normalizeDeadlines,
} from '@/lib/deadlines';
import type { ReminderMark } from '@/lib/reminders';
import {
  type Category,
  type Deadline,
  isCategory,
  isConfidence,
  isPlatform,
  type Item,
  type NewItem,
} from '@/lib/types';
import { genId } from '@/lib/utils';

const TABLE = 'items';
const SELECT_COLUMNS =
  'id, original_url, platform, thumbnail_url, caption_text, ocr_text, ai_summary, category, has_deadline, deadlines, confidence, saved_at';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface SmartSaveState {
  items: Item[];
  status: LoadStatus;
  error: string | null;
  /** Reads every saved row for the signed-in user. */
  loadItems: () => Promise<void>;
  /** Inserts a new row and returns the saved item. */
  createItem: (input: NewItem) => Promise<Item>;
  addDeadline: (itemId: string, date: string | null, context: string) => Promise<void>;
  updateDeadline: (itemId: string, deadlineId: string, patch: DeadlinePatch) => Promise<void>;
  removeDeadline: (itemId: string, deadlineId: string) => Promise<void>;
  /** Flags the exact deadline entries whose reminders have just gone out. */
  markRemindersSent: (marks: ReminderMark[]) => Promise<void>;
  setCategory: (itemId: string, category: Category) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  /** Drops the in-memory copy, e.g. on sign out. */
  clear: () => void;
}

interface ItemRow {
  id: string;
  original_url: string;
  platform: string | null;
  thumbnail_url: string | null;
  caption_text: string | null;
  ocr_text: string | null;
  ai_summary: string | null;
  category: string | null;
  has_deadline: boolean | null;
  deadlines: unknown;
  confidence: string | null;
  saved_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDeadlines(value: unknown): Deadline[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): Deadline[] => {
    if (!isRecord(entry)) return [];
    const raw = entry;
    const date = typeof raw.date === 'string' && raw.date.length > 0 ? raw.date : null;
    const reminder =
      typeof raw.reminder_date === 'string' && raw.reminder_date.length > 0
        ? raw.reminder_date
        : null;
    return [
      {
        id: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : genId(),
        date,
        context: typeof raw.context === 'string' ? raw.context : '',
        reminder_date: reminder,
        lead_reminder_sent: raw.lead_reminder_sent === true,
        reminder_sent: raw.reminder_sent === true,
      },
    ];
  });
}

/** "Has a real deadline" ignores the placeholder resurface entry. */
function hasRealDeadline(deadlines: Deadline[]): boolean {
  return deadlines.some((deadline) => !isResurfaceDeadline(deadline));
}

/**
 * Database row -> the Item shape the UI works with, with the reminder rules
 * applied. `needsBackfill` means the rules filled something in, so the row
 * should be written back.
 */
function toItem(row: ItemRow): { item: Item; needsBackfill: boolean } {
  const { deadlines, changed } = normalizeDeadlines(parseDeadlines(row.deadlines), row.saved_at);
  return {
    item: {
      id: row.id,
      original_url: row.original_url,
      platform: isPlatform(row.platform) ? row.platform : 'other',
      thumbnail_url: row.thumbnail_url ?? '',
      caption_text: row.caption_text ?? '',
      ocr_text: row.ocr_text ?? '',
      ai_summary: row.ai_summary ?? '',
      category: isCategory(row.category) ? row.category : 'General',
      has_deadline: hasRealDeadline(deadlines),
      deadlines,
      confidence: isConfidence(row.confidence) ? row.confidence : 'medium',
      saved_at: row.saved_at,
    },
    needsBackfill: changed,
  };
}

function withDeadlines(item: Item, deadlines: Deadline[]): Item {
  return { ...item, deadlines, has_deadline: hasRealDeadline(deadlines) };
}

/**
 * Writes rules-filled deadlines back to Postgres. Best effort: the local copy is
 * already correct and the same rules run again on the next load.
 */
async function backfillDeadlines(items: Item[]): Promise<void> {
  for (const item of items) {
    await bilt
      .from(TABLE)
      .update({ has_deadline: item.has_deadline, deadlines: item.deadlines })
      .eq('id', item.id);
  }
}

export const useSmartSaveStore = create<SmartSaveState>((set, get) => {
  /** Optimistic local edit, then persist; rolls back if the database refuses. */
  const persist = async (itemId: string, transform: (item: Item) => Item) => {
    const previous = get().items;
    const next = previous.map((item) => (item.id === itemId ? transform(item) : item));
    const target = next.find((item) => item.id === itemId);
    if (!target) return;

    set({ items: next, error: null });

    const { error } = await bilt
      .from(TABLE)
      .update({
        category: target.category,
        has_deadline: target.has_deadline,
        deadlines: target.deadlines,
      })
      .eq('id', itemId);

    if (error) {
      set({ items: previous, error: backendErrorMessage(error, 'Could not save that change.') });
    }
  };

  return {
    items: [],
    status: 'idle',
    error: null,

    loadItems: async () => {
      set({ status: 'loading', error: null });
      const { data, error } = await bilt
        .from(TABLE)
        .select(SELECT_COLUMNS)
        .order('saved_at', { ascending: false });

      if (error) {
        set({
          status: 'error',
          error: backendErrorMessage(error, 'Could not load your saved links.'),
        });
        return;
      }

      const parsed = ((data ?? []) as ItemRow[]).map(toItem);

      set({
        items: parsed.map((entry) => entry.item),
        status: 'ready',
        error: null,
      });

      const backfill = parsed.filter((entry) => entry.needsBackfill).map((entry) => entry.item);
      if (backfill.length > 0) void backfillDeadlines(backfill);
    },

    createItem: async (input) => {
      const { data: userData } = await bilt.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Sign in again to save this link.');

      const { data, error } = await bilt
        .from(TABLE)
        .insert({
          user_id: userId,
          original_url: input.original_url,
          platform: input.platform,
          thumbnail_url: input.thumbnail_url,
          caption_text: input.caption_text,
          ocr_text: input.ocr_text,
          ai_summary: input.ai_summary,
          category: input.category,
          has_deadline: hasRealDeadline(input.deadlines),
          deadlines: input.deadlines,
          confidence: input.confidence,
        })
        .select(SELECT_COLUMNS)
        .single();

      if (error || !data) {
        throw new Error(backendErrorMessage(error, 'Could not save this link.'));
      }

      // A save with no deadlines gains its resurface entry here, using the
      // server's saved_at so the nudge lands exactly three days later.
      const { item, needsBackfill } = toItem(data);
      set((state) => ({ items: [item, ...state.items], status: 'ready', error: null }));
      if (needsBackfill) void backfillDeadlines([item]);
      return item;
    },

    addDeadline: async (itemId, date, context) => {
      await persist(itemId, (item) =>
        withDeadlines(item, [
          ...item.deadlines.filter((deadline) => !isResurfaceDeadline(deadline)),
          createDeadline(date, context, item.saved_at),
        ]),
      );
    },

    updateDeadline: async (itemId, deadlineId, patch) => {
      await persist(itemId, (item) =>
        withDeadlines(
          item,
          item.deadlines.map((deadline) =>
            deadline.id === deadlineId
              ? applyDeadlinePatch(deadline, patch, item.saved_at)
              : deadline,
          ),
        ),
      );
    },

    removeDeadline: async (itemId, deadlineId) => {
      await persist(itemId, (item) => {
        const kept = item.deadlines.filter((deadline) => deadline.id !== deadlineId);
        return withDeadlines(item, normalizeDeadlines(kept, item.saved_at).deadlines);
      });
    },

    markRemindersSent: async (marks) => {
      const byItem = new Map<string, ReminderMark[]>();
      for (const mark of marks) {
        const list = byItem.get(mark.itemId);
        if (list) list.push(mark);
        else byItem.set(mark.itemId, [mark]);
      }

      for (const [itemId, itemMarks] of byItem) {
        await persist(itemId, (item) =>
          withDeadlines(
            item,
            item.deadlines.map((deadline) => {
              const stages = itemMarks
                .filter((mark) => mark.deadlineId === deadline.id)
                .map((mark) => mark.stage);
              if (stages.length === 0) return deadline;
              const sameDay = stages.includes('day');
              return {
                ...deadline,
                // A same-day reminder means the lead window is behind us too.
                lead_reminder_sent:
                  deadline.lead_reminder_sent || stages.includes('lead') || sameDay,
                reminder_sent: deadline.reminder_sent || sameDay || stages.includes('nudge'),
              };
            }),
          ),
        );
      }
    },

    setCategory: async (itemId, category) => {
      await persist(itemId, (item) => ({ ...item, category }));
    },

    removeItem: async (itemId) => {
      const previous = get().items;
      set({ items: previous.filter((item) => item.id !== itemId), error: null });

      const { error } = await bilt.from(TABLE).delete().eq('id', itemId);
      if (error) {
        set({ items: previous, error: backendErrorMessage(error, 'Could not remove that item.') });
      }
    },

    clear: () => set({ items: [], status: 'idle', error: null }),
  };
});

export function getItemById(items: Item[], id: string | undefined): Item | undefined {
  if (!id) return undefined;
  return items.find((item) => item.id === id);
}

export function itemsInCategory(items: Item[], category: Category): Item[] {
  return items
    .filter((item) => item.category === category)
    .sort((a, b) => b.saved_at.localeCompare(a.saved_at));
}

export function countsByCategory(items: Item[]): Record<Category, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});
}

export function searchItems(items: Item[], query: string): Item[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return items
    .filter((item) => {
      const haystack = [
        item.ai_summary,
        item.caption_text,
        item.ocr_text,
        item.category,
        item.platform,
        item.original_url,
        ...item.deadlines.map((deadline) => deadline.context),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    })
    .sort((a, b) => b.saved_at.localeCompare(a.saved_at));
}
