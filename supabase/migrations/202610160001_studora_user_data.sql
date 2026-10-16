-- Studora Supabase-only app data store.
-- Run this migration in Supabase SQL Editor before deploying the API migration.
create table if not exists public.studora_user_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null check (collection in ('profile','assignments','attendance','tasks','sessions','notifications','materials_bookmarks')),
  record_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, record_id)
);

alter table public.studora_user_data enable row level security;

drop policy if exists "Users can read own Studora records" on public.studora_user_data;
create policy "Users can read own Studora records"
  on public.studora_user_data for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own Studora records" on public.studora_user_data;
create policy "Users can insert own Studora records"
  on public.studora_user_data for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own Studora records" on public.studora_user_data;
create policy "Users can update own Studora records"
  on public.studora_user_data for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own Studora records" on public.studora_user_data;
create policy "Users can delete own Studora records"
  on public.studora_user_data for delete to authenticated
  using (auth.uid() = user_id);

create index if not exists studora_user_data_collection_idx
  on public.studora_user_data (user_id, collection);
