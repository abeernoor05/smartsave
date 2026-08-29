import { FunctionsHttpError } from '@biltme/backend';

import { bilt } from '@/lib/backend';
import { createDeadline } from '@/lib/deadlines';
import {
  type Category,
  type Confidence,
  type Deadline,
  isCategory,
  isConfidence,
  isPlatform,
  type ItemAnalysis,
  type Platform,
} from '@/lib/types';

/** Narration for the Add Link loading state while the server does the work. */
export const ANALYSIS_STAGES = [
  'Fetching the link…',
  'Reading caption and image text…',
  'Analyzing with AI…',
] as const;

export function detectPlatform(rawUrl: string): Platform {
  const url = rawUrl.toLowerCase();
  if (url.includes('linkedin.')) return 'linkedin';
  if (url.includes('instagram.') || url.includes('instagr.am')) return 'instagram';
  if (url.includes('facebook.') || url.includes('fb.watch') || url.includes('fb.com')) {
    return 'facebook';
  }
  return 'other';
}

export function isProbablyUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 4 || /\s/.test(trimmed)) return false;
  return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(trimmed);
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** "2026-09-15" from the model -> midday ISO timestamp, timezone-safe. */
function toIsoDate(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export type LinkAnalysis =
  | { status: 'analyzed'; analysis: ItemAnalysis }
  | { status: 'needs_note'; platform: Platform; thumbnail_url: string; page_title: string };

interface AnalyzeResponse {
  status?: string;
  message?: string;
  platform?: string;
  thumbnail_url?: string;
  caption_text?: string;
  page_title?: string;
  ai_summary?: string;
  category?: string;
  has_deadline?: boolean;
  deadlines?: { date?: string | null; context?: string }[];
  confidence?: string;
}

/**
 * Runs the real pipeline: the server fetches the page, reads its text and first
 * image, and returns the model's structured answer.
 */
export async function analyzeLink(url: string): Promise<LinkAnalysis> {
  const { data, error } = await bilt.functions.invoke<AnalyzeResponse>('analyze-link', {
    body: { url },
  });

  if (error) {
    let message = 'Could not analyze that link. Try again.';
    if (error instanceof FunctionsHttpError && error.context instanceof Response) {
      try {
        const body: unknown = await error.context.json();
        const bodyMessage =
          body && typeof body === 'object' && 'message' in body ? body.message : undefined;
        if (typeof bodyMessage === 'string' && bodyMessage.length > 0) message = bodyMessage;
      } catch {
        // Keep the friendly default.
      }
    }
    throw new Error(message);
  }

  if (!data || typeof data.status !== 'string') {
    throw new Error('Could not analyze that link. Try again.');
  }

  const platform: Platform = isPlatform(data.platform) ? data.platform : detectPlatform(url);

  if (data.status === 'needs_note') {
    return {
      status: 'needs_note',
      platform,
      thumbnail_url: data.thumbnail_url ?? '',
      page_title: data.page_title ?? '',
    };
  }

  if (data.status !== 'analyzed') {
    throw new Error(data.message ?? 'Could not analyze that link. Try again.');
  }

  const deadlines: Deadline[] = (data.deadlines ?? []).map((entry) =>
    createDeadline(toIsoDate(entry.date ?? null), entry.context?.trim() || 'Deadline'),
  );
  const category: Category = isCategory(data.category) ? data.category : 'General';
  const confidence: Confidence = isConfidence(data.confidence) ? data.confidence : 'medium';

  return {
    status: 'analyzed',
    analysis: {
      platform,
      thumbnail_url: data.thumbnail_url ?? '',
      caption_text: data.caption_text ?? '',
      ocr_text: '',
      ai_summary: data.ai_summary ?? '',
      category,
      has_deadline: deadlines.length > 0,
      deadlines,
      confidence,
    },
  };
}
