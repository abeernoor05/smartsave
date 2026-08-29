/**
 * Shapes mirror the `items` table exactly (see lib/items.schema.sql), so the
 * mock store can be swapped for a real database without touching the UI.
 */

export const CATEGORIES = ['Career', 'Travel', 'Finance', 'Learning', 'General'] as const;
export type Category = (typeof CATEGORIES)[number];

export const PLATFORMS = ['linkedin', 'instagram', 'facebook', 'other'] as const;
export type Platform = (typeof PLATFORMS)[number];

export type Confidence = 'high' | 'medium' | 'low';

/** One entry of the `deadlines` jsonb array. */
export interface Deadline {
  /** Local stable key for editing a single entry inside the array. */
  id: string;
  /** ISO date string of the deadline itself. */
  date: string;
  /** Short explanation of what the date refers to. */
  context: string;
  /** ISO date string of when the user should be reminded. */
  reminder_date: string;
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
