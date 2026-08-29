import { create } from 'zustand';

import { reminderDateFor } from '@/lib/deadlines';
import { MOCK_ITEMS } from '@/lib/mockItems';
import type { Category, Deadline, Item, ItemAnalysis } from '@/lib/types';
import { genId } from '@/lib/utils';

interface SmartSaveState {
  items: Item[];
  saveAnalyzedLink: (originalUrl: string, analysis: ItemAnalysis) => Item;
  addDeadline: (itemId: string, date: string, context: string) => void;
  updateDeadline: (
    itemId: string,
    deadlineId: string,
    patch: Partial<Pick<Deadline, 'date' | 'context' | 'reminder_date'>>,
  ) => void;
  removeDeadline: (itemId: string, deadlineId: string) => void;
  setCategory: (itemId: string, category: Category) => void;
  removeItem: (itemId: string) => void;
}

function withDeadlines(item: Item, deadlines: Deadline[]): Item {
  return { ...item, deadlines, has_deadline: deadlines.length > 0 };
}

export const useSmartSaveStore = create<SmartSaveState>((set) => ({
  items: MOCK_ITEMS,

  saveAnalyzedLink: (originalUrl, analysis) => {
    const item: Item = {
      id: genId(),
      original_url: originalUrl,
      saved_at: new Date().toISOString(),
      ...analysis,
    };
    set((state) => ({ items: [item, ...state.items] }));
    return item;
  },

  addDeadline: (itemId, date, context) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? withDeadlines(item, [
              ...item.deadlines,
              {
                id: genId(),
                date,
                context,
                reminder_date: reminderDateFor(date),
                reminder_sent: false,
              },
            ])
          : item,
      ),
    }));
  },

  updateDeadline: (itemId, deadlineId, patch) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) return item;
        return withDeadlines(
          item,
          item.deadlines.map((deadline) => {
            if (deadline.id !== deadlineId) return deadline;
            const next = { ...deadline, ...patch };
            // Keep the reminder anchored to the deadline unless set explicitly.
            if (patch.date && !patch.reminder_date) {
              next.reminder_date = reminderDateFor(patch.date);
              next.reminder_sent = false;
            }
            return next;
          }),
        );
      }),
    }));
  },

  removeDeadline: (itemId, deadlineId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? withDeadlines(
              item,
              item.deadlines.filter((deadline) => deadline.id !== deadlineId),
            )
          : item,
      ),
    }));
  },

  setCategory: (itemId, category) => {
    set((state) => ({
      items: state.items.map((item) => (item.id === itemId ? { ...item, category } : item)),
    }));
  },

  removeItem: (itemId) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== itemId) }));
  },
}));

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
