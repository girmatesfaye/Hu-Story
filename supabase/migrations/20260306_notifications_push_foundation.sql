-- Production foundation: notification deep-link metadata + Expo push tokens

alter table public.notifications
  add column if not exists target_type text,
  add column if not exists target_id uuid,
  add column if not exists deep_link text;

create index if not exists notifications_target_idx
  on public.notifications(target_type, target_id);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_id_idx
  on public.push_tokens(user_id);

create trigger push_tokens_set_updated_at
before update on public.push_tokens
for each row execute procedure public.set_updated_at();

alter table public.push_tokens enable row level security;

create policy "push_tokens_owner_read"
  on public.push_tokens
  for select
  using (auth.uid() = user_id);

create policy "push_tokens_owner_insert"
  on public.push_tokens
  for insert
  with check (auth.uid() = user_id);

create policy "push_tokens_owner_update"
  on public.push_tokens
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_tokens_owner_delete"
  on public.push_tokens
  for delete
  using (auth.uid() = user_id);

create or replace function public.upsert_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'invalid_token';
  end if;

  insert into public.push_tokens (user_id, expo_push_token, enabled)
  values (auth.uid(), trim(p_token), true)
  on conflict (expo_push_token)
  do update set
    user_id = auth.uid(),
    enabled = true,
    updated_at = now();
end;
$$;
