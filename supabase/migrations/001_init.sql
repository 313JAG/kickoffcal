-- KickoffCal Supabase schema (optional for PoC; local JSON cache works without this)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  emoji_enabled boolean not null default true,
  score_mode text not null default 'live_and_final'
    check (score_mode in ('off', 'final_only', 'live_and_final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leagues (
  id text primary key,
  name text not null
);

create table if not exists public.teams (
  id text primary key,
  league_id text not null references public.leagues (id) on delete cascade,
  slug text not null,
  name text not null,
  abbreviation text not null,
  logo_url text,
  conference text,
  division text,
  provider_ids jsonb not null default '{}'::jsonb,
  feed_token text not null unique,
  unique (league_id, slug)
);

create table if not exists public.games (
  id text primary key,
  league_id text not null references public.leagues (id) on delete cascade,
  season int not null,
  season_type int not null default 2,
  week int,
  kickoff_utc timestamptz not null,
  home_team_id text not null references public.teams (id),
  away_team_id text not null references public.teams (id),
  venue text,
  status text not null,
  status_detail text,
  home_score int,
  away_score int,
  broadcasts jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  provider_ids jsonb not null default '{}'::jsonb,
  sequence int not null default 1,
  last_synced_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  team_id text not null references public.teams (id) on delete cascade,
  feed_token text not null unique,
  created_at timestamptz not null default now(),
  unique (user_id, team_id)
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (auth.uid() = user_id);
create policy "subscriptions_delete_own" on public.subscriptions
  for delete using (auth.uid() = user_id);

insert into public.leagues (id, name) values ('nfl', 'NFL')
on conflict (id) do nothing;
