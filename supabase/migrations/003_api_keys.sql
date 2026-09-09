-- KickoffCal Pro MCP API keys (hashed at rest; plaintext shown once)

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'MCP',
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists api_keys_user_id_idx on public.api_keys (user_id);
create index if not exists api_keys_key_hash_idx on public.api_keys (key_hash)
  where revoked_at is null;

alter table public.api_keys enable row level security;

create policy "api_keys_select_own" on public.api_keys
  for select using (auth.uid() = user_id);

create policy "api_keys_insert_own" on public.api_keys
  for insert with check (auth.uid() = user_id);

create policy "api_keys_update_own" on public.api_keys
  for update using (auth.uid() = user_id);

-- Deletes are soft-revokes via update; hard delete allowed for cleanup
create policy "api_keys_delete_own" on public.api_keys
  for delete using (auth.uid() = user_id);

comment on table public.api_keys is
  'Hashed KickoffCal Pro API keys for MCP / bearer auth. Plaintext never stored.';
