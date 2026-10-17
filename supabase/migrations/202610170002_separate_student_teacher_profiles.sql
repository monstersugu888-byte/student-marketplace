-- Studora: physically separate student and teacher profile tables in the existing Supabase database.
-- This does NOT create two independent database projects. It creates role-separated tables
-- with row-level security. Authentication remains in Supabase Auth.
begin;

create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  major text not null default '',
  college text not null default '',
  semester text not null default '',
  student_id text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  department text not null default '',
  staff_id text not null default '',
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profiles enable row level security;
alter table public.teacher_profiles enable row level security;

revoke all on public.student_profiles from anon;
revoke all on public.teacher_profiles from anon;
grant select, insert, update on public.student_profiles to authenticated;
grant select, insert, update on public.teacher_profiles to authenticated;

drop policy if exists "Students read own student profile" on public.student_profiles;
create policy "Students read own student profile"
on public.student_profiles for select to authenticated
using (user_id = auth.uid() and coalesce(auth.jwt()->'app_metadata'->>'role', 'student') = 'student');

drop policy if exists "Students create own student profile" on public.student_profiles;
create policy "Students create own student profile"
on public.student_profiles for insert to authenticated
with check (user_id = auth.uid() and coalesce(auth.jwt()->'app_metadata'->>'role', 'student') = 'student');

drop policy if exists "Students update own student profile" on public.student_profiles;
create policy "Students update own student profile"
on public.student_profiles for update to authenticated
using (user_id = auth.uid() and coalesce(auth.jwt()->'app_metadata'->>'role', 'student') = 'student')
with check (user_id = auth.uid() and coalesce(auth.jwt()->'app_metadata'->>'role', 'student') = 'student');

drop policy if exists "Approved teachers read student profiles" on public.student_profiles;
create policy "Approved teachers read student profiles"
on public.student_profiles for select to authenticated
using (auth.jwt()->'app_metadata'->>'role' = 'teacher');

drop policy if exists "Teachers read own teacher profile" on public.teacher_profiles;
create policy "Teachers read own teacher profile"
on public.teacher_profiles for select to authenticated
using (user_id = auth.uid() and auth.jwt()->'app_metadata'->>'role' = 'teacher');

drop policy if exists "Teachers create own teacher profile" on public.teacher_profiles;
create policy "Teachers create own teacher profile"
on public.teacher_profiles for insert to authenticated
with check (user_id = auth.uid() and auth.jwt()->'app_metadata'->>'role' = 'teacher');

drop policy if exists "Teachers update own teacher profile" on public.teacher_profiles;
create policy "Teachers update own teacher profile"
on public.teacher_profiles for update to authenticated
using (user_id = auth.uid() and auth.jwt()->'app_metadata'->>'role' = 'teacher')
with check (user_id = auth.uid() and auth.jwt()->'app_metadata'->>'role' = 'teacher');

-- Keep role-specific profiles in separate tables when an Auth user is created.
create or replace function public.create_studora_role_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  full_name_value text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'student');
  full_name_value := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '');

  if requested_role = 'teacher' then
    insert into public.teacher_profiles (user_id, full_name, email, department, staff_id, approval_status)
    values (
      new.id,
      full_name_value,
      coalesce(new.email, ''),
      coalesce(new.raw_user_meta_data ->> 'department', ''),
      coalesce(new.raw_user_meta_data ->> 'staff_id', ''),
      'pending'
    )
    on conflict (user_id) do nothing;
  else
    insert into public.student_profiles (user_id, full_name, email, major, college, semester, student_id)
    values (
      new.id,
      full_name_value,
      coalesce(new.email, ''),
      coalesce(new.raw_user_meta_data ->> 'major', ''),
      coalesce(new.raw_user_meta_data ->> 'college', ''),
      coalesce(new.raw_user_meta_data ->> 'semester', ''),
      coalesce(new.raw_user_meta_data ->> 'student_id', '')
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists studora_create_role_profile on auth.users;
create trigger studora_create_role_profile
after insert on auth.users
for each row execute function public.create_studora_role_profile();

-- Backfill existing Auth users without moving or deleting any existing records.
insert into public.teacher_profiles (user_id, full_name, email, department, staff_id, approval_status)
select u.id,
       coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
       coalesce(u.email, ''),
       coalesce(u.raw_user_meta_data ->> 'department', ''),
       coalesce(u.raw_user_meta_data ->> 'staff_id', ''),
       case when u.raw_app_meta_data ->> 'role' = 'teacher' then 'approved' else 'pending' end
from auth.users u
where u.raw_user_meta_data ->> 'role' = 'teacher'
on conflict (user_id) do nothing;

insert into public.student_profiles (user_id, full_name, email, major, college, semester, student_id)
select u.id,
       coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
       coalesce(u.email, ''),
       coalesce(u.raw_user_meta_data ->> 'major', ''),
       coalesce(u.raw_user_meta_data ->> 'college', ''),
       coalesce(u.raw_user_meta_data ->> 'semester', ''),
       coalesce(u.raw_user_meta_data ->> 'student_id', '')
from auth.users u
where coalesce(u.raw_user_meta_data ->> 'role', 'student') <> 'teacher'
on conflict (user_id) do nothing;

commit;
