-- Core schema for HU Story (Supabase)

-- Extensions
create extension if not exists "pgcrypto";

-- Helper function for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Admin emails (manual allowlist)
create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  campus text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Rants
create table if not exists public.rants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text,
  content text not null,
  is_anonymous boolean not null default true,
  upvotes int not null default 0,
  downvotes int not null default 0,
  comment_count int not null default 0,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rants_created_at_idx on public.rants(created_at desc);
create index if not exists rants_category_idx on public.rants(category);

create trigger rants_set_updated_at
before update on public.rants
for each row execute procedure public.set_updated_at();

-- Rant votes
create table if not exists public.rant_votes (
  rant_id uuid not null references public.rants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (rant_id, user_id)
);

create index if not exists rant_votes_rant_id_idx on public.rant_votes(rant_id);
create index if not exists rant_votes_user_id_idx on public.rant_votes(user_id);

create or replace function public.set_rant_vote(p_rant_id uuid, p_vote int)
returns table (upvotes int, downvotes int, user_vote int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing int;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  if p_vote not in (-1, 0, 1) then
    raise exception 'invalid vote';
  end if;

  select vote into v_existing
  from public.rant_votes
  where rant_id = p_rant_id
    and user_id = auth.uid();

  if p_vote = 0 then
    if v_existing is not null then
      delete from public.rant_votes
      where rant_id = p_rant_id
        and user_id = auth.uid();

      if v_existing = 1 then
        update public.rants r
        set upvotes = greatest(r.upvotes - 1, 0)
        where r.id = p_rant_id;
      else
        update public.rants r
        set downvotes = greatest(r.downvotes - 1, 0)
        where r.id = p_rant_id;
      end if;
    end if;
  else
    if v_existing is null then
      insert into public.rant_votes (rant_id, user_id, vote)
      values (p_rant_id, auth.uid(), p_vote);

      if p_vote = 1 then
        update public.rants r
        set upvotes = r.upvotes + 1
        where r.id = p_rant_id;
      else
        update public.rants r
        set downvotes = r.downvotes + 1
        where r.id = p_rant_id;
      end if;
    elsif v_existing <> p_vote then
      update public.rant_votes
      set vote = p_vote
      where rant_id = p_rant_id
        and user_id = auth.uid();

      if v_existing = 1 then
        update public.rants r
        set upvotes = greatest(r.upvotes - 1, 0),
            downvotes = r.downvotes + 1
        where r.id = p_rant_id;
      else
        update public.rants r
        set downvotes = greatest(r.downvotes - 1, 0),
            upvotes = r.upvotes + 1
        where r.id = p_rant_id;
      end if;
    end if;
  end if;

  return query
  select r.upvotes,
         r.downvotes,
         coalesce(v.vote, 0) as user_vote
  from public.rants r
  left join public.rant_votes v
    on v.rant_id = r.id
   and v.user_id = auth.uid()
  where r.id = p_rant_id;
end;
$$;

-- Rant views
create table if not exists public.rant_views (
  rant_id uuid not null references public.rants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (rant_id, user_id)
);

create index if not exists rant_views_rant_id_idx on public.rant_views(rant_id);
create index if not exists rant_views_user_id_idx on public.rant_views(user_id);

create or replace function public.increment_rant_views(p_rant_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
  v_views int;
begin
  if auth.uid() is null then
    select views into v_views
    from public.rants
    where id = p_rant_id;
    return coalesce(v_views, 0);
  end if;

  select exists (
    select 1
    from public.rant_views
    where rant_id = p_rant_id
      and user_id = auth.uid()
  ) into v_exists;

  if not v_exists then
    insert into public.rant_views (rant_id, user_id)
    values (p_rant_id, auth.uid());

    update public.rants r
    set views = r.views + 1
    where r.id = p_rant_id
    returning r.views into v_views;
  else
    select views into v_views
    from public.rants
    where id = p_rant_id;
  end if;

  return coalesce(v_views, 0);
end;
$$;

-- Rant comments
create table if not exists public.rant_comments (
  id uuid primary key default gen_random_uuid(),
  rant_id uuid not null references public.rants(id) on delete cascade,
  parent_comment_id uuid references public.rant_comments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  content text not null,
  is_anonymous boolean not null default false,
  likes int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rant_comments_rant_id_idx on public.rant_comments(rant_id);
create index if not exists rant_comments_parent_id_idx on public.rant_comments(parent_comment_id);
create index if not exists rant_comments_created_at_idx on public.rant_comments(created_at desc);

create trigger rant_comments_set_updated_at
before update on public.rant_comments
for each row execute procedure public.set_updated_at();

create or replace function public.normalize_rant_comment_parent(p_parent_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_depth int := 0;
  v_current uuid := p_parent_id;
  v_next uuid;
  v_steps int;
  v_effective uuid := p_parent_id;
begin
  if p_parent_id is null then
    return null;
  end if;

  loop
    select parent_comment_id into v_next
    from public.rant_comments
    where id = v_current;

    exit when v_next is null;
    v_depth := v_depth + 1;
    v_current := v_next;
  end loop;

  if v_depth >= 3 then
    v_steps := v_depth - 2;
    v_effective := p_parent_id;
    for i in 1..v_steps loop
      select parent_comment_id into v_effective
      from public.rant_comments
      where id = v_effective;
      exit when v_effective is null;
    end loop;
  end if;

  return v_effective;
end;
$$;

create or replace function public.apply_rant_comment_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.parent_comment_id := public.normalize_rant_comment_parent(new.parent_comment_id);
  return new;
end;
$$;

create or replace function public.add_rant_comment(
  p_rant_id uuid,
  p_parent_id uuid,
  p_content text,
  p_is_anonymous boolean
)
returns public.rant_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent uuid;
  v_row public.rant_comments;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  v_parent := public.normalize_rant_comment_parent(p_parent_id);

  insert into public.rant_comments (
    rant_id,
    user_id,
    content,
    parent_comment_id,
    is_anonymous
  )
  values (
    p_rant_id,
    auth.uid(),
    p_content,
    v_parent,
    coalesce(p_is_anonymous, false)
  )
  returning * into v_row;

  return v_row;
end;
$$;

drop trigger if exists rant_comments_normalize_parent on public.rant_comments;
create trigger rant_comments_normalize_parent
before insert on public.rant_comments
for each row
execute procedure public.apply_rant_comment_parent();

-- Rant comment likes
create table if not exists public.rant_comment_likes (
  comment_id uuid not null references public.rant_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists rant_comment_likes_comment_id_idx on public.rant_comment_likes(comment_id);
create index if not exists rant_comment_likes_user_id_idx on public.rant_comment_likes(user_id);

create or replace function public.set_rant_comment_like(p_comment_id uuid, p_is_liked boolean)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
  v_likes int;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  select exists (
    select 1
    from public.rant_comment_likes
    where comment_id = p_comment_id
      and user_id = auth.uid()
  ) into v_exists;

  if p_is_liked and not v_exists then
    insert into public.rant_comment_likes (comment_id, user_id)
    values (p_comment_id, auth.uid());

    update public.rant_comments c
    set likes = c.likes + 1
    where c.id = p_comment_id
    returning c.likes into v_likes;
  elsif (not p_is_liked) and v_exists then
    delete from public.rant_comment_likes
    where comment_id = p_comment_id
      and user_id = auth.uid();

    update public.rant_comments c
    set likes = greatest(c.likes - 1, 0)
    where c.id = p_comment_id
    returning c.likes into v_likes;
  else
    select likes into v_likes
    from public.rant_comments
    where id = p_comment_id;
  end if;

  return coalesce(v_likes, 0);
end;
$$;

-- Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz,
  end_at timestamptz,
  location text,
  address text,
  cover_url text,
  tags text[],
  fee_type text,
  fee_amount numeric,
  attendees_count int not null default 0,
  host_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_start_at_idx on public.events(start_at);
create index if not exists events_created_at_idx on public.events(created_at desc);

create trigger events_set_updated_at
before update on public.events
for each row execute procedure public.set_updated_at();

-- Event attendees
create table if not exists public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create or replace function public.add_event_attendee(p_event_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.event_attendees (event_id, user_id)
  values (p_event_id, auth.uid())
  on conflict do nothing;

  if found then
    update public.events
    set attendees_count = attendees_count + 1
    where id = p_event_id
    returning attendees_count into v_count;
  else
    select attendees_count into v_count
    from public.events
    where id = p_event_id;
  end if;

  return coalesce(v_count, 0);
end;
$$;

create or replace function public.remove_event_attendee(p_event_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from public.event_attendees
  where event_id = p_event_id
    and user_id = auth.uid();

  if found then
    update public.events
    set attendees_count = greatest(attendees_count - 1, 0)
    where id = p_event_id
    returning attendees_count into v_count;
  else
    select attendees_count into v_count
    from public.events
    where id = p_event_id;
  end if;

  return coalesce(v_count, 0);
end;
$$;

-- Backfill attendees_count from event_attendees
-- update public.events e
-- set attendees_count = coalesce(a.cnt, 0)
-- from (
--   select event_id, count(*) as cnt
--   from public.event_attendees
--   group by event_id
-- ) a
-- where e.id = a.event_id;
-- update public.events
-- set attendees_count = 0
-- where id not in (select distinct event_id from public.event_attendees);

-- Spots
create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  category text,
  location text,
  description text,
  cover_url text,
  price_type text,
  price_amount numeric(10,2),
  rating_avg numeric(3,2) not null default 0,
  review_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spots_created_at_idx on public.spots(created_at desc);
create index if not exists spots_category_idx on public.spots(category);

create trigger spots_set_updated_at
before update on public.spots
for each row execute procedure public.set_updated_at();

-- Spot images
create table if not exists public.spot_images (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  image_url text not null,
  position int,
  created_at timestamptz not null default now()
);

create index if not exists spot_images_spot_id_idx
  on public.spot_images(spot_id);

create index if not exists spot_images_created_at_idx
  on public.spot_images(created_at desc);

-- Spot reviews
create table if not exists public.spot_reviews (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating int not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spot_reviews_spot_id_idx on public.spot_reviews(spot_id);
create index if not exists spot_reviews_created_at_idx on public.spot_reviews(created_at desc);

create trigger spot_reviews_set_updated_at
before update on public.spot_reviews
for each row execute procedure public.set_updated_at();

-- Keep spots.rating_avg and spots.review_count in sync with spot_reviews
create or replace function public.update_spot_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spot_id uuid;
begin
  if tg_op = 'DELETE' then
    v_spot_id := old.spot_id;
  else
    v_spot_id := new.spot_id;
  end if;

  update public.spots s
  set rating_avg = coalesce(
        (select avg(r.rating)::numeric(3,2)
         from public.spot_reviews r
         where r.spot_id = v_spot_id),
        0
      ),
      review_count = (
        select count(*)
        from public.spot_reviews r
        where r.spot_id = v_spot_id
      )
  where s.id = v_spot_id;

  if tg_op = 'UPDATE' and old.spot_id <> new.spot_id then
    update public.spots s
    set rating_avg = coalesce(
          (select avg(r.rating)::numeric(3,2)
           from public.spot_reviews r
           where r.spot_id = old.spot_id),
          0
        ),
        review_count = (
          select count(*)
          from public.spot_reviews r
          where r.spot_id = old.spot_id
        )
    where s.id = old.spot_id;
  end if;

  return null;
end;
$$;

drop trigger if exists spot_reviews_update_rating on public.spot_reviews;
create trigger spot_reviews_update_rating
after insert or update or delete on public.spot_reviews
for each row execute procedure public.update_spot_rating();

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  is_anonymous boolean not null default true,
  title text not null,
  summary text,
  details text,
  tags text[],
  repo_url text,
  cover_url text,
  likes int not null default 0,
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_created_at_idx on public.projects(created_at desc);

create trigger projects_set_updated_at
before update on public.projects
for each row execute procedure public.set_updated_at();

-- Project likes
create table if not exists public.project_likes (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_likes_project_id_idx on public.project_likes(project_id);
create index if not exists project_likes_user_id_idx on public.project_likes(user_id);

create or replace function public.set_project_like(p_project_id uuid, p_is_liked boolean)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
  v_likes int;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  select exists (
    select 1
    from public.project_likes
    where project_id = p_project_id
      and user_id = auth.uid()
  ) into v_exists;

  if p_is_liked and not v_exists then
    insert into public.project_likes (project_id, user_id)
    values (p_project_id, auth.uid());

    update public.projects
    set likes = likes + 1
    where id = p_project_id
    returning likes into v_likes;
  elsif (not p_is_liked) and v_exists then
    delete from public.project_likes
    where project_id = p_project_id
      and user_id = auth.uid();

    update public.projects
    set likes = greatest(likes - 1, 0)
    where id = p_project_id
    returning likes into v_likes;
  else
    select likes into v_likes
    from public.projects
    where id = p_project_id;
  end if;

  return coalesce(v_likes, 0);
end;
$$;

-- Project views
create table if not exists public.project_views (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_views_project_id_idx on public.project_views(project_id);
create index if not exists project_views_user_id_idx on public.project_views(user_id);

-- Anonymous project views (per device)
create table if not exists public.project_view_devices (
  project_id uuid not null references public.projects(id) on delete cascade,
  device_id text not null,
  created_at timestamptz not null default now(),
  primary key (project_id, device_id)
);

create index if not exists project_view_devices_project_id_idx
  on public.project_view_devices(project_id);

create or replace function public.increment_project_views(p_project_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
  v_views int;
begin
  if auth.uid() is null then
    select views into v_views
    from public.projects
    where id = p_project_id;
    return coalesce(v_views, 0);
  end if;

  select exists (
    select 1
    from public.project_views
    where project_id = p_project_id
      and user_id = auth.uid()
  ) into v_exists;

  if not v_exists then
    insert into public.project_views (project_id, user_id)
    values (p_project_id, auth.uid());

    update public.projects p
    set views = p.views + 1
    where p.id = p_project_id
    returning p.views into v_views;
  else
    select views into v_views
    from public.projects
    where id = p_project_id;
  end if;

  return coalesce(v_views, 0);
end;
$$;

create or replace function public.increment_project_views_anon(
  p_project_id uuid,
  p_device_id text
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
  v_views int;
begin
  if p_device_id is null or length(trim(p_device_id)) = 0 then
    select views into v_views
    from public.projects
    where id = p_project_id;
    return coalesce(v_views, 0);
  end if;

  select exists (
    select 1
    from public.project_view_devices
    where project_id = p_project_id
      and device_id = p_device_id
  ) into v_exists;

  if not v_exists then
    insert into public.project_view_devices (project_id, device_id)
    values (p_project_id, p_device_id);

    update public.projects p
    set views = p.views + 1
    where p.id = p_project_id
    returning p.views into v_views;
  else
    select views into v_views
    from public.projects
    where id = p_project_id;
  end if;

  return coalesce(v_views, 0);
end;
$$;

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

-- Reports (moderation)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

create trigger reports_set_updated_at
before update on public.reports
for each row execute procedure public.set_updated_at();
