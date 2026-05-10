create table if not exists public.mcp_tokens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists mcp_tokens_owner_id_idx on public.mcp_tokens(owner_id);

alter table public.mcp_tokens enable row level security;

create policy "mcp_tokens_select_own"
  on public.mcp_tokens for select
  using (auth.uid() = owner_id);

create policy "mcp_tokens_insert_own"
  on public.mcp_tokens for insert
  with check (auth.uid() = owner_id);

create policy "mcp_tokens_delete_own"
  on public.mcp_tokens for delete
  using (auth.uid() = owner_id);
