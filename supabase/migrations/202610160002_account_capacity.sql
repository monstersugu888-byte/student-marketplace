-- Studora account caps: 20 teacher accounts and 200 student accounts.
-- Counts are enforced at the Supabase Auth database level, so concurrent signups
-- cannot bypass the limits. Teacher signup must send user_metadata.role = 'teacher'.
create or replace function public.enforce_studora_account_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  teacher_count bigint;
  student_count bigint;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'student');

  if requested_role not in ('student', 'teacher') then
    raise exception 'Invalid account role.';
  end if;

  -- Serialize signups so two concurrent requests cannot exceed the caps.
  perform pg_catalog.pg_advisory_xact_lock(746201610);

  select count(*) into teacher_count
  from auth.users u
  where coalesce(u.raw_user_meta_data ->> 'role', 'student') = 'teacher';

  select count(*) into student_count
  from auth.users u
  where coalesce(u.raw_user_meta_data ->> 'role', 'student') <> 'teacher';

  if requested_role = 'teacher' and teacher_count >= 20 then
    raise exception 'Studora has reached its limit of 20 teacher registrations.';
  end if;

  if requested_role = 'student' and student_count >= 200 then
    raise exception 'Studora has reached its limit of 200 student registrations.';
  end if;

  return new;
end;
$$;

drop trigger if exists studora_account_capacity_guard on auth.users;
create trigger studora_account_capacity_guard
before insert on auth.users
for each row execute function public.enforce_studora_account_limits();
