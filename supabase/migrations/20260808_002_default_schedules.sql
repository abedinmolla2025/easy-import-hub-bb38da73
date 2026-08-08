-- ============================================================
-- Noor App — Default recurring scheduled notifications
-- All times in Asia/Kolkata
-- ============================================================

-- 1. Every Friday (Jumu'ah) — 11:30 AM
insert into public.scheduler_schedules (name, kind, time_at, weekdays, enabled, target, islamic_event)
values ('জুম্মার নামাজের রেমাইন্ডার', 'weekly', '11:30:00', ARRAY[5]::int[], true, 'all', 'jumuah')
on conflict do nothing;

-- 2. Every day — Morning 7:00 AM (dua)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target)
values ('সোকালের দোযা', 'daily', '07:00:00', true, 'all')
on conflict do nothing;

-- 3. Every day — Evening 7:00 PM (dua)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target)
values ('সন্ধ্যার দোয়া', 'daily', '19:00:00', true, 'all')
on conflict do nothing;

-- 4. Every night — 9:30 PM (sleep dua)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target)
values ('রাতের দোযা — ঘুমানোর আগে', 'daily', '21:30:00', true, 'all')
on conflict do nothing;

-- 5. Monday & Thursday — Nafl fasting reminder (7:00 AM)
insert into public.scheduler_schedules (name, kind, time_at, weekdays, enabled, target)
values ('নাফল রোজার রেমাইন্ডার', 'weekly', '07:00:00', ARRAY[1,4]::int[], true, 'all')
on conflict do nothing;

-- 6. Ramadan Sehri reminder — 4:45 AM (disabled by default; enable each Ramadan)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target, islamic_event)
values ('সেহরির রেমাইন্ডার', 'daily', '04:45:00', false, 'all', 'ramadan_sehri')
on conflict do nothing;

-- 7. Ramadan Iftar reminder — 6:15 PM (disabled by default; enable each Ramadan)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target, islamic_event)
values ('ইফতারের রেমাইন্ডার', 'daily', '18:15:00', false, 'all', 'ramadan_iftar')
on conflict do nothing;

-- 8. Eid Takbeer reminder — Eid day 8:00 AM (disabled by default; enable near Eid)
insert into public.scheduler_schedules (name, kind, time_at, enabled, target, islamic_event)
values ('ঈদের তাকবীর', 'islamic_event', '08:00:00', false, 'all', 'eid_ul_fitr')
on conflict do nothing;

-- Initialize next_run_at for all enabled schedules
update public.scheduler_schedules
set next_run_at = public.scheduler_compute_next_run(s, s.tz)
where enabled = true;
