-- SmartSave: saved links analyzed by AI.
-- Ready to run against Postgres when the backend is connected; the mock store
-- in lib/store.ts uses the same field names and types.

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  original_url text not null,
  platform text not null default 'other' check (platform in ('linkedin', 'instagram', 'facebook', 'other')),
  thumbnail_url text,
  caption_text text,
  ocr_text text,
  ai_summary text,
  category text not null default 'General' check (category in ('Career', 'Travel', 'Finance', 'Learning', 'General')),
  has_deadline boolean not null default false,
  -- Each entry: { id, date, context, reminder_date, reminder_sent }
  deadlines jsonb not null default '[]'::jsonb,
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  saved_at timestamptz not null default now()
);

create index if not exists items_category_idx on items (category);
create index if not exists items_saved_at_idx on items (saved_at desc);
create index if not exists items_deadlines_idx on items using gin (deadlines);
