-- MindEase Online Clinic - Supabase schema
-- Run this in Supabase SQL Editor after creating your project.
-- Create admin Auth users first, then add their UUID to public.admin_users.

create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('client', 'therapist', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.appointment_status as enum (
    'requested',
    'payment_pending',
    'confirmed',
    'completed',
    'cancelled',
    'reschedule_requested',
    'no_show'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum (
    'pending',
    'paid',
    'failed',
    'refunded',
    'partially_refunded'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_status as enum ('open', 'in_progress', 'closed', 'spam');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role public.user_role not null default 'client',
  timezone text not null default 'Asia/Karachi',
  preferred_language text not null default 'Urdu',
  emergency_contact_name text,
  emergency_contact_phone text,
  consent_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  default_duration_minutes integer not null default 50,
  default_price numeric(12, 2) not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.therapists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  slug text not null unique,
  full_name text not null,
  title text not null default 'Clinical Psychologist',
  qualifications text,
  years_experience integer,
  bio text,
  specialization text,
  languages text[] not null default array['Urdu', 'English'],
  therapy_methods text[] not null default '{}',
  profile_image_url text,
  session_fee numeric(12, 2) not null default 0,
  currency text not null default 'PKR',
  availability_status text not null default 'Available',
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  admin_notes text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.therapists
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists admin_notes text;

create table if not exists public.therapist_services (
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  price numeric(12, 2),
  duration_minutes integer,
  primary key (therapist_id, service_id)
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_booked boolean not null default false,
  hold_expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint availability_slot_time_check check (ends_at > starts_at)
);

create table if not exists public.intake_forms (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references auth.users(id) on delete set null,
  appointment_id uuid,
  primary_concern text,
  symptoms text,
  current_risk text,
  previous_therapy text,
  medication_notes text,
  preferred_language text,
  consent_accepted boolean not null default false,
  consent_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references auth.users(id) on delete set null,
  therapist_id uuid references public.therapists(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  availability_slot_id uuid references public.availability_slots(id) on delete set null,
  client_name text,
  client_email text,
  client_phone text,
  therapist_name text,
  concern text,
  scheduled_at timestamptz,
  duration_minutes integer not null default 50,
  status public.appointment_status not null default 'requested',
  amount numeric(12, 2) not null default 0,
  currency text not null default 'PKR',
  meeting_url text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.intake_forms
  drop constraint if exists intake_forms_appointment_id_fkey;

alter table public.intake_forms
  add constraint intake_forms_appointment_id_fkey
  foreign key (appointment_id) references public.appointments(id) on delete set null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  client_id uuid references auth.users(id) on delete set null,
  provider text not null default 'stripe',
  provider_session_id text,
  provider_payment_id text,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'PKR',
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  topic text,
  message text,
  source text not null default 'website',
  status public.message_status not null default 'open',
  assigned_to uuid references auth.users(id) on delete set null,
  suggested_therapist_id uuid references public.therapists(id) on delete set null,
  coordinator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contact_messages
  add column if not exists suggested_therapist_id uuid references public.therapists(id) on delete set null,
  add column if not exists coordinator_note text;

create table if not exists public.therapist_profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  requested_changes jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  client_id uuid references auth.users(id) on delete set null,
  therapist_id uuid references public.therapists(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  recipient_email text,
  recipient_phone text,
  channel text not null check (channel in ('email', 'sms', 'whatsapp')),
  template_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_table text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_therapists_updated_at on public.therapists;
create trigger touch_therapists_updated_at
before update on public.therapists
for each row execute function public.touch_updated_at();

drop trigger if exists touch_appointments_updated_at on public.appointments;
create trigger touch_appointments_updated_at
before update on public.appointments
for each row execute function public.touch_updated_at();

drop trigger if exists touch_contact_messages_updated_at on public.contact_messages;
create trigger touch_contact_messages_updated_at
before update on public.contact_messages
for each row execute function public.touch_updated_at();

drop trigger if exists touch_therapist_profile_change_requests_updated_at on public.therapist_profile_change_requests;
create trigger touch_therapist_profile_change_requests_updated_at
before update on public.therapist_profile_change_requests
for each row execute function public.touch_updated_at();

drop trigger if exists touch_blog_posts_updated_at on public.blog_posts;
create trigger touch_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.touch_updated_at();

create or replace function public.is_mindease_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where admin_users.user_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

create or replace function public.is_assigned_therapist(target_therapist_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'therapist'
  )
  and exists (
    select 1 from public.therapists
    where therapists.id = target_therapist_id
      and therapists.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.services enable row level security;
alter table public.therapists enable row level security;
alter table public.therapist_services enable row level security;
alter table public.availability_slots enable row level security;
alter table public.intake_forms enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;
alter table public.contact_messages enable row level security;
alter table public.reviews enable row level security;
alter table public.notification_queue enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.therapist_profile_change_requests enable row level security;
alter table public.blog_posts enable row level security;

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

drop policy if exists "admin_manage_admins" on public.admin_users;
create policy "admin_manage_admins"
on public.admin_users for all
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "services_public_read" on public.services;
create policy "services_public_read"
on public.services for select
using (is_active = true or public.is_mindease_admin());

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write"
on public.services for all
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "therapists_public_read" on public.therapists;
create policy "therapists_public_read"
on public.therapists for select
using ((is_active = true and approval_status = 'approved') or public.is_mindease_admin());

drop policy if exists "therapists_admin_write" on public.therapists;
create policy "therapists_admin_write"
on public.therapists for all
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "therapist_services_public_read" on public.therapist_services;
create policy "therapist_services_public_read"
on public.therapist_services for select
using (true);

drop policy if exists "therapist_services_admin_write" on public.therapist_services;
create policy "therapist_services_admin_write"
on public.therapist_services for all
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "availability_public_read_open" on public.availability_slots;
create policy "availability_public_read_open"
on public.availability_slots for select
using (is_booked = false or public.is_mindease_admin());

drop policy if exists "availability_admin_write" on public.availability_slots;
create policy "availability_admin_write"
on public.availability_slots for all
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "availability_therapist_write_own" on public.availability_slots;
create policy "availability_therapist_write_own"
on public.availability_slots for all
using (public.is_assigned_therapist(therapist_id))
with check (public.is_assigned_therapist(therapist_id));

drop policy if exists "intake_client_or_admin_read" on public.intake_forms;
create policy "intake_client_or_admin_read"
on public.intake_forms for select
using (client_id = auth.uid() or public.is_mindease_admin());

drop policy if exists "intake_client_insert" on public.intake_forms;
create policy "intake_client_insert"
on public.intake_forms for insert
with check (client_id = auth.uid() or public.is_mindease_admin());

drop policy if exists "intake_client_or_admin_update" on public.intake_forms;
create policy "intake_client_or_admin_update"
on public.intake_forms for update
using (client_id = auth.uid() or public.is_mindease_admin())
with check (client_id = auth.uid() or public.is_mindease_admin());

drop policy if exists "appointments_client_or_admin_read" on public.appointments;
create policy "appointments_client_or_admin_read"
on public.appointments for select
using (
  client_id = auth.uid()
  or public.is_mindease_admin()
  or public.is_assigned_therapist(therapist_id)
);

drop policy if exists "appointments_client_insert" on public.appointments;
create policy "appointments_client_insert"
on public.appointments for insert
with check (client_id = auth.uid() or public.is_mindease_admin());

drop policy if exists "appointments_admin_write" on public.appointments;
create policy "appointments_admin_write"
on public.appointments for update
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "payments_client_or_admin_read" on public.payments;
create policy "payments_client_or_admin_read"
on public.payments for select
using (
  client_id = auth.uid()
  or public.is_mindease_admin()
  or exists (
    select 1 from public.appointments
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

drop policy if exists "contact_messages_admin_update" on public.contact_messages;
create policy "contact_messages_admin_update"
on public.contact_messages for update
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "therapist_change_requests_admin_read" on public.therapist_profile_change_requests;
create policy "therapist_change_requests_admin_read"
on public.therapist_profile_change_requests for select
using (public.is_mindease_admin() or user_id = auth.uid());

drop policy if exists "therapist_change_requests_own_insert" on public.therapist_profile_change_requests;
create policy "therapist_change_requests_own_insert"
on public.therapist_profile_change_requests for insert
with check (user_id = auth.uid() and public.is_assigned_therapist(therapist_id));

drop policy if exists "therapist_change_requests_admin_update" on public.therapist_profile_change_requests;
create policy "therapist_change_requests_admin_update"
on public.therapist_profile_change_requests for update
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "blog_posts_public_read" on public.blog_posts;
create policy "blog_posts_public_read"
on public.blog_posts for select
using (status = 'published' or public.is_mindease_admin());

drop policy if exists "blog_posts_admin_write" on public.blog_posts;
create policy "blog_posts_admin_write"
on public.blog_posts for all
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
on public.reviews for select
using (is_public = true or client_id = auth.uid() or public.is_mindease_admin());

drop policy if exists "reviews_client_insert" on public.reviews;
create policy "reviews_client_insert"
on public.reviews for insert
with check (client_id = auth.uid());

drop policy if exists "notification_admin_only" on public.notification_queue;
create policy "notification_admin_only"
on public.notification_queue for all
using (public.is_mindease_admin())
with check (public.is_mindease_admin());

drop policy if exists "audit_admin_read" on public.admin_audit_logs;
create policy "audit_admin_read"
on public.admin_audit_logs for select
using (public.is_mindease_admin());

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists therapists_active_featured_idx on public.therapists(is_active, is_featured);
create index if not exists therapists_approval_idx on public.therapists(approval_status, is_active, created_at desc);
create index if not exists availability_therapist_time_idx on public.availability_slots(therapist_id, starts_at);
create index if not exists availability_open_time_idx on public.availability_slots(starts_at) where is_booked = false;
create index if not exists appointments_client_time_idx on public.appointments(client_id, scheduled_at desc);
create index if not exists appointments_therapist_time_idx on public.appointments(therapist_id, scheduled_at desc);
create index if not exists appointments_status_idx on public.appointments(status);
create index if not exists payments_appointment_idx on public.payments(appointment_id);
create index if not exists contact_messages_status_idx on public.contact_messages(status, created_at desc);
create index if not exists notification_queue_due_idx on public.notification_queue(status, scheduled_for);
create index if not exists therapist_change_requests_status_idx on public.therapist_profile_change_requests(status, created_at desc);
create index if not exists blog_posts_status_published_idx on public.blog_posts(status, published_at desc);

insert into public.services (slug, name, description, default_duration_minutes, default_price, sort_order)
values
  ('anxiety-panic', 'Anxiety and panic support', 'Support for anxiety, panic, phobias, and worry cycles.', 50, 4500, 10),
  ('depression-counselling', 'Depression counselling', 'Therapy for low mood, motivation, sleep, and functioning.', 50, 4500, 20),
  ('stress-burnout', 'Stress and burnout', 'Care for work stress, academic pressure, and emotional exhaustion.', 50, 4500, 30),
  ('relationship-therapy', 'Relationship therapy', 'Individual, couple, and family counselling for relational concerns.', 50, 5500, 40),
  ('child-family', 'Child and family therapy', 'Parent guidance, child concerns, academic stress, and family therapy.', 50, 5000, 50),
  ('addiction-support', 'Addiction support', 'Counselling and relapse-prevention support for substance and behavioral concerns.', 50, 5000, 60)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  default_duration_minutes = excluded.default_duration_minutes,
  default_price = excluded.default_price,
  sort_order = excluded.sort_order;

insert into public.therapist_services (therapist_id, service_id, price, duration_minutes)
select therapists.id, services.id, therapists.session_fee, services.default_duration_minutes
from public.therapists
cross join public.services
where therapists.is_active = true and therapists.approval_status = 'approved'
on conflict (therapist_id, service_id) do update set
  price = excluded.price,
  duration_minutes = excluded.duration_minutes;

-- After creating your Supabase Auth admin user, paste their UUID here:
-- insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-000000000000')
-- on conflict (user_id) do nothing;
