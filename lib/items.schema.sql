-- SmartSave: saved links analyzed by AI.
-- This is the live schema of the connected Bilt Cloud Postgres database.
-- lib/types.ts mirrors these field names and types.

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  -- Owner of the row; every read and write is scoped to this via RLS below.
  user_id uuid not null references auth.users (id) on delete cascade,
  original_url text not null,
  platform text not null default 'other' check (platform in ('linkedin', 'instagram', 'facebook', 'other')),
  thumbnail_url text,
  caption_text text,
  ocr_text text,
  ai_summary text,
  category text not null default 'General' check (category in ('Career', 'Travel', 'Finance', 'Learning', 'General')),
  has_deadline boolean not null default false,
  -- Each entry: { id, date, context, reminder_date, reminder_sent }
  -- date / reminder_date are null when a deadline was mentioned but not resolvable.
  deadlines jsonb not null default '[]'::jsonb,
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  saved_at timestamptz not null default now()
);

create index if not exists items_user_id_idx on items (user_id);
create index if not exists items_category_idx on items (category);
create index if not exists items_saved_at_idx on items (saved_at desc);
create index if not exists items_deadlines_idx on items using gin (deadlines);

alter table items enable row level security;

-- Each signed-in user only ever reaches their own rows.
create policy "items_select_own" on items
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "items_insert_own" on items
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "items_update_own" on items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "items_delete_own" on items
  for delete to authenticated
  using (user_id = (select auth.uid()));
