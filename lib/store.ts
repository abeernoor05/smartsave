import { create } from 'zustand';

import { backendErrorMessage, bilt } from '@/lib/backend';
import { applyDeadlinePatch, createDeadline, type DeadlinePatch } from '@/lib/deadlines';
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
        reminder_sent: raw.reminder_sent === true,
      },
    ];
  });
}

/** Database row -> the Item shape the UI works with. */
function toItem(row: ItemRow): Item {
  const deadlines = parseDeadlines(row.deadlines);
  return {
    id: row.id,
    original_url: row.original_url,
    platform: isPlatform(row.platform) ? row.platform : 'other',
    thumbnail_url: row.thumbnail_url ?? '',
    caption_text: row.caption_text ?? '',
    ocr_text: row.ocr_text ?? '',
    ai_summary: row.ai_summary ?? '',
    category: isCategory(row.category) ? row.category : 'General',
    has_deadline: row.has_deadline ?? deadlines.length > 0,
    deadlines,
    confidence: isConfidence(row.confidence) ? row.confidence : 'medium',
    saved_at: row.saved_at,
  };
}

function withDeadlines(item: Item, deadlines: Deadline[]): Item {
  return { ...item, deadlines, has_deadline: deadlines.length > 0 };
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

      set({
        items: ((data ?? []) as ItemRow[]).map(toItem),
        status: 'ready',
        error: null,
      });
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
          has_deadline: input.deadlines.length > 0,
          deadlines: input.deadlines,
          confidence: input.confidence,
        })
        .select(SELECT_COLUMNS)
        .single();

      if (error || !data) {
        throw new Error(backendErrorMessage(error, 'Could not save this link.'));
      }

      const item = toItem(data);
      set((state) => ({ items: [item, ...state.items], status: 'ready', error: null }));
      return item;
    },

    addDeadline: async (itemId, date, context) => {
      await persist(itemId, (item) =>
        withDeadlines(item, [...item.deadlines, createDeadline(date, context)]),
      );
    },

    updateDeadline: async (itemId, deadlineId, patch) => {
      await persist(itemId, (item) =>
        withDeadlines(
          item,
          item.deadlines.map((deadline) =>
            deadline.id === deadlineId ? applyDeadlinePatch(deadline, patch) : deadline,
          ),
        ),
      );
    },

    removeDeadline: async (itemId, deadlineId) => {
      await persist(itemId, (item) =>
        withDeadlines(
          item,
          item.deadlines.filter((deadline) => deadline.id !== deadlineId),
        ),
      );
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
