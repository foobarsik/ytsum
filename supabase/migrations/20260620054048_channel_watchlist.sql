create table public.watchlist_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  youtube_channel_id text not null,
  uploads_playlist_id text not null,
  title text not null,
  description text not null default '',
  thumbnail_url text,
  topic text not null default '',
  digest_enabled boolean not null default true,
  check_interval_hours integer not null default 6 check (check_interval_hours between 1 and 168),
  last_checked_at timestamptz,
  next_check_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, youtube_channel_id)
);

create table public.watchlist_videos (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.watchlist_channels(id) on delete cascade,
  youtube_video_id text not null,
  title text not null,
  description text not null default '',
  published_at timestamptz not null,
  thumbnail_url text,
  transcript_status public.transcript_status not null default 'processing',
  discovered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_id, youtube_video_id)
);

create table public.watchlist_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  watchlist_video_id uuid not null references public.watchlist_videos(id) on delete cascade,
  output jsonb not null,
  model text not null,
  created_at timestamptz not null default now(),
  unique (user_id, watchlist_video_id)
);

create table public.weekly_digests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  output jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, period_start, period_end)
);

create index watchlist_channels_due_idx on public.watchlist_channels(next_check_at) where next_check_at is not null;
create index watchlist_videos_channel_published_idx on public.watchlist_videos(channel_id, published_at desc);
create index watchlist_insights_video_idx on public.watchlist_insights(watchlist_video_id);
create index weekly_digests_user_period_idx on public.weekly_digests(user_id, period_end desc);

alter table public.watchlist_channels enable row level security;
alter table public.watchlist_videos enable row level security;
alter table public.watchlist_insights enable row level security;
alter table public.weekly_digests enable row level security;

create policy watchlist_channels_own on public.watchlist_channels
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy watchlist_videos_own on public.watchlist_videos
  for all
  using (exists (
    select 1 from public.watchlist_channels channel
    where channel.id = channel_id and channel.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.watchlist_channels channel
    where channel.id = channel_id and channel.user_id = (select auth.uid())
  ));

create policy watchlist_insights_own on public.watchlist_insights
  for all
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.watchlist_videos video
      join public.watchlist_channels channel on channel.id = video.channel_id
      where video.id = watchlist_video_id and channel.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.watchlist_videos video
      join public.watchlist_channels channel on channel.id = video.channel_id
      where video.id = watchlist_video_id and channel.user_id = (select auth.uid())
    )
  );

create policy weekly_digests_own on public.weekly_digests
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.watchlist_channels to authenticated;
grant select, insert, update, delete on public.watchlist_videos to authenticated;
grant select, insert, update, delete on public.watchlist_insights to authenticated;
grant select, insert, update, delete on public.weekly_digests to authenticated;
