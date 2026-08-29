import { addDays, subDays } from 'date-fns';

import { reminderDateFor } from '@/lib/deadlines';
import { LOCAL_THUMBNAIL_BY_CATEGORY } from '@/lib/thumbnails';
import type { Category, Confidence, Deadline, Item, Platform } from '@/lib/types';

/**
 * Placeholder library so every screen has realistic content: overdue, due
 * today, multi-deadline, and no-deadline items are all represented.
 */

const NOW = new Date();

interface SeedDeadline {
  inDays: number;
  context: string;
  reminder_sent?: boolean;
}

interface Seed {
  id: string;
  original_url: string;
  platform: Platform;
  category: Category;
  confidence: Confidence;
  ai_summary: string;
  caption_text: string;
  ocr_text: string;
  savedDaysAgo: number;
  deadlines: SeedDeadline[];
}

const SEEDS: Seed[] = [
  {
    id: '6f1c1c2a-9c0e-4a1f-8f3a-1d2b3c4d5e01',
    original_url: 'https://www.linkedin.com/posts/northwind-studio-design-lead-role',
    platform: 'linkedin',
    category: 'Career',
    confidence: 'high',
    ai_summary:
      'Senior Product Designer role at Northwind Studio, hybrid in Berlin. Portfolio plus a one-page case study required; first interviews are scheduled the week after applications close.',
    caption_text:
      "We're hiring a Senior Product Designer to lead our platform squad. Hybrid in Berlin, 3 days in studio. Send a portfolio and one case study you're proud of — applications close on the 14th. First conversations happen the following week, and we aim to close the loop within a month. Referrals very welcome.",
    ocr_text: 'NORTHWIND STUDIO — SENIOR PRODUCT DESIGNER — BERLIN / HYBRID — APPLY BY THE 14TH',
    savedDaysAgo: 2,
    deadlines: [
      { inDays: 2, context: 'Applications close' },
      { inDays: 9, context: 'First interview round' },
    ],
  },
  {
    id: '6f1c1c2a-9c0e-4a1f-8f3a-1d2b3c4d5e02',
    original_url: 'https://www.linkedin.com/posts/atlas-group-graduate-scheme-2026',
    platform: 'linkedin',
    category: 'Career',
    confidence: 'medium',
    ai_summary:
      'Atlas Group graduate scheme, two intakes a year. The spring intake window has already closed — the post mentions a second round opening later.',
    caption_text:
      'Our graduate scheme opens twice a year across analytics, operations and finance. Spring intake applications closed on the 3rd; if you missed it, the autumn round opens after summer. No cover letter needed, just the online assessment.',
    ocr_text: 'ATLAS GROUP GRADUATE SCHEME • SPRING INTAKE • CLOSES 3RD',
    savedDaysAgo: 12,
    deadlines: [{ inDays: -2, context: 'Spring intake closed', reminder_sent: true }],
  },
  {
    id: '6f1c1c2a-9c0e-4a1f-8f3a-1d2b3c4d5e03',
    original_url: 'https://www.instagram.com/reel/lisbon-spring-fare-drop',
    platform: 'instagram',
    category: 'Travel',
    confidence: 'medium',
    ai_summary:
      'Return fares to Lisbon from €148 using an early-bird code. Travel window is March to May and the code stops working at the end of the sale.',
    caption_text:
      'Spring in Lisbon without the spring prices ✈️ Return fares from €148 with code EARLYSPRING. Travel March–May, limited seats per flight, and the code dies when the sale ends. Save this before it disappears.',
    ocr_text: 'LISBON €148 RETURN • CODE EARLYSPRING • SALE ENDS SOON',
    savedDaysAgo: 3,
    deadlines: [{ inDays: 5, context: 'Fare sale ends' }],
  },
  {
    id: '6f1c1c2a-9c0e-4a1f-8f3a-1d2b3c4d5e04',
    original_url: 'https://www.instagram.com/p/one-bag-packing-system',
    platform: 'instagram',
    category: 'Travel',
    confidence: 'low',
    ai_summary:
      'A one-bag packing method for trips up to ten days, with a compact list of what to leave behind. No dates involved, so this is a keep-for-later reference.',
    caption_text:
      'The one-bag system I use for every trip under ten days: three tops, two bottoms, one layer, laundry every fourth night. The trick is picking a single colour family so everything works together. Full list saved in my highlights.',
    ocr_text: 'ONE BAG • TEN DAYS • THREE TOPS TWO BOTTOMS ONE LAYER',
    savedDaysAgo: 6,
    deadlines: [],
  },
  {
    id: '6f1c1c2a-9c0e-4a1f-8f3a-1d2b3c4d5e05',
    original_url: 'https://www.facebook.com/posts/end-of-tax-year-checklist',
    platform: 'facebook',
    category: 'Finance',
    confidence: 'high',
    ai_summary:
      'End-of-tax-year checklist with three separate dates: a savings rate change, the allowance reset, and the self-assessment filing cut-off.',
    caption_text:
      "Three dates worth putting in your calendar before the tax year turns over. First, the promotional savings rate drops back to base — check what yours resets to. Second, your tax-free allowance resets and unused room doesn't carry over. Third, self-assessment filing closes; leaving it to the final week is how people end up paying penalties.",
    ocr_text: 'RATE CHANGE • ALLOWANCE RESET • FILING DEADLINE — DON’T MISS THESE',
    savedDaysAgo: 4,
    deadlines: [
      { inDays: 0, context: 'Promotional savings rate drops' },
      { inDays: 18, context: 'Tax-free allowance resets' },
      { inDays: 41, context: 'Self-assessment filing closes' },
    ],
  },
  {
    id: '6f1c1c2a-9c0e-4a1f-8f3a-1d2b3c4d5e06',
    original_url: 'https://example.com/articles/index-funds-in-plain-english',
    platform: 'other',
    category: 'Finance',
    confidence: 'medium',
    ai_summary:
      'Plain-language explainer on index funds: fee drag, why timing rarely helps, and a simple three-fund starting split. Evergreen, no deadline.',
    caption_text:
      'Index funds in plain English. The article walks through what an index actually is, how a 0.7% fee quietly compounds against you over thirty years, and why a boring three-fund split beats most active picking. Ends with a short checklist for opening a first account.',
    ocr_text: '',
    savedDaysAgo: 9,
    deadlines: [],
  },
  {
    id: '6f1c1c2a-9c0e-4a1f-8f3a-1d2b3c4d5e07',
    original_url: 'https://example.com/workshops/systems-thinking-live',
    platform: 'other',
    category: 'Learning',
    confidence: 'high',
    ai_summary:
      'Free four-week live workshop on systems thinking. Enrolment closes today, the first session runs next week, and sessions are not recorded.',
    caption_text:
      'Systems thinking, four live sessions, Tuesdays at 18:00 CET. Free but capped at 40 people so it stays a conversation. Enrolment closes today and I do not record the calls — if you can only make half the sessions, take the next cohort instead.',
    ocr_text: 'SYSTEMS THINKING • 4 LIVE SESSIONS • NO RECORDINGS • ENROL TODAY',
    savedDaysAgo: 1,
    deadlines: [
      { inDays: 0, context: 'Enrolment closes' },
      { inDays: 8, context: 'First live session' },
    ],
  },
  {
    id: '6f1c1c2a-9c0e-4a1f-8f3a-1d2b3c4d5e08',
    original_url: 'https://www.instagram.com/p/design-scholarship-open-call',
    platform: 'instagram',
    category: 'Learning',
    confidence: 'medium',
    ai_summary:
      'Open call for a €2,000 design scholarship. Needs two work samples and a 300-word statement submitted before the closing date.',
    caption_text:
      'Open call: €2,000 scholarship for our advanced design track. Send two work samples and 300 words on what you want to build. No formal education required — we read every entry. Closing date on the flyer.',
    ocr_text: 'OPEN CALL • €2,000 SCHOLARSHIP • TWO SAMPLES + 300 WORDS',
    savedDaysAgo: 5,
    deadlines: [{ inDays: 14, context: 'Scholarship entries close' }],
  },
  {
    id: '6f1c1c2a-9c0e-4a1f-8f3a-1d2b3c4d5e09',
    original_url: 'https://www.facebook.com/groups/neighbourhood-plant-swap',
    platform: 'facebook',
    category: 'General',
    confidence: 'low',
    ai_summary:
      'Neighbourhood plant swap that runs on the first Saturday of each month. Nothing to action now, worth a nudge later.',
    caption_text:
      'Monthly plant swap is back at the community garden, first Saturday of every month, 10:00 to 13:00. Bring cuttings, pots, or just curiosity. Free tea, and someone always brings too many tomato seedlings.',
    ocr_text: 'PLANT SWAP • FIRST SATURDAY MONTHLY • COMMUNITY GARDEN',
    savedDaysAgo: 8,
    deadlines: [],
  },
  {
    id: '6f1c1c2a-9c0e-4a1f-8f3a-1d2b3c4d5e10',
    original_url: 'https://example.com/events/riverside-food-festival',
    platform: 'other',
    category: 'General',
    confidence: 'low',
    ai_summary:
      'Riverside food festival with early-bird tickets. One date detected: the early pricing tier ends before general sale opens.',
    caption_text:
      'Riverside food festival returns for a third year — 30 kitchens, two stages, one very long queue for the doughnuts. Early-bird tickets are cheaper until the tier sells out, then general sale opens at full price.',
    ocr_text: 'RIVERSIDE FOOD FESTIVAL • EARLY BIRD TICKETS',
    savedDaysAgo: 11,
    deadlines: [{ inDays: 27, context: 'Early-bird tickets end' }],
  },
];

function buildSeedDeadlines(seedId: string, deadlines: SeedDeadline[]): Deadline[] {
  return deadlines.map((deadline, index) => {
    const date = addDays(NOW, deadline.inDays).toISOString();
    return {
      id: `${seedId}-d${index + 1}`,
      date,
      context: deadline.context,
      reminder_date: reminderDateFor(date),
      reminder_sent: deadline.reminder_sent ?? false,
    };
  });
}

export const MOCK_ITEMS: Item[] = SEEDS.map((seed) => {
  const deadlines = buildSeedDeadlines(seed.id, seed.deadlines);
  return {
    id: seed.id,
    original_url: seed.original_url,
    platform: seed.platform,
    thumbnail_url: LOCAL_THUMBNAIL_BY_CATEGORY[seed.category],
    caption_text: seed.caption_text,
    ocr_text: seed.ocr_text,
    ai_summary: seed.ai_summary,
    category: seed.category,
    has_deadline: deadlines.length > 0,
    deadlines,
    confidence: seed.confidence,
    saved_at: subDays(NOW, seed.savedDaysAgo).toISOString(),
  };
});
