-- Per-user cloud backup snapshot (Nebula backup JSON)
create table if not exists public.user_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  backup jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  client_id text
);

alter table public.user_snapshots enable row level security;

create policy "Users can read own snapshot"
  on public.user_snapshots
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own snapshot"
  on public.user_snapshots
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own snapshot"
  on public.user_snapshots
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
