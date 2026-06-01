create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_id text,
  candidate_name text,
  target_role text not null default 'Interview Practice',
  target_company text,
  recruiter_name text not null default 'AI Recruiter',
  recruiter_title text,
  company_style text,
  atmosphere text,
  country text,
  duration_seconds integer not null default 0,
  overall_score integer,
  trust_score integer,
  verdict jsonb,
  summary jsonb,
  weakest_moment jsonb,
  transcript jsonb not null default '[]'::jsonb,
  report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_sessions_score_range check (
    (overall_score is null or (overall_score >= 0 and overall_score <= 100))
    and
    (trust_score is null or (trust_score >= 0 and trust_score <= 100))
  )
);

create unique index if not exists interview_sessions_user_local_id_idx
on public.interview_sessions(user_id, local_id)
where local_id is not null;

create index if not exists interview_sessions_user_created_idx
on public.interview_sessions(user_id, created_at desc);

alter table public.interview_sessions enable row level security;

drop policy if exists "Users can view their own interview sessions" on public.interview_sessions;
drop policy if exists "Users can insert their own interview sessions" on public.interview_sessions;
drop policy if exists "Users can update their own interview sessions" on public.interview_sessions;
drop policy if exists "Users can delete their own interview sessions" on public.interview_sessions;

create policy "Users can view their own interview sessions"
on public.interview_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own interview sessions"
on public.interview_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own interview sessions"
on public.interview_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own interview sessions"
on public.interview_sessions
for delete
to authenticated
using (auth.uid() = user_id);
