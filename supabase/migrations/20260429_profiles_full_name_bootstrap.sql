-- Ensure profile rows are provisioned with full_name/campus at auth signup
-- and backfill legacy rows that were created without full_name.

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
  v_campus text;
begin
  v_full_name := nullif(
    trim(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        ''
      )
    ),
    ''
  );

  v_campus := nullif(
    trim(coalesce(new.raw_user_meta_data ->> 'campus', '')),
    ''
  );

  insert into public.profiles (user_id, full_name, campus)
  values (new.id, v_full_name, coalesce(v_campus, 'Hawassa University'))
  on conflict (user_id) do update
  set full_name = coalesce(
        nullif(trim(public.profiles.full_name), ''),
        excluded.full_name
      ),
      campus = coalesce(
        nullif(trim(public.profiles.campus), ''),
        excluded.campus,
        'Hawassa University'
      ),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute procedure public.handle_new_user_profile();

insert into public.profiles (user_id, full_name, campus)
select
  u.id,
  nullif(
    trim(
      coalesce(
        u.raw_user_meta_data ->> 'full_name',
        u.raw_user_meta_data ->> 'name',
        ''
      )
    ),
    ''
  ) as full_name,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'campus'), ''),
    'Hawassa University'
  ) as campus
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null
on conflict (user_id) do nothing;

update public.profiles p
set
  full_name = src.full_name,
  updated_at = now()
from (
  select
    u.id as user_id,
    nullif(
      trim(
        coalesce(
          u.raw_user_meta_data ->> 'full_name',
          u.raw_user_meta_data ->> 'name',
          ''
        )
      ),
      ''
    ) as full_name
  from auth.users u
) src
where p.user_id = src.user_id
  and (p.full_name is null or length(trim(p.full_name)) = 0)
  and src.full_name is not null;

update public.profiles p
set
  campus = src.campus,
  updated_at = now()
from (
  select
    u.id as user_id,
    nullif(trim(coalesce(u.raw_user_meta_data ->> 'campus', '')), '') as campus
  from auth.users u
) src
where p.user_id = src.user_id
  and (p.campus is null or length(trim(p.campus)) = 0)
  and src.campus is not null;