-- MindEase production upgrade migration
-- Run after supabase/mindease-admin-schema.sql.

create extension if not exists pgcrypto;

alter table public.contact_messages
  add column if not exists consent_accepted boolean not null default false,
  add column if not exists consent_text text,
  add column if not exists preferred_language text,
  add column if not exists preferred_time text,
  add column if not exists appointment_id uuid;

alter table public.appointments
  add column if not exists contact_message_id uuid references public.contact_messages(id) on delete set null,
  add column if not exists lifecycle_stage text not null default 'inquiry_received'
    check (lifecycle_stage in (
      'inquiry_received',
      'therapist_suggested',
      'client_confirmed',
      'payment_pending',
      'payment_recorded',
      'session_confirmed',
      'completed',
      'cancelled'
    )),
  add column if not exists client_confirmation_token text unique,
  add column if not exists client_confirmation_status text not null default 'pending'
    check (client_confirmation_status in ('pending', 'confirmed', 'declined')),
  add column if not exists payment_provider text not null default 'manual_placeholder',
  add column if not exists payment_reference text,
  add column if not exists payment_instructions text,
  add column if not exists payment_recorded_at timestamptz,
  add column if not exists notification_status text not null default 'not_configured'
    check (notification_status in ('not_configured', 'queued', 'sent', 'failed'));

do $$
begin
  alter table public.contact_messages
    add constraint contact_messages_appointment_id_fkey
    foreign key (appointment_id) references public.appointments(id) on delete set null;
exception
  when duplicate_object then null;
end $$;

alter table public.availability_slots
  add column if not exists slot_type text not null default 'available'
    check (slot_type in ('available', 'blocked')),
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('pending', 'approved', 'declined')),
  add column if not exists recurrence_rule text,
  add column if not exists recurrence_group_id uuid,
  add column if not exists notes text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

alter table public.admin_audit_logs
  add column if not exists subject_table text,
  add column if not exists subject_id uuid,
  add column if not exists details jsonb not null default '{}'::jsonb;

update public.admin_audit_logs
set
  subject_table = coalesce(subject_table, entity_table),
  subject_id = coalesce(subject_id, entity_id),
  details = case
    when details <> '{}'::jsonb then details
    else metadata
  end
where subject_table is null or subject_id is null or details = '{}'::jsonb;

create or replace function public.is_mindease_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where admin_users.user_id = auth.uid()
  );
$$;

create or replace function public.prevent_profile_role_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id
    and not public.is_mindease_admin()
    and new.role is distinct from old.role then
    raise exception 'Profile role cannot be changed by the profile owner.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_role_self_update on public.profiles;
create trigger prevent_profile_role_self_update
before update on public.profiles
for each row execute function public.prevent_profile_role_self_update();

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (id = auth.uid() or public.is_mindease_admin())
with check (id = auth.uid() or public.is_mindease_admin());

drop policy if exists "availability_public_read_open" on public.availability_slots;
create policy "availability_public_read_open"
on public.availability_slots for select
using (
  (is_booked = false and slot_type = 'available' and approval_status = 'approved')
  or public.is_mindease_admin()
  or public.is_assigned_therapist(therapist_id)
);

drop policy if exists "availability_therapist_write_own" on public.availability_slots;
create policy "availability_therapist_write_own"
on public.availability_slots for insert
with check (
  public.is_assigned_therapist(therapist_id)
  and approval_status = 'pending'
);

drop policy if exists "availability_therapist_update_own" on public.availability_slots;
create policy "availability_therapist_update_own"
on public.availability_slots for update
using (
  public.is_assigned_therapist(therapist_id)
  and is_booked = false
)
with check (
  public.is_assigned_therapist(therapist_id)
  and approval_status = 'pending'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mindease-media',
  'mindease-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "mindease_media_public_read" on storage.objects;
create policy "mindease_media_public_read"
on storage.objects for select
using (bucket_id = 'mindease-media');

drop policy if exists "mindease_media_admin_write" on storage.objects;
create policy "mindease_media_admin_write"
on storage.objects for all
using (bucket_id = 'mindease-media' and public.is_mindease_admin())
with check (bucket_id = 'mindease-media' and public.is_mindease_admin());

drop policy if exists "mindease_media_therapist_insert" on storage.objects;
create policy "mindease_media_therapist_insert"
on storage.objects for insert
with check (
  bucket_id = 'mindease-media'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = 'therapists'
  and exists (
    select 1 from public.therapists
    where therapists.user_id = auth.uid()
      and therapists.id::text = (storage.foldername(name))[2]
  )
);

create index if not exists contact_messages_appointment_idx on public.contact_messages(appointment_id);
create index if not exists appointments_contact_message_idx on public.appointments(contact_message_id);
create index if not exists appointments_confirmation_token_idx on public.appointments(client_confirmation_token);
create index if not exists appointments_lifecycle_idx on public.appointments(lifecycle_stage, created_at desc);
create index if not exists availability_approval_idx on public.availability_slots(approval_status, starts_at);
create index if not exists availability_recurrence_group_idx on public.availability_slots(recurrence_group_id);
create index if not exists admin_audit_logs_action_idx on public.admin_audit_logs(action, created_at desc);
