create extension if not exists pgcrypto;
create schema if not exists private;

create type public.agent_mode as enum ('inbox', 'learning', 'research');
create type public.run_status as enum ('queued', 'running', 'completed', 'partial', 'failed');
create type public.transcript_status as enum ('available', 'unavailable', 'processing', 'failed', 'manually_added');

create table public.users (id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table public.playlists (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, youtube_playlist_id text not null, title text not null, description text not null default '', mode public.agent_mode not null, summary_depth text not null check (summary_depth in ('brief','normal','deep')), status public.run_status not null default 'queued', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, youtube_playlist_id));
create table public.videos (id uuid primary key default gen_random_uuid(), youtube_video_id text not null unique, title text not null, channel text, duration_seconds integer, published_at timestamptz, thumbnail_url text, created_at timestamptz not null default now());
create table public.playlist_videos (playlist_id uuid not null references public.playlists(id) on delete cascade, video_id uuid not null references public.videos(id) on delete cascade, position integer not null, user_priority text check (user_priority in ('recommended','low','unclear')), primary key (playlist_id, video_id));
create table public.transcripts (id uuid primary key default gen_random_uuid(), video_id uuid not null references public.videos(id) on delete cascade, user_id uuid not null references public.users(id) on delete cascade, status public.transcript_status not null, source text not null, content text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(video_id, user_id, source));
create table public.summaries (id uuid primary key default gen_random_uuid(), video_id uuid not null references public.videos(id) on delete cascade, user_id uuid not null references public.users(id) on delete cascade, depth text not null, summary text not null, key_points jsonb not null default '[]', action_items jsonb not null default '[]', model text not null, created_at timestamptz not null default now(), unique(video_id, user_id, depth));
create table public.playlist_analyses (id uuid primary key default gen_random_uuid(), playlist_id uuid not null references public.playlists(id) on delete cascade, user_id uuid not null references public.users(id) on delete cascade, mode public.agent_mode not null, output jsonb not null, created_at timestamptz not null default now());
create table public.agent_runs (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade, playlist_id uuid references public.playlists(id) on delete cascade, idempotency_key text not null, operation text not null, status public.run_status not null default 'queued', started_at timestamptz, completed_at timestamptz, error_code text, model text, input_tokens integer not null default 0, output_tokens integer not null default 0, estimated_cost numeric(12,6) not null default 0, created_at timestamptz not null default now(), unique(user_id, idempotency_key));
create table public.playlist_questions (id uuid primary key default gen_random_uuid(), playlist_id uuid not null references public.playlists(id) on delete cascade, user_id uuid not null references public.users(id) on delete cascade, question text not null, created_at timestamptz not null default now());
create table public.playlist_answers (id uuid primary key default gen_random_uuid(), question_id uuid not null references public.playlist_questions(id) on delete cascade, user_id uuid not null references public.users(id) on delete cascade, answer text not null, source_video_ids uuid[] not null default '{}', created_at timestamptz not null default now());
create table public.user_preferences (user_id uuid primary key references public.users(id) on delete cascade, preferences jsonb not null default '{}', updated_at timestamptz not null default now());

-- Auth users may already exist when this schema is first deployed.
insert into public.users (id)
select id from auth.users
on conflict (id) do nothing;

create index playlists_user_created_idx on public.playlists(user_id, created_at desc);
create index playlist_videos_video_idx on public.playlist_videos(video_id);
create index transcripts_user_video_idx on public.transcripts(user_id, video_id);
create index summaries_user_video_idx on public.summaries(user_id, video_id);
create index analyses_playlist_created_idx on public.playlist_analyses(playlist_id, created_at desc);
create index runs_playlist_status_idx on public.agent_runs(playlist_id, status);
create index questions_playlist_created_idx on public.playlist_questions(playlist_id, created_at);

alter table public.users enable row level security; alter table public.playlists enable row level security; alter table public.videos enable row level security; alter table public.playlist_videos enable row level security; alter table public.transcripts enable row level security; alter table public.summaries enable row level security; alter table public.playlist_analyses enable row level security; alter table public.agent_runs enable row level security; alter table public.playlist_questions enable row level security; alter table public.playlist_answers enable row level security; alter table public.user_preferences enable row level security;

create policy users_own on public.users for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy playlists_own on public.playlists for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy videos_via_owned_playlist on public.videos for select using (exists (select 1 from public.playlist_videos pv join public.playlists p on p.id = pv.playlist_id where pv.video_id = videos.id and p.user_id = (select auth.uid())));
create policy playlist_videos_own on public.playlist_videos for all using (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = (select auth.uid()))) with check (exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = (select auth.uid())));
create policy transcripts_own on public.transcripts for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy summaries_own on public.summaries for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy analyses_own on public.playlist_analyses for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy runs_own on public.agent_runs for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy questions_own on public.playlist_questions for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy answers_own on public.playlist_answers for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy preferences_own on public.user_preferences for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.users(id) values (new.id) on conflict do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();
