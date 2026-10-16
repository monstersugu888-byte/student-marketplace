-- CampusMate academic workflows: Supabase-only schema.
-- Run this file in Supabase SQL Editor before deploying the API changes.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student','teacher','admin')),
  teacher_access_status text not null default 'not_requested' check (teacher_access_status in ('not_requested','pending','approved','rejected')),
  department text not null default '',
  staff_id text not null default '',
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id text primary key,
  title text not null,
  description text not null default '',
  subject text not null default '',
  due_date date,
  priority text not null default 'Medium',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id text not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  submission_url text not null default '',
  submission_text text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  feedback text not null default '',
  unique (assignment_id, student_id)
);

create table if not exists public.attendance_subjects (
  id text primary key,
  student_id uuid references public.profiles(id) on delete cascade,
  subject text not null,
  code text not null default '',
  instructor text not null default '',
  attended_classes integer not null default 0 check (attended_classes >= 0),
  total_classes integer not null default 0 check (total_classes >= attended_classes),
  target_percentage numeric not null default 75,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject_id text references public.attendance_subjects(id) on delete set null,
  requested_date date not null default current_date,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.study_materials (
  id text primary key,
  title text not null,
  subject text not null default '',
  course_code text not null default '',
  semester text not null default '',
  type text not null default 'PDF',
  content text not null default '',
  storage_path text not null default '',
  download_url text not null default '',
  file_size text not null default '',
  uploaded_by text not null default '',
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  upload_date date not null default current_date,
  downloads_count integer not null default 0
);

create table if not exists public.material_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  material_id text not null references public.study_materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, material_id)
);

create index if not exists assignments_created_by_idx on public.assignments(created_by);
create index if not exists submissions_student_idx on public.assignment_submissions(student_id);
create index if not exists attendance_student_idx on public.attendance_subjects(student_id);
create index if not exists attendance_requests_status_idx on public.attendance_requests(status);
create index if not exists materials_subject_idx on public.study_materials(subject);

alter table public.profiles enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.attendance_subjects enable row level security;
alter table public.attendance_requests enable row level security;
alter table public.study_materials enable row level security;
alter table public.material_bookmarks enable row level security;

-- API routes use the service role only on the server after verifying the caller's JWT.
-- No client-side policies are granted here; service-role access must never reach the browser.


create table if not exists public.attendance_subject_templates (
  id text primary key,
  subject text not null,
  code text not null default '',
  instructor text not null default '',
  target_percentage numeric not null default 75,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.attendance_subject_templates enable row level security;

create table if not exists public.teacher_access_requests (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  department text not null default '',
  staff_id text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.teacher_access_requests enable row level security;

-- Private storage for teacher-uploaded course materials. File access is issued via signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-materials', 'study-materials', false, 20971520,
  array['application/pdf','image/png','image/jpeg','image/webp','text/plain','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = 20971520;


alter table public.attendance_subjects alter column student_id drop not null;

create table if not exists public.daily_tasks (
  id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  category text not null default 'General',
  created_at timestamptz not null default now(),
  primary key (user_id,id)
);
create table if not exists public.study_sessions (
  id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subject text not null default '',
  session_date date,
  start_time text not null default '',
  end_time text not null default '',
  notes text not null default '',
  location text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id,id)
);
create table if not exists public.user_notifications (
  id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null default '',
  notification_time timestamptz not null default now(),
  type text not null default 'announcement',
  read boolean not null default false,
  link text,
  primary key (user_id,id)
);
alter table public.daily_tasks enable row level security;
alter table public.study_sessions enable row level security;
alter table public.user_notifications enable row level security;

alter table public.attendance_requests add column if not exists requested_status text not null default 'Present' check (requested_status in ('Present','Absent'));

alter table public.assignment_submissions add column if not exists submission_path text not null default '';
