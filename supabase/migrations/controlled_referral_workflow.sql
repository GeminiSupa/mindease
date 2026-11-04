create extension if not exists pgcrypto;

create table if not exists public.client_referrals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  therapist_id uuid not null references public.therapists(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'therapist_review' check (status in ('therapist_review','therapist_accepted','therapist_declined','awaiting_client_consent','client_consented','client_declined','ready_to_book','booked','transferred','closed')),
  urgency text not null default 'routine' check (urgency in ('routine','priority','urgent')),
  risk_level text not null default 'not_assessed' check (risk_level in ('not_assessed','low','moderate','high','imminent')),
  client_display_name text not null default 'New client',
  presenting_concern text not null,
  limited_summary text not null,
  preferred_language text,
  preferred_format text,
  preferred_times text,
  budget_range text,
  match_reason text,
  coordinator_note text,
  therapist_response_note text,
  decline_reason text,
  therapist_responded_at timestamptz,
  client_consent_token uuid not null default gen_random_uuid() unique,
  client_consent_expires_at timestamptz not null default (now() + interval '7 days'),
  client_consent_at timestamptz,
  client_consent_scope text,
  transfer_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_messages (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.client_referrals(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('admin','therapist')),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.referral_access_logs (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.client_referrals(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null,
  event text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists client_referrals_therapist_status_idx on public.client_referrals(therapist_id, status);
create index if not exists client_referrals_lead_idx on public.client_referrals(lead_id);
create index if not exists referral_messages_referral_idx on public.referral_messages(referral_id, created_at);
create index if not exists referral_access_logs_referral_idx on public.referral_access_logs(referral_id, created_at desc);

alter table public.client_referrals enable row level security;
alter table public.referral_messages enable row level security;
alter table public.referral_access_logs enable row level security;

comment on table public.client_referrals is 'Consent-controlled coordinator to therapist referral workflow. Access is provided only through role-checked server routes.';
