-- RLS policies for HU Story

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.rants enable row level security;
alter table public.rant_comments enable row level security;
alter table public.events enable row level security;
alter table public.spots enable row level security;
alter table public.spot_reviews enable row level security;
alter table public.projects enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

-- Profiles
create policy "profiles_public_read"
  on public.profiles
  for select
  using (true);

create policy "profiles_owner_insert"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

create policy "profiles_owner_update"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Rants
create policy "rants_public_read"
  on public.rants
  for select
  using (true);

create policy "rants_auth_insert"
  on public.rants
  for insert
  with check (auth.uid() = user_id);

create policy "rants_owner_update"
  on public.rants
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "rants_owner_delete"
  on public.rants
  for delete
  using (auth.uid() = user_id);

-- Rant comments
create policy "rant_comments_public_read"
  on public.rant_comments
  for select
  using (true);

create policy "rant_comments_auth_insert"
  on public.rant_comments
  for insert
  with check (auth.uid() = user_id);

create policy "rant_comments_owner_update"
  on public.rant_comments
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "rant_comments_owner_delete"
  on public.rant_comments
  for delete
  using (auth.uid() = user_id);

-- Events
create policy "events_public_read"
  on public.events
  for select
  using (true);

create policy "events_auth_insert"
  on public.events
  for insert
  with check (auth.uid() = user_id);

create policy "events_owner_update"
  on public.events
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "events_owner_delete"
  on public.events
  for delete
  using (auth.uid() = user_id);

-- Spots
create policy "spots_public_read"
  on public.spots
  for select
  using (true);

create policy "spots_auth_insert"
  on public.spots
  for insert
  with check (auth.uid() = user_id);

create policy "spots_owner_update"
  on public.spots
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "spots_owner_delete"
  on public.spots
  for delete
  using (auth.uid() = user_id);

-- Spot reviews
create policy "spot_reviews_public_read"
  on public.spot_reviews
  for select
  using (true);

create policy "spot_reviews_auth_insert"
  on public.spot_reviews
  for insert
  with check (auth.uid() = user_id);

create policy "spot_reviews_owner_update"
  on public.spot_reviews
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "spot_reviews_owner_delete"
  on public.spot_reviews
  for delete
  using (auth.uid() = user_id);

-- Projects
create policy "projects_public_read"
  on public.projects
  for select
  using (true);

create policy "projects_auth_insert"
  on public.projects
  for insert
  with check (auth.uid() = user_id);

create policy "projects_owner_update"
  on public.projects
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects_owner_delete"
  on public.projects
  for delete
  using (auth.uid() = user_id);

-- Notifications
create policy "notifications_owner_read"
  on public.notifications
  for select
  using (auth.uid() = user_id);

create policy "notifications_owner_update"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reports
create policy "reports_auth_insert"
  on public.reports
  for insert
  with check (auth.uid() = reporter_id);

create policy "reports_owner_read"
  on public.reports
  for select
  using (auth.uid() = reporter_id);
