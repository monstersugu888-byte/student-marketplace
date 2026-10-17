-- ETLAB-style academic features for Studora: announcements, exams, results, and student requests.
create table if not exists public.academic_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all' check (audience in ('all','students','teachers')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.academic_exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  exam_date date not null,
  start_time time,
  venue text,
  notes text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.academic_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  assessment text not null,
  marks numeric not null check (marks >= 0),
  max_marks numeric not null check (max_marks > 0 and marks <= max_marks),
  remarks text,
  entered_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.academic_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('attendance','leave','general')),
  subject text,
  details text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.academic_announcements enable row level security;
alter table public.academic_exams enable row level security;
alter table public.academic_results enable row level security;
alter table public.academic_requests enable row level security;
drop policy if exists "Signed-in users read announcements" on public.academic_announcements;
create policy "Signed-in users read announcements" on public.academic_announcements for select to authenticated using (audience = 'all' or audience = (auth.jwt()->'app_metadata'->>'role') or (auth.jwt()->'app_metadata'->>'role') = 'teacher');
drop policy if exists "Teachers manage announcements" on public.academic_announcements;
create policy "Teachers manage announcements" on public.academic_announcements for all to authenticated using ((auth.jwt()->'app_metadata'->>'role') = 'teacher' and created_by = auth.uid()) with check ((auth.jwt()->'app_metadata'->>'role') = 'teacher' and created_by = auth.uid());
drop policy if exists "Signed-in users read exams" on public.academic_exams;
create policy "Signed-in users read exams" on public.academic_exams for select to authenticated using (true);
drop policy if exists "Teachers manage exams" on public.academic_exams;
create policy "Teachers manage exams" on public.academic_exams for all to authenticated using ((auth.jwt()->'app_metadata'->>'role') = 'teacher' and created_by = auth.uid()) with check ((auth.jwt()->'app_metadata'->>'role') = 'teacher' and created_by = auth.uid());
drop policy if exists "Students read own results and teachers read all" on public.academic_results;
create policy "Students read own results and teachers read all" on public.academic_results for select to authenticated using (student_id = auth.uid() or (auth.jwt()->'app_metadata'->>'role') = 'teacher');
drop policy if exists "Teachers manage results" on public.academic_results;
create policy "Teachers manage results" on public.academic_results for all to authenticated using ((auth.jwt()->'app_metadata'->>'role') = 'teacher' and entered_by = auth.uid()) with check ((auth.jwt()->'app_metadata'->>'role') = 'teacher' and entered_by = auth.uid());
drop policy if exists "Students create own requests" on public.academic_requests;
create policy "Students create own requests" on public.academic_requests for insert to authenticated with check (student_id = auth.uid() and status = 'pending');
drop policy if exists "Students read own requests and teachers read all" on public.academic_requests;
create policy "Students read own requests and teachers read all" on public.academic_requests for select to authenticated using (student_id = auth.uid() or (auth.jwt()->'app_metadata'->>'role') = 'teacher');
drop policy if exists "Teachers review requests" on public.academic_requests;
create policy "Teachers review requests" on public.academic_requests for update to authenticated using ((auth.jwt()->'app_metadata'->>'role') = 'teacher') with check ((auth.jwt()->'app_metadata'->>'role') = 'teacher');
