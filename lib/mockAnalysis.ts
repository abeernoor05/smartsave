import { addDays } from 'date-fns';

import { reminderDateFor } from '@/lib/deadlines';
import { LOCAL_THUMBNAIL_BY_CATEGORY } from '@/lib/thumbnails';
import type { Category, Confidence, Deadline, ItemAnalysis, Platform } from '@/lib/types';
import { genId } from '@/lib/utils';

/**
 * Placeholder for the real pipeline (scrape -> OCR -> LLM). Same signature the
 * live version will keep: a URL in, a fully analyzed item payload out.
 */

export const ANALYSIS_STAGES = [
  'Fetching the link…',
  'Reading caption and image text…',
  'Analyzing with AI…',
  'Filing it and setting reminders…',
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

interface DeadlineDraft {
  inDays: number;
  context: string;
}

interface AnalysisTemplate {
  keywords: string[];
  category: Category;
  confidence: Confidence;
  ai_summary: string;
  caption_text: string;
  ocr_text: string;
  deadlines: DeadlineDraft[];
}

const GENERAL_TEMPLATE: AnalysisTemplate = {
  keywords: [],
  category: 'General',
  confidence: 'low',
  ai_summary:
    'A saved post worth revisiting — no dates or actions detected, so SmartSave will nudge you about it in a week.',
  caption_text:
    'Bookmarking this one: a short thread on building a slower, calmer weekly routine, with a simple checklist at the end that actually seems doable.',
  ocr_text: 'A CALMER WEEK IN 5 STEPS',
  deadlines: [],
};

const TEMPLATES: AnalysisTemplate[] = [
  {
    keywords: ['job', 'career', 'hiring', 'intern', 'role', 'vacancy', 'apply'],
    category: 'Career',
    confidence: 'high',
    ai_summary:
      'Product Design internship at Northwind Studio (remote, 6 months). Portfolio and short cover note required; interviews start the week after the cut-off.',
    caption_text:
      "We're opening 4 seats for our 2026 Product Design internship. Fully remote, paid, and mentored by our senior design team. Applications close on the 14th — send a portfolio plus a short note on why this cohort. Shortlisted candidates hear back within a week.",
    ocr_text: 'NORTHWIND STUDIO • DESIGN INTERNSHIP 2026 • APPLY BY THE 14TH',
    deadlines: [
      { inDays: 6, context: 'Application deadline' },
      { inDays: 13, context: 'Interview week starts' },
    ],
  },
  {
    keywords: ['travel', 'trip', 'flight', 'hotel', 'visa', 'tour', 'hostel'],
    category: 'Travel',
    confidence: 'medium',
    ai_summary:
      'Early-bird fares to Lisbon for spring, roughly 40% below usual. Fare class is limited and the promo code expires at the end of the month.',
    caption_text:
      'Spring in Lisbon without the spring prices. Return fares from €148 when you book with code EARLYSPRING before the end of the month. Travel window runs March through May, limited seats per flight.',
    ocr_text: 'LISBON FROM €148 RETURN • CODE EARLYSPRING • LIMITED SEATS',
    deadlines: [{ inDays: 11, context: 'Promo code expires' }],
  },
  {
    keywords: ['tax', 'invest', 'finance', 'money', 'fund', 'isa', 'pension', 'saving'],
    category: 'Finance',
    confidence: 'high',
    ai_summary:
      'Reminder that the tax-free savings allowance resets at the end of the financial year — unused allowance does not carry over.',
    caption_text:
      "Quick reminder before the financial year closes: your tax-free savings allowance doesn't roll over. If you haven't used it, the window shuts on the 5th and it's gone. Even a partial top-up beats leaving it unused.",
    ocr_text: 'ALLOWANCE RESETS 5 APRIL • USE IT OR LOSE IT',
    deadlines: [{ inDays: 20, context: 'Allowance window closes' }],
  },
  {
    keywords: ['course', 'learn', 'workshop', 'bootcamp', 'class', 'webinar', 'talk'],
    category: 'Learning',
    confidence: 'medium',
    ai_summary:
      'Free 4-week live workshop on systems thinking. Enrolment closes before the first session, and sessions are not recorded.',
    caption_text:
      'Running my systems thinking workshop again — 4 live sessions, Tuesdays, free to join. Enrolment closes the day before we start and I keep the group small so there are no recordings. Link in bio to grab a seat.',
    ocr_text: 'SYSTEMS THINKING • 4 LIVE SESSIONS • ENROL BEFORE SESSION ONE',
    deadlines: [
      { inDays: 3, context: 'Enrolment closes' },
      { inDays: 4, context: 'First live session' },
      { inDays: 25, context: 'Final session' },
    ],
  },
  GENERAL_TEMPLATE,
];

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100000;
  }
  return hash;
}

function pickTemplate(url: string): AnalysisTemplate {
  const lower = url.toLowerCase();
  const matched = TEMPLATES.find((template) =>
    template.keywords.some((keyword) => lower.includes(keyword)),
  );
  if (matched) return matched;
  return TEMPLATES[hashString(lower) % TEMPLATES.length] ?? GENERAL_TEMPLATE;
}

export function buildDeadlines(drafts: DeadlineDraft[], from: Date = new Date()): Deadline[] {
  return drafts.map((draft) => {
    const date = addDays(from, draft.inDays).toISOString();
    return {
      id: genId(),
      date,
      context: draft.context,
      reminder_date: reminderDateFor(date),
      reminder_sent: false,
    };
  });
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Mock AI pass. Reports progress so the Add Link screen can narrate it. */
export async function analyzeLink(
  url: string,
  onStage?: (stage: string, index: number) => void,
): Promise<ItemAnalysis> {
  for (const [index, stage] of ANALYSIS_STAGES.entries()) {
    onStage?.(stage, index);
    await wait(520);
  }

  const template = pickTemplate(url);
  const deadlines = buildDeadlines(template.deadlines);

  return {
    platform: detectPlatform(url),
    thumbnail_url: LOCAL_THUMBNAIL_BY_CATEGORY[template.category],
    caption_text: template.caption_text,
    ocr_text: template.ocr_text,
    ai_summary: template.ai_summary,
    category: template.category,
    has_deadline: deadlines.length > 0,
    deadlines,
    confidence: template.confidence,
  };
}
