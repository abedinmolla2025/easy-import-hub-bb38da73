-- ============================================================
-- Noor App — Scheduled Push Notification System
-- Migration 001: schema + pg_cron dispatcher
-- ============================================================

-- Ensure extensions
create extension if not exists cron;
create extension if not exists pg_net;

-- ---------------- Schedules ----------------
create table if not exists public.scheduler_schedules (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                              -- display name
  kind          text not null default 'one_time'
                  check (kind in ('one_time','daily','weekly','monthly','islamic_event')),
  -- schedule expression
  time_at       time not null default '09:00:00',           -- time of day (Asia/Kolkata)
  weekdays      int[] default '{}'::int[],                  -- 0=Sun ... 6=Sat (weekly)
  day_of_month  int default null,                           -- monthly day
  cron_expr     text default null,                          -- raw cron expr override (advanced)
  tz            text not null default 'Asia/Kolkata',
  -- islamic events: jumuah|ramadan_sehri|ramadan_iftar|eid_ul_fitr|eid_ul_adha|hajj
  islamic_event text default null,
  event_date    date default null,                          -- one_time date
  -- behaviour
  enabled       boolean not null default true,
  target        text not null default 'all'
                  check (target in ('all','web','android')),
  title_override text default null,                         -- static title (skip smart gen)
  body_override  text default null,                         -- static body
  content_auto   boolean not null default true,             -- auto-pick content
  content_type   text default null
                   check (content_type is null or content_type in ('dua','story')),
  content_id     uuid default null,                         -- pin to specific content
  created_by     text default null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  last_sent_at   timestamptz default null,
  next_run_at    timestamptz default null
);

create index if not exists idx_schedules_enabled_next on public.scheduler_schedules (enabled, next_run_at);

comment on column public.scheduler_schedules.kind is
 'one_time=once at event_date+time_at; daily=every day; weekly=on weekdays[]; monthly=on day_of_month; islamic_event=fires only when the event window is active';

-- ---------------- Runs (history) ----------------
create table if not exists public.scheduler_notification_runs (
  id                uuid primary key default gen_random_uuid(),
  schedule_id       uuid references public.scheduler_schedules(id) on delete cascade,
  schedule_name     text,
  run_at            timestamptz not null default now(),
  content_type      text,
  content_id        uuid,
  content_title     text,
  recipients_total  int not null default 0,
  recipients_sent   int not null default 0,
  recipients_failed int not null default 0,
  started_at        timestamptz,
  finished_at       timestamptz,
  error_summary     jsonb default '[]'::jsonb
);

create index if not exists idx_runs_schedule on public.scheduler_notification_runs (schedule_id, run_at desc);

-- ---------------- Retry queue ----------------
create table if not exists public.scheduler_retries (
  id            uuid primary key default gen_random_uuid(),
  token_id      uuid not null,
  platform      text not null,          -- web | android
  endpoint      text not null,
  payload       jsonb not null,
  attempts      int not null default 0,
  max_attempts  int not null default 1,
  last_error    text,
  queued_at     timestamptz not null default now(),
  next_attempt  timestamptz not null default now()
);

-- ---------------- RLS (admin-only) ----------------
alter table public.scheduler_schedules enable row level security;
alter table public.scheduler_notification_runs enable row level security;
alter table public.scheduler_retries enable row level security;

-- reuse the admin role check used elsewhere in the app
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'scheduler_schedules' and policyname = 'Admins full access') then
    create policy "Admins full access" on public.scheduler_schedules
      for all using (auth.jwt()->>'email' in (select email from public.admin_users));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'scheduler_notification_runs' and policyname = 'Admins read runs') then
    create policy "Admins read runs" on public.scheduler_notification_runs
      for select using (auth.jwt()->>'email' in (select email from public.admin_users));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'scheduler_notification_runs' and policyname = 'Service writes runs') then
    create policy "Service writes runs" on public.scheduler_notification_runs
      for insert with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'scheduler_retries' and policyname = 'Service only') then
    create policy "Service only" on public.scheduler_retries
      for all using (auth.role() = 'service_role');
  end if;
end $$;

-- ---------------- pg_cron: dispatcher (every minute) ----------------
-- finds enabled schedules due now and fires the Edge Function dispatcher.
-- NOTE: Replace 'YOUR_SERVICE_ROLE_KEY' with the project's service_role key
--       before running on the live database (Supabase SQL Editor / dashboard).
-- The key is sent only to the project's own Edge Function endpoint over HTTPS.

-- First store the service role key securely in vault (run once):
-- insert into vault.decrypted_secrets (name, secret)
-- values ('service_role_key', 'YOUR_SERVICE_ROLE_KEY')
-- on conflict (name) do update set secret = excluded.secret;

do $$ begin
  if not exists (select 1 from cron.job where jobname = 'noor-scheduler-dispatch') then
    perform cron.schedule(
      'noor-scheduler-dispatch',
      '* * * * *',
      $$
      select net.http_post(
        url := 'https://llicfiepatzgllmjhzbw.supabase.co/functions/v1/scheduler-dispatch',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(
            (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
            'YOUR_SERVICE_ROLE_KEY'
          )
        ),
        body := jsonb_build_object('dispatch_at', now()::text)::text
      );
      $$
    );
  end if;
end $$;

-- ---------------- Helper: compute next_run_at ----------------
create or replace function public.scheduler_compute_next_run(
  s scheduler_schedules,
  from_tz text default 'Asia/Kolkata'
) returns timestamptz language plpgsql as $$
declare
  local_now timestamptz := now() at time zone from_tz;
  t date := local_now::date;
  candidate timestamptz;
begin
  if s.kind = 'one_time' then
    candidate := (s.event_date || ' ' || s.time_at)::timestamp at time zone from_tz;
    return case when candidate > now() then candidate else null end;
  end if;
  loop
    t := t + 1;
    if s.kind = 'islamic_event' and s.event_date is not null and t = s.event_date then
      return (t || ' ' || s.time_at)::timestamp at time zone from_tz;
    end if;
    if s.kind in ('daily','islamic_event') and s.kind <> 'one_time' then
      return (t || ' ' || s.time_at)::timestamp at time zone from_tz;
    end if;
    if s.kind = 'weekly' and extract(dow from t)::int = any (s.weekdays) then
      return (t || ' ' || s.time_at)::timestamp at time zone from_tz;
    end if;
    if s.kind = 'monthly' and extract(day from t)::int = coalesce(s.day_of_month, 1) then
      return (t || ' ' || s.time_at)::timestamp at time zone from_tz;
    end if;
    if t > local_now::date + 400 then exit; end if;  -- safety guard
  end loop;
  return null;
end;
$$;
