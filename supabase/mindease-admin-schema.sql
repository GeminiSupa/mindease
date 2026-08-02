create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'client' check (role in ('client', 'therapist', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.therapists (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text not null default 'Clinical Psychologist',
  qualifications text,
  years_experience integer,
  specialization text,
  languages text[] not null default array['Urdu', 'English'],
  availability_status text not null default 'Available',
  profile_image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references auth.users(id) on delete set null,
  therapist_id uuid references public.therapists(id) on delete set null,
  client_name text,
  therapist_name text,
  concern text,
  scheduled_at timestamptz,
  status text not null default 'pending',
  amount numeric(12, 2) default 0,
  meeting_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  stripe_session_id text,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'PKR',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  topic text,
  message text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.therapists enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.contact_messages enable row level security;

create or replace function public.is_mindease_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_mindease_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = auth.uid() or public.is_mindease_admin())
with check (id = auth.uid() or public.is_mindease_admin());

drop policy if exists "admin_select_admins" on public.admin_users;
create policy "admin_select_admins"
on public.admin_users for select
using (public.is_mindease_admin());

drop policy if exists "therapists_public_read" on public.therapists;
create policy "therapists_public_read"
on public.therapists for select
using (true);

drop policy if exists "therapists_admin_write" on public.therapists;
create policy "therapists_admin_write"
on public.therapists for all
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "appointments_client_or_admin_read" on public.appointments;
create policy "appointments_client_or_admin_read"
on public.appointments for select
using (client_id = auth.uid() or public.is_mindease_admin());

drop policy if exists "appointments_admin_write" on public.appointments;
create policy "appointments_admin_write"
on public.appointments for all
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "payments_client_or_admin_read" on public.payments;
create policy "payments_client_or_admin_read"
on public.payments for select
using (
  public.is_mindease_admin()
  or exists (
    select 1
    from public.appointments
    where appointments.id = payments.appointment_id
      and appointments.client_id = auth.uid()
  )
);

drop policy if exists "payments_admin_write" on public.payments;
create policy "payments_admin_write"
on public.payments for all
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "contact_messages_public_insert" on public.contact_messages;
create policy "contact_messages_public_insert"
on public.contact_messages for insert
with check (true);

drop policy if exists "contact_messages_admin_read" on public.contact_messages;
create policy "contact_messages_admin_read"
on public.contact_messages for select
using (public.is_mindease_admin());

-- After creating your admin Auth user, run one of these with the user's UUID:
-- insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-000000000000');
-- update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000000';
