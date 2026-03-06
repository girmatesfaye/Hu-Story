-- Add owner-scoped cleanup delete RPCs for profile-managed content
-- Safe to run multiple times due to CREATE OR REPLACE FUNCTION.

create or replace function public.delete_my_event(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cover_url text;
  v_object_path text;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  select cover_url
  into v_cover_url
  from public.events
  where id = p_event_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'not_found_or_forbidden';
  end if;

  if v_cover_url is not null and length(trim(v_cover_url)) > 0 then
    if position('/event-covers/' in v_cover_url) > 0 then
      v_object_path := split_part(v_cover_url, '/event-covers/', 2);
    else
      v_object_path := v_cover_url;
    end if;

    v_object_path := split_part(v_object_path, '?', 1);

    if length(trim(v_object_path)) > 0 then
      delete from storage.objects
      where bucket_id = 'event-covers'
        and name = v_object_path;
    end if;
  end if;

  delete from public.reports
  where lower(target_type) = 'events'
    and target_id = p_event_id;

  delete from public.events
  where id = p_event_id
    and user_id = auth.uid();

  if not found then
    raise exception 'delete_failed';
  end if;

  return true;
end;
$$;

create or replace function public.delete_my_spot(p_spot_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cover_url text;
  v_object_path text;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  select cover_url
  into v_cover_url
  from public.spots
  where id = p_spot_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'not_found_or_forbidden';
  end if;

  if v_cover_url is not null and length(trim(v_cover_url)) > 0 then
    if position('/spot-images/' in v_cover_url) > 0 then
      v_object_path := split_part(v_cover_url, '/spot-images/', 2);
    else
      v_object_path := v_cover_url;
    end if;

    v_object_path := split_part(v_object_path, '?', 1);

    if length(trim(v_object_path)) > 0 then
      delete from storage.objects
      where bucket_id = 'spot-images'
        and name = v_object_path;
    end if;
  end if;

  delete from public.reports
  where lower(target_type) = 'spots'
    and target_id = p_spot_id;

  delete from public.spots
  where id = p_spot_id
    and user_id = auth.uid();

  if not found then
    raise exception 'delete_failed';
  end if;

  return true;
end;
$$;

create or replace function public.delete_my_project(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cover_url text;
  v_object_path text;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  select cover_url
  into v_cover_url
  from public.projects
  where id = p_project_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'not_found_or_forbidden';
  end if;

  if v_cover_url is not null and length(trim(v_cover_url)) > 0 then
    if position('/project-covers/' in v_cover_url) > 0 then
      v_object_path := split_part(v_cover_url, '/project-covers/', 2);
    else
      v_object_path := v_cover_url;
    end if;

    v_object_path := split_part(v_object_path, '?', 1);

    if length(trim(v_object_path)) > 0 then
      delete from storage.objects
      where bucket_id = 'project-covers'
        and name = v_object_path;
    end if;
  end if;

  delete from public.reports
  where lower(target_type) = 'projects'
    and target_id = p_project_id;

  delete from public.projects
  where id = p_project_id
    and user_id = auth.uid();

  if not found then
    raise exception 'delete_failed';
  end if;

  return true;
end;
$$;
