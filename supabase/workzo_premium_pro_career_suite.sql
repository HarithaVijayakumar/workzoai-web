-- WorkZo AI Premium Pro career suite persistence
-- Run this in Supabase SQL editor after testing locally.

create table if not exists public.workzo_career_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.workzo_career_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_type text not null check (roadmap_type in ('30_day','60_day','90_day')),
  target_role text,
  target_company text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workzo_progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interview_session_id uuid null,
  overall_score int,
  trust_score int,
  evidence_score int,
  ownership_score int,
  structure_score int,
  readiness_score int,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.workzo_replay_intelligence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interview_session_id uuid null,
  moments jsonb not null default '[]'::jsonb,
  recruiter_challenges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.workzo_career_memory enable row level security;
alter table public.workzo_career_roadmaps enable row level security;
alter table public.workzo_progress_snapshots enable row level security;
alter table public.workzo_replay_intelligence enable row level security;

drop policy if exists "Users can read own career memory" on public.workzo_career_memory;
create policy "Users can read own career memory" on public.workzo_career_memory for select using (auth.uid() = user_id);
drop policy if exists "Users can upsert own career memory" on public.workzo_career_memory;
create policy "Users can upsert own career memory" on public.workzo_career_memory for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own career memory" on public.workzo_career_memory;
create policy "Users can update own career memory" on public.workzo_career_memory for update using (auth.uid() = user_id);

drop policy if exists "Users can read own career roadmaps" on public.workzo_career_roadmaps;
create policy "Users can read own career roadmaps" on public.workzo_career_roadmaps for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own career roadmaps" on public.workzo_career_roadmaps;
create policy "Users can insert own career roadmaps" on public.workzo_career_roadmaps for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own career roadmaps" on public.workzo_career_roadmaps;
create policy "Users can update own career roadmaps" on public.workzo_career_roadmaps for update using (auth.uid() = user_id);

drop policy if exists "Users can read own progress snapshots" on public.workzo_progress_snapshots;
create policy "Users can read own progress snapshots" on public.workzo_progress_snapshots for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own progress snapshots" on public.workzo_progress_snapshots;
create policy "Users can insert own progress snapshots" on public.workzo_progress_snapshots for insert with check (auth.uid() = user_id);

drop policy if exists "Users can read own replay intelligence" on public.workzo_replay_intelligence;
create policy "Users can read own replay intelligence" on public.workzo_replay_intelligence for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own replay intelligence" on public.workzo_replay_intelligence;
create policy "Users can insert own replay intelligence" on public.workzo_replay_intelligence for insert with check (auth.uid() = user_id);
