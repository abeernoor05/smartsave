/**
 * Shapes mirror the `items` table exactly (see lib/items.schema.sql) and stay
 * the single source of truth for an item across the app and the database.
 */

export const CATEGORIES = ['Career', 'Travel', 'Finance', 'Learning', 'General'] as const;
export type Category = (typeof CATEGORIES)[number];

export const PLATFORMS = ['linkedin', 'instagram', 'facebook', 'other'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CONFIDENCES = ['high', 'medium', 'low'] as const;
export type Confidence = (typeof CONFIDENCES)[number];

/** One entry of the `deadlines` jsonb array. */
export interface Deadline {
  /** Local stable key for editing a single entry inside the array. */
  id: string;
  /**
   * ISO date string of the deadline itself, or null when a deadline was
   * mentioned but no absolute date could be resolved.
   */
  date: string | null;
  /** Short explanation of what the date refers to. */
  context: string;
  /**
   * ISO date string of the next reminder for this entry: two days before a
   * dated deadline, or `saved_at + 3 days` for an undated one.
   */
  reminder_date: string | null;
  /** True once the "two days before" reminder of a dated entry has been sent. */
  lead_reminder_sent: boolean;
  /**
   * True once the final reminder of this entry has been sent — the same-day one
   * for a dated deadline, the resurface nudge for an undated one.
   */
  reminder_sent: boolean;
}

export interface Item {
  id: string;
  original_url: string;
  platform: Platform;
  thumbnail_url: string;
  caption_text: string;
  ocr_text: string;
  ai_summary: string;
  category: Category;
  has_deadline: boolean;
  deadlines: Deadline[];
  confidence: Confidence;
  saved_at: string;
}

/** What the analysis step produces before an item row is created. */
export type ItemAnalysis = Pick<
  Item,
  | 'platform'
  | 'thumbnail_url'
  | 'caption_text'
  | 'ocr_text'
  | 'ai_summary'
  | 'category'
  | 'has_deadline'
  | 'deadlines'
  | 'confidence'
>;

/** Payload the store inserts into the `items` table. */
export type NewItem = ItemAnalysis & { original_url: string };

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((category) => category === value);
}

export function isPlatform(value: unknown): value is Platform {
  return PLATFORMS.some((platform) => platform === value);
}

export function isConfidence(value: unknown): value is Confidence {
  return CONFIDENCES.some((confidence) => confidence === value);
}
