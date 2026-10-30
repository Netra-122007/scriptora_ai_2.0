create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  settings jsonb not null
);

create table if not exists public.recognition_history (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  note jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.user_settings enable row level security;
alter table public.recognition_history enable row level security;

drop policy if exists "Users manage their own settings" on public.user_settings;
create policy "Users manage their own settings"
  on public.user_settings for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own recognition history" on public.recognition_history;
create policy "Users manage their own recognition history"
  on public.recognition_history for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_settings to authenticated;
grant select, insert, update, delete on public.recognition_history to authenticated;
